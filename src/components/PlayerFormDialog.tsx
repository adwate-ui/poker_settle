/**
 * Player Form Dialog Component
 * Form for creating/editing players with phone number and UPI ID
 */

import { useState, useEffect } from "react";
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
import { validateUpiId, getPaymentMethodIcon } from "@/utils/playerUtils";
import { Loader2, Mail, CreditCard, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  email?: string;
  upi_id?: string;
  payment_preference?: 'upi' | 'cash';
}

export const PlayerFormDialog = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  title = "Add New Player",
  description = "Enter player details including email and UPI ID for payments.",
}: PlayerFormDialogProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [upiId, setUpiId] = useState(initialData?.upi_id || "");
  const [paymentPreference, setPaymentPreference] = useState<'upi' | 'cash'>(
    initialData?.payment_preference || 'upi'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form fields with initialData when it changes (for edit mode)
  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setUpiId(initialData.upi_id || "");
      setPaymentPreference(initialData.payment_preference || 'upi');
    } else if (open && !initialData) {
      // Reset for new player
      setName("");
      setEmail("");
      setUpiId("");
      setPaymentPreference('upi');
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Player name is required");
      return;
    }

    // Validate email format if provided
    if (email.trim() && !validateEmail(email.trim())) {
      toast.error("Invalid email format");
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
        // Pass empty string (not undefined) to allow clearing fields
        email: email.trim() || '',
        upi_id: upiId.trim() || '',
        payment_preference: paymentPreference,
      };

      await onSave(playerData);
      
      // Reset form
      setName("");
      setEmail("");
      setUpiId("");
      setPaymentPreference('upi');
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving player:", error);
      // Error toast is handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCancel = () => {
    setName(initialData?.name || "");
    setEmail(initialData?.email || "");
    setUpiId(initialData?.upi_id || "");
    setPaymentPreference(initialData?.payment_preference || 'upi');
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

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address (Optional)
                </span>
                {email && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEmail("")}
                    className="h-6 px-2 text-xs"
                    disabled={isSubmitting}
                  >
                    Clear
                  </Button>
                )}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                For receiving game reports and payment links. Leave empty to remove.
              </p>
            </div>

            {/* UPI ID Field */}
            <div className="space-y-2">
              <Label htmlFor="upi" className="flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  UPI ID (Optional)
                </span>
                {upiId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUpiId("")}
                    className="h-6 px-2 text-xs"
                    disabled={isSubmitting}
                  >
                    Clear
                  </Button>
                )}
              </Label>
              <Input
                id="upi"
                placeholder="username@paytm or 9876543210@ybl"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                For receiving UPI payment links. Leave empty if player prefers cash payments.
              </p>
            </div>

            {/* Payment Preference Selection */}
            <div className="space-y-2">
              <Label htmlFor="payment-preference" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Preferred Payment Mode
              </Label>
              <Select
                value={paymentPreference}
                onValueChange={(value: 'upi' | 'cash') => setPaymentPreference(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="payment-preference">
                  <SelectValue placeholder="Select payment preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon('upi')} UPI
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon('cash')} Cash
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can change this preference anytime
              </p>
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
