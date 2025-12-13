import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    // Validate UPI ID format (identifier@provider)
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(pa)) {
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

    return () => clearTimeout(timeoutId);
  }, [searchParams, navigate]);

  if (showError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <h1 className="text-xl font-bold">Unable to Open Payment App</h1>
          <p className="text-base text-muted-foreground">
            Please make sure you have a UPI app installed (Google Pay, PhonePe, Paytm, etc.)
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-base text-muted-foreground">Opening payment app...</p>
        <p className="text-sm text-muted-foreground">Please wait a moment</p>
      </div>
    </div>
  );
};

export default UpiPaymentBouncer;
