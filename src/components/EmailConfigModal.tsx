import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mail } from 'lucide-react';

interface EmailConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export const EmailConfigModal: React.FC<EmailConfigModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [skipSetup, setSkipSetup] = useState(false);
  const [formData, setFormData] = useState({
    emailjs_service_id: '',
    emailjs_template_id: '',
    emailjs_public_key: '',
    from_email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_configured: true,
          emailjs_service_id: formData.emailjs_service_id || null,
          emailjs_template_id: formData.emailjs_template_id || null,
          emailjs_public_key: formData.emailjs_public_key || null,
          from_email: formData.from_email || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Email configuration saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving email config:', error);
      toast.error('Failed to save email configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    
    setSkipSetup(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_configured: true })
        .eq('id', user.id);

      if (error) throw error;

      toast.info('Email notifications skipped. You can configure them later in Profile settings.');
      onClose();
    } catch (error) {
      console.error('Error skipping email config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSkipSetup(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configure Email Notifications
          </DialogTitle>
          <DialogDescription>
            Set up EmailJS to receive game notifications and settlement reminders via email.
            This is optional and can be configured later in your profile settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from_email">Your Email Address</Label>
            <Input
              id="from_email"
              type="email"
              value={formData.from_email}
              onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
              placeholder="your.email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_id">
              EmailJS Service ID 
              <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Input
              id="service_id"
              value={formData.emailjs_service_id}
              onChange={(e) => setFormData({ ...formData, emailjs_service_id: e.target.value })}
              placeholder="service_xxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_id">
              EmailJS Template ID
              <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Input
              id="template_id"
              value={formData.emailjs_template_id}
              onChange={(e) => setFormData({ ...formData, emailjs_template_id: e.target.value })}
              placeholder="template_xxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public_key">
              EmailJS Public Key
              <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Input
              id="public_key"
              value={formData.emailjs_public_key}
              onChange={(e) => setFormData({ ...formData, emailjs_public_key: e.target.value })}
              placeholder="Your public key"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Get your EmailJS credentials from{' '}
              <a
                href="https://www.emailjs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                emailjs.com
              </a>
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={loading || skipSetup}
              className="flex-1"
            >
              {skipSetup ? 'Skipping...' : 'Skip for Now'}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
