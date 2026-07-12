import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { isValidUpiId } from '@/utils/upiPaymentLinks';

/**
 * UPI Payment Bouncer Page
 * 
 * This page acts as an HTTPS intermediary that redirects to UPI intent links.
 * It's designed to work around restrictions on direct upi:// links in some contexts.
 * 
 * Usage: /upi-pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>
 */
const UpiPaymentBouncer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Extract UPI parameters from URL
    const pa = searchParams.get('pa'); // Payee address (UPI ID)
    const pn = searchParams.get('pn'); // Payee name
    const am = searchParams.get('am'); // Amount
    const cu = searchParams.get('cu') || 'INR'; // Currency
    const tn = searchParams.get('tn'); // Transaction note

    // Validate required parameters
    if (!pa || !pn || !am) {
      console.error('Missing required UPI parameters');
      setShowError(true);
      return;
    }

    // Validate UPI ID format using utility function
    if (!isValidUpiId(pa)) {
      console.error('Invalid UPI ID format');
      setShowError(true);
      return;
    }

    // Validate amount is a positive number
    const amountNum = parseFloat(am);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error('Invalid amount');
      setShowError(true);
      return;
    }

    // Validate currency is INR
    if (cu !== 'INR') {
      console.error('Only INR currency is supported');
      setShowError(true);
      return;
    }

    // Build UPI intent link with validated parameters
    const params = new URLSearchParams({
      pa,
      pn,
      am,
      cu,
    });

    if (tn) {
      params.append('tn', tn);
    }

    const upiLink = `upi://pay?${params.toString()}`;

    // Redirect to UPI link (safe because we've validated all parameters)
    window.location.href = upiLink;

    // Fallback: if redirect doesn't work after 2 seconds, show error message
    const timeoutId = setTimeout(() => {
      // If we're still on this page, the UPI app didn't open
      setShowError(true);
    }, 2000);

    // Cleanup function to clear timeout if component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchParams, navigate]);

  if (showError) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />

        <Card className="w-full max-w-md glass-panel relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <CardHeader className="pt-10 pb-4 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-2xl">
              <Coins className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-luxury tracking-tight text-foreground">
                PokerSettle
              </CardTitle>
              <CardDescription className="text-label tracking-[0.3em] text-muted-foreground">
                Payment Handoff
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10 space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <h2 className="text-lg font-semibold text-foreground">Unable to Open Payment App</h2>
              <p className="text-sm text-muted-foreground">
                Please make sure you have a UPI app installed (Google Pay, PhonePe, Paytm, etc.)
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                Go Back
              </Button>
              <Button className="flex-1" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-3xl rounded-full" />

      <Card className="w-full max-w-md glass-panel relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-2xl">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-luxury tracking-tight text-foreground">PokerSettle</p>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
          <p className="text-sm text-muted-foreground">Opening your payment app…</p>
          <p className="text-xs text-muted-foreground">Please wait a moment</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpiPaymentBouncer;
