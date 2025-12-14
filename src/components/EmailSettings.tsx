import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Save, Eye, EyeOff, TestTube, HelpCircle } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export const EmailSettings: React.FC = () => {
  const { preferences, loading, saving, updateEmailSettings, isEmailConfigured } = useUserPreferences();
  
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    if (preferences) {
      setServiceId(preferences.email_service_id || '');
      setTemplateId(preferences.email_template_id || '');
      setPublicKey(preferences.email_public_key || '');
      setFromEmail(preferences.email_from_address || '');
      setFromName(preferences.email_from_name || '');
    }
  }, [preferences]);

  const handleSave = async () => {
    const success = await updateEmailSettings({
      email_service_id: serviceId || undefined,
      email_template_id: templateId || undefined,
      email_public_key: publicKey || undefined,
      email_from_address: fromEmail || undefined,
      email_from_name: fromName || undefined,
    });

    if (!success) {
      // Error is already handled by updateEmailSettings with toast
      return;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure EmailJS for sending notifications</CardDescription>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Setup Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Email Configuration Guide</DialogTitle>
                <DialogDescription>
                  Step-by-step instructions to configure email notifications
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base mb-2">Step 1: Create an EmailJS Account</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">emailjs.com</a></li>
                      <li>Sign up for a free account (100 emails/month free)</li>
                      <li>Verify your email address</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Step 2: Add Email Service</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to the "Email Services" section</li>
                      <li>Click "Add New Service"</li>
                      <li>Choose your email provider (Gmail recommended)</li>
                      <li>Follow the setup instructions for your provider</li>
                      <li>Copy the <strong>Service ID</strong> (e.g., "service_xxxxxx")</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Step 3: Create Email Template</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to "Email Templates" section</li>
                      <li>Click "Create New Template"</li>
                      <li>In the "Settings" tab:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Set "To Email" field to: <code className="bg-muted px-1 py-0.5 rounded">{'{{to_email}}'}</code></li>
                          <li>Set "Reply To" field to: <code className="bg-muted px-1 py-0.5 rounded">pokersettleapp@gmail.com</code></li>
                        </ul>
                      </li>
                      <li>In the "Content" tab, use this template:
                        <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto">
{`Subject: {{subject}}

Hi {{to_name}},

{{message}}

Best regards,
{{from_name}}`}
                        </pre>
                      </li>
                      <li>Save the template and copy the <strong>Template ID</strong> (e.g., "template_xxxxxx")</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Step 4: Get Your Public Key</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to "Account" section</li>
                      <li>Find "API Keys" or "Public Key"</li>
                      <li>Copy your <strong>Public Key</strong> (e.g., "xxxxxxxxxxxxxxxxxxx")</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Step 5: Configure Below</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Paste your Service ID, Template ID, and Public Key in the fields below</li>
                      <li>Enter your email address (from which emails will be sent)</li>
                      <li>Enter a display name (e.g., "Poker Settle")</li>
                      <li>Click "Save Configuration"</li>
                    </ol>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Important:</strong> All replies to your emails will be sent to pokersettleapp@gmail.com 
                      for payment confirmation processing. This is configured automatically.
                    </AlertDescription>
                  </Alert>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmailConfigured() && (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Email notifications are configured and ready to use.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="serviceId">Service ID</Label>
            <Input
              id="serviceId"
              type={showKeys ? 'text' : 'password'}
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="service_xxxxxxxx"
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="templateId">Template ID</Label>
            <Input
              id="templateId"
              type={showKeys ? 'text' : 'password'}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="template_xxxxxxxx"
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="publicKey">Public Key</Label>
            <Input
              id="publicKey"
              type={showKeys ? 'text' : 'password'}
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxx"
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="fromEmail">From Email Address</Label>
            <Input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="your-email@gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Poker Settle"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeys(!showKeys)}
            >
              {showKeys ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Keys
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Keys
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
