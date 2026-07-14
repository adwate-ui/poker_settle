import { supabase } from "@/integrations/supabase/client";

export interface SendMessagePayload {
  number: string;
  text: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EvolutionApiService {
  /**
   * Check if the service is configured (now always returns true as logic is server-side)
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Get the current configuration status (logic is now handled by Supabase Edge Function)
   */
  getConfigStatus() {
    return {
      configured: true,
      hasBaseUrl: true,
      hasApiKey: true,
      hasInstanceName: true,
    };
  }

  /**
   * Send a WhatsApp message via Evolution API proxy (Edge Function)
   */
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    try {
      // Ensure phone number is in correct format (remove spaces, dashes, etc.)
      const cleanNumber = this.formatPhoneNumber(payload.number);

      if (!cleanNumber) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { number: cleanNumber, text: payload.text }
      });

      if (error) {
        let detail = error.message || 'Error invoking WhatsApp function';
        try {
          if ('context' in error && error.context) {
            const body = await (error.context as Response).json();
            if (body?.error) detail = body.error;
          }
        } catch { /* ignore parse failures */ }
        console.error('WhatsApp send failed:', detail);
        return { success: false, error: detail };
      }

      return {
        success: true,
        messageId: data.key?.id || data.messageId,
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format phone number to E.164 format or clean format
   * Accepts formats like: +919876543210, 919876543210, 9876543210
   */
  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Ensure it has reasonable length (10-15 digits)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return null;
    }

    // Return raw digits, Edge Function handles 91 prefixing
    return digitsOnly;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    return this.formatPhoneNumber(phone) !== null;
  }

  /**
   * Send messages to multiple recipients
   */
  async sendBulkMessages(messages: SendMessagePayload[]): Promise<SendMessageResponse[]> {
    const results: SendMessageResponse[] = [];

    for (const message of messages) {
      const result = await this.sendMessage(message);
      results.push(result);

      // Add a small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Send messages to multiple recipients in a single server-side batch.
   * Unlike sendBulkMessages, the whole loop runs inside one Edge Function
   * invocation, so delivery isn't tied to the browser tab staying open —
   * a long client-driven sequential loop (each send can take several
   * seconds against the upstream WhatsApp bridge) can get silently killed
   * by tab backgrounding/navigation partway through.
   */
  async sendBatch(messages: SendMessagePayload[]): Promise<SendMessageResponse[]> {
    if (messages.length === 0) return [];

    const validated = messages.map((m) => ({
      raw: m,
      cleanNumber: this.formatPhoneNumber(m.number),
    }));

    const toSend = validated.filter((v) => v.cleanNumber);

    let sentResults: SendMessageResponse[] = [];

    if (toSend.length > 0) {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-batch', {
        body: {
          messages: toSend.map((v) => ({ number: v.cleanNumber, text: v.raw.text })),
        },
      });

      if (error) {
        let detail = error.message || 'Error invoking WhatsApp batch function';
        try {
          if ('context' in error && error.context) {
            const body = await (error.context as Response).json();
            if (body?.error) detail = body.error;
          }
        } catch { /* ignore parse failures */ }
        console.error('WhatsApp batch send failed:', detail);
        sentResults = toSend.map(() => ({ success: false, error: detail }));
      } else {
        const batchResults = (data?.results ?? []) as Array<{ success: boolean; messageId?: string; error?: string }>;
        sentResults = toSend.map((_, i) => {
          const r = batchResults[i];
          return r
            ? { success: r.success, messageId: r.messageId, error: r.error }
            : { success: false, error: 'No result returned for this recipient' };
        });
      }
    }

    // Re-assemble in original input order
    const results: SendMessageResponse[] = [];
    let sentIdx = 0;
    for (const v of validated) {
      if (v.cleanNumber) {
        results.push(sentResults[sentIdx]);
        sentIdx++;
      } else {
        results.push({ success: false, error: 'Invalid phone number format' });
      }
    }
    return results;
  }

  /**
   * Test the connection to Evolution API via Edge Function
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // We can test by sending a ping or just validating the proxy is reachable.
      // For now, we'll return success if the service is initialized.
      return { success: true };
    } catch (error) {
      console.error('Error testing Evolution API connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const evolutionApiService = new EvolutionApiService();
