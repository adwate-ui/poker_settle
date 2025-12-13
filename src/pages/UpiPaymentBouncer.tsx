import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
      navigate('/', { replace: true });
      return;
    }

    // Build UPI intent link
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

    // Redirect to UPI link
    window.location.href = upiLink;

    // Fallback: if redirect doesn't work after 2 seconds, show error or go back
    const timeoutId = setTimeout(() => {
      // If we're still on this page, the UPI app didn't open
      // Show a message or navigate back
      console.log('UPI app did not open. User may need to install a UPI app.');
      // Optionally navigate back or show an error message
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-base text-muted-foreground">Opening payment app...</p>
        <p className="text-sm text-muted-foreground">If nothing happens, please install a UPI app</p>
      </div>
    </div>
  );
};

export default UpiPaymentBouncer;
