/**
 * Player Form Dialog Component
 * Form for creating/editing players with phone number and UPI ID
 */

import { useState } from "react";
import { Player } from "@/types/poker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { determinePaymentPreference, validateUpiId, getPaymentMethodIcon } from "@/utils/playerUtils";
import { Loader2, Smartphone, CreditCard, User } from "lucide-react";

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (playerData: PlayerFormData) => Promise<void>;
  initialData?: Player;
  title?: string;
  description?: string;
}

export interface PlayerFormData {
  name: string;
  phone_number?: string;
  upi_id?: string;
  payment_preference?: 'upi' | 'cash';
}

export const PlayerFormDialog = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  title = "Add New Player",
  description = "Enter player details including WhatsApp number and UPI ID for payments.",
}: PlayerFormDialogProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number || "");
  const [upiId, setUpiId] = useState(initialData?.upi_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentPreference = determinePaymentPreference(upiId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Player name is required");
      return;
    }

    // Validate UPI ID format if provided
    if (upiId.trim() && !validateUpiId(upiId)) {
      toast.error("Invalid UPI ID format. Use format: username@provider");
      return;
    }

    setIsSubmitting(true);
    try {
      const playerData: PlayerFormData = {
        name: name.trim(),
        phone_number: phoneNumber.trim() || undefined,
        upi_id: upiId.trim() || undefined,
        payment_preference: determinePaymentPreference(upiId.trim() || undefined),
      };

      await onSave(playerData);
      
      // Reset form
      setName("");
      setPhoneNumber("");
      setUpiId("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving player:", error);
      // Error toast is handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName(initialData?.name || "");
    setPhoneNumber(initialData?.phone_number || "");
    setUpiId(initialData?.upi_id || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Player Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter player name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                WhatsApp Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Format: +91 9876543210 (for WhatsApp notifications)
              </p>
            </div>

            {/* UPI ID Field */}
            <div className="space-y-2">
              <Label htmlFor="upi" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                UPI ID (Optional)
              </Label>
              <Input
                id="upi"
                placeholder="username@paytm or 9876543210@ybl"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty if player prefers cash payments
              </p>
            </div>

            {/* Payment Preference Display */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Payment Preference:</span>
              <Badge variant={paymentPreference === 'cash' ? 'secondary' : 'default'}>
                {getPaymentMethodIcon(paymentPreference)}{' '}
                {paymentPreference === 'cash' ? 'Cash' : 'UPI'}
              </Badge>
              {paymentPreference === 'cash' && !upiId.trim() && (
                <span className="text-xs text-muted-foreground">
                  (No UPI ID provided)
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Update" : "Add"} Player
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
