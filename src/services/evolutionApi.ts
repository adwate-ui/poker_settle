import { supabase } from "@/integrations/supabase/client";

export interface EvolutionApiConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

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
  private config: EvolutionApiConfig | null = null;

  /**
   * Initialize the Evolution API service with configuration
   */
  configure(config: EvolutionApiConfig) {
    this.config = config;
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Get the current configuration (without exposing sensitive data)
   */
  getConfigStatus() {
    if (!this.config) {
      return { configured: false };
    }
    return {
      configured: true,
      hasBaseUrl: !!this.config.baseUrl,
      hasApiKey: !!this.config.apiKey,
      hasInstanceName: !!this.config.instanceName,
    };
  }

  /**
   * Send a WhatsApp message via Evolution API
   */
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    if (!this.isConfigured()) {
      console.warn('Evolution API not configured. Message not sent.');
      return {
        success: false,
        error: 'Evolution API not configured',
      };
    }

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
   * Test the connection to Evolution API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !this.config) {
      return {
        success: false,
        error: 'Evolution API not configured',
      };
    }

    try {
      const url = `${this.config.baseUrl}/instance/connectionState/${this.config.instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: data.state === 'open' || data.instance?.state === 'open',
        error: data.state !== 'open' && data.instance?.state !== 'open'
          ? 'WhatsApp instance not connected'
          : undefined,
      };
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
