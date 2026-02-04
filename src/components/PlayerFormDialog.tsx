import { useState, useEffect } from "react";
import { Player } from "@/types/poker";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notifications";
import { validateUpiId } from "@/utils/playerUtils";
import { Loader2, Mail, CreditCard, User, ShieldCheck, Coins, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  title = "Add Player",
  description = "Enter player details.",
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
      toast.error("Invalid email address");
      return;
    }

    // Validate UPI ID format if provided
    if (upiId.trim() && !validateUpiId(upiId)) {
      toast.error("Invalid UPI ID");
      return;
    }

    setIsSubmitting(true);
    try {
      const playerData: PlayerFormData = {
        name: name.trim(),
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
      toast.success(initialData ? "Player updated" : "New player added");
    } catch (error) {
      console.error("Error saving player:", error);
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
      <DialogContent className="max-w-[90vw] sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-8 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold uppercase tracking-widest">{title}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 mt-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-6">
            {/* Identity Field */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1 mb-2 block font-medium">Player Identity</Label>
              <Input
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="h-14 bg-accent/5"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1 mb-2 block font-medium">Email Address (Optional)</Label>
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail("")}
                      disabled={isSubmitting}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >Clear</button>
                  )}
                </div>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="h-14 bg-accent/5"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1 mb-2 block font-medium">Digital Transfer ID (Optional)</Label>
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => setUpiId("")}
                      disabled={isSubmitting}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >Clear</button>
                  )}
                </div>
                <Input
                  placeholder="username@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  disabled={isSubmitting}
                  className="h-14 bg-accent/5"
                />
              </div>
            </div>

            {/* Protocol Preference */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Preferred Payment Method</Label>
              <Select value={paymentPreference} onValueChange={(value) => setPaymentPreference(value as 'upi' | 'cash')}>
                <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-primary transition-all tracking-wider text-[11px] uppercase">
                  <div className="flex items-center gap-3">
                    <Coins className="h-4 w-4 text-muted-foreground/40" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi" className="uppercase text-[10px] tracking-widest">Digital Payment (UPI)</SelectItem>
                  <SelectItem value="cash" className="uppercase text-[10px] tracking-widest">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="uppercase tracking-[0.2em] text-[10px] h-12 border-border bg-accent/2 hover:bg-accent/5 transition-colors rounded-lg flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="uppercase tracking-[0.2em] text-[10px] h-12 flex-1 transition-all"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="flex items-center gap-2"><Check className="h-4 w-4" /> <span>{initialData ? "Save Changes" : "Add Player"}</span></div>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
