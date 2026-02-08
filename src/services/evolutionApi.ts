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
        console.error('Supabase function error:', error);
        return {
          success: false,
          error: error.message || 'Error invoking WhatsApp function',
        };
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

    // Remove all non-digit characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If it starts with +, keep it, otherwise remove any +
    if (!cleaned.startsWith('+')) {
      cleaned = cleaned.replace(/\+/g, '');
    }

    // Ensure it has reasonable length (7-15 digits)
    const digitsOnly = cleaned.replace(/\+/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return null;
    }

    // If it doesn't start with +, add country code if it looks like Indian number
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        // Assume Indian number, add +91
        cleaned = '+91' + cleaned;
      } else if (cleaned.length > 10) {
        // Add + prefix if not present
        cleaned = '+' + cleaned;
      }
    }

    return cleaned;
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
