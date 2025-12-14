import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Save, Plus, X, HelpCircle } from 'lucide-react';
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

export const PaymentSettings: React.FC = () => {
  const { preferences, loading, saving, updatePaymentKeywords } = useUserPreferences();
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (preferences?.payment_keywords) {
      setKeywords(preferences.payment_keywords);
    }
  }, [preferences]);

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toUpperCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleSave = async () => {
    await updatePaymentKeywords(keywords);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
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
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Payment Confirmation</CardTitle>
              <CardDescription>
                Keywords that trigger automatic payment confirmation
              </CardDescription>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                How it Works
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Payment Confirmation Setup</DialogTitle>
                <DialogDescription>
                  Automatically confirm payments when players reply with specific keywords
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">How It Works</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>When you send a settlement notification to a player, they receive an email with payment instructions</li>
                    <li>The email has a "Reply To" address of pokersettleapp@gmail.com</li>
                    <li>When the player replies with any of the keywords you've configured (e.g., "PAID", "DONE"), a webhook processes the email</li>
                    <li>The system automatically marks their payment as confirmed</li>
                  </ol>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Keywords are case-insensitive.</strong> "paid", "PAID", and "Paid" all work the same way.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2">Best Practices</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Use simple, common words like "PAID", "DONE", "COMPLETE"</li>
                    <li>Avoid words that might appear in regular conversation</li>
                    <li>Keep the list short and memorable for players</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Setting Up the Webhook</h3>
                  <p className="mb-2">For payment confirmation to work automatically, you need to:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Set up a Zapier webhook to forward emails from pokersettleapp@gmail.com</li>
                    <li>See PAYMENT_CONFIRMATION_WEBHOOK.md in the repository for detailed instructions</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="newKeyword">Add Confirmation Keywords</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="newKeyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., PAID, DONE, COMPLETE"
              className="uppercase"
            />
            <Button onClick={handleAddKeyword} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <div>
          <Label>Current Keywords</Label>
          <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border rounded-md">
            {keywords.length === 0 ? (
              <span className="text-sm text-muted-foreground">No keywords configured</span>
            ) : (
              keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            Players can reply to settlement emails with any of these keywords to automatically 
            confirm their payment. Keywords are case-insensitive and matched as whole words.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Keywords'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
