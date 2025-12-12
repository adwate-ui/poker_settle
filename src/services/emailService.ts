/**
 * Email Service
 * Handles sending emails for notifications (replacement for WhatsApp)
 * Uses EmailJS for client-side email sending
 */

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface SendEmailPayload {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  html_message?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private config: EmailConfig | null = null;

  /**
   * Initialize the Email service with configuration
   */
  configure(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return this.config !== null && 
           !!this.config.serviceId && 
           !!this.config.templateId && 
           !!this.config.publicKey &&
           !!this.config.fromEmail;
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
      hasServiceId: !!this.config.serviceId,
      hasTemplateId: !!this.config.templateId,
      hasPublicKey: !!this.config.publicKey,
      hasFromEmail: !!this.config.fromEmail,
    };
  }

  /**
   * Send an email using EmailJS
   */
  async sendEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
    if (!this.isConfigured() || !this.config) {
      console.warn('❌ Email service not configured. Email not sent.');
      console.warn('Configuration status:', this.getConfigStatus());
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      // Validate email format
      if (!this.validateEmail(payload.to_email)) {
        console.error('❌ Invalid email format:', payload.to_email);
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      console.log(`📧 Sending email to ${payload.to_email} - Subject: ${payload.subject}`);

      // Import EmailJS dynamically
      const emailjs = await import('@emailjs/browser');
      
      // Prepare template parameters
      const templateParams = {
        to_email: payload.to_email,
        to_name: payload.to_name,
        from_email: this.config.fromEmail,
        from_name: this.config.fromName || 'Poker Settle',
        subject: payload.subject,
        message: payload.message,
        html_message: payload.html_message || this.convertTextToHtml(payload.message),
      };

      // Send email via EmailJS
      const response = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams,
        this.config.publicKey
      );

      if (response.status === 200) {
        console.log(`✅ Email sent successfully to ${payload.to_email}`);
        return {
          success: true,
          messageId: response.text,
        };
      } else {
        console.error(`❌ Email send failed with status: ${response.status}`);
        return {
          success: false,
          error: `Email send failed with status: ${response.status}`,
        };
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert plain text to simple HTML
   */
  private convertTextToHtml(text: string): string {
    return text
      .split('\n')
      .map(line => {
        // Convert markdown-style bold (*text*)
        line = line.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        
        // Convert URLs to links (including UPI payment links)
        line = line.replace(
          /((?:https?|upi):\/\/[^\s]+)/g,
          '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$1</a>'
        );
        
        return line;
      })
      .join('<br>');
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Public email validation method
   */
  validateEmailAddress(email: string): boolean {
    return this.validateEmail(email);
  }

  /**
   * Send emails to multiple recipients
   */
  async sendBulkEmails(emails: SendEmailPayload[]): Promise<SendEmailResponse[]> {
    const results: SendEmailResponse[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      // Add a small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  /**
   * Test the email service configuration
   */
  async testConnection(testEmail?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !this.config) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      // Send a test email
      const result = await this.sendEmail({
        to_email: testEmail || this.config.fromEmail,
        to_name: 'Test User',
        subject: 'Poker Settle - Test Email',
        message: 'This is a test email from Poker Settle to verify email configuration.',
      });

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Error testing email service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Initialize from environment variables if available
// Auto-initialize on module load
try {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const fromEmail = import.meta.env.VITE_FROM_EMAIL;
  const fromName = import.meta.env.VITE_FROM_NAME;

  console.log('📧 EmailJS Configuration Check:', {
    hasServiceId: !!serviceId,
    hasTemplateId: !!templateId,
    hasPublicKey: !!publicKey,
    hasFromEmail: !!fromEmail,
    serviceIdPreview: serviceId ? `${serviceId.substring(0, 8)}...` : 'missing',
    templateIdPreview: templateId ? `${templateId.substring(0, 8)}...` : 'missing',
    publicKeyPreview: publicKey ? `${publicKey.substring(0, 8)}...` : 'missing',
    fromEmail: fromEmail || 'missing',
  });

  if (serviceId && templateId && publicKey && fromEmail) {
    emailService.configure({
      serviceId,
      templateId,
      publicKey,
      fromEmail,
      fromName,
    });
    console.log('✅ EmailJS service configured successfully');
    console.log('   Service ID:', `${serviceId.substring(0, 10)}...`);
    console.log('   Template ID:', `${templateId.substring(0, 10)}...`);
    console.log('   From Email:', fromEmail);
  } else {
    console.warn('⚠️ EmailJS configuration incomplete. Email notifications will not work.');
    console.warn('   Please set the following environment variables in your .env file:');
    if (!serviceId) console.warn('   - VITE_EMAILJS_SERVICE_ID');
    if (!templateId) console.warn('   - VITE_EMAILJS_TEMPLATE_ID');
    if (!publicKey) console.warn('   - VITE_EMAILJS_PUBLIC_KEY');
    if (!fromEmail) console.warn('   - VITE_FROM_EMAIL');
    console.warn('   See EMAIL_SETUP_GUIDE.md for setup instructions');
  }
} catch (error) {
  console.error('❌ Failed to initialize EmailJS service:', error);
}
