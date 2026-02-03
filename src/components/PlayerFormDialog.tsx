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
      toast.error("Participant identity is required");
      return;
    }

    // Validate email format if provided
    if (email.trim() && !validateEmail(email.trim())) {
      toast.error("Invalid communication endpoint (Email)");
      return;
    }

    // Validate UPI ID format if provided
    if (upiId.trim() && !validateUpiId(upiId)) {
      toast.error("Invalid clearance identifier (UPI ID)");
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
      console.error("Error saving participant:", error);
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
      <DialogContent className="bg-[#0a0a0a]/95 border-gold-500/30 backdrop-blur-2xl text-gold-50 rounded-xl max-w-[90vw] sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-8 border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gold-500/10 border border-gold-500/20 shadow-[0_0_15px_rgba(212,184,60,0.1)]">
              <User className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-luxury text-gold-100 uppercase tracking-widest">{title}</DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.2em] text-gold-500/40 font-luxury flex items-center gap-1.5 mt-1">
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
              <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Participant Identity (Full Name) *</Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gold-500/40 group-focus-within:text-gold-500 transition-colors" />
                </div>
                <Input
                  placeholder="Enter identification name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 pl-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-luxury tracking-wider text-[13px] uppercase text-gold-100 placeholder:text-white/10"
                  required
                />
              </div>
            </div>

            {/* Communication & Clearance Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Communication Endpoint (Email)</Label>
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail("")}
                      disabled={isSubmitting}
                      className="text-[9px] font-luxury uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
                    >Clear</button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gold-500/40 group-focus-within:text-gold-500 transition-colors" />
                  </div>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 pl-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-luxury tracking-wider text-[11px] uppercase text-gold-100/60 placeholder:text-white/10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Clearance Identifier (UPI ID)</Label>
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => setUpiId("")}
                      disabled={isSubmitting}
                      className="text-[9px] font-luxury uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
                    >Clear</button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-gold-500/40 group-focus-within:text-gold-500 transition-colors" />
                  </div>
                  <Input
                    placeholder="user@bank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 pl-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus-visible:ring-0 focus-visible:border-gold-500 transition-all font-luxury tracking-wider text-[11px] uppercase text-gold-100/60 placeholder:text-white/10"
                  />
                </div>
              </div>
            </div>

            {/* Protocol Preference */}
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-luxury tracking-[0.2em] text-gold-500/60 ml-1">Preferred Payment Method</Label>
              <Select value={paymentPreference} onValueChange={(value) => setPaymentPreference(value as 'upi' | 'cash')}>
                <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-gold-500 transition-all font-luxury tracking-wider text-[11px] uppercase">
                  <div className="flex items-center gap-3">
                    <Coins className="h-4 w-4 text-gold-500/40" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a]/95 border-gold-500/20 backdrop-blur-xl">
                  <SelectItem value="upi" className="font-luxury uppercase text-[10px] tracking-widest">Digital Clearance (UPI)</SelectItem>
                  <SelectItem value="cash" className="font-luxury uppercase text-[10px] tracking-widest">Physical Asset (Cash)</SelectItem>
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
              className="font-luxury uppercase tracking-[0.2em] text-[10px] h-12 border-white/5 bg-white/2 hover:bg-white/5 transition-colors rounded-lg flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="font-luxury uppercase tracking-[0.2em] text-[10px] h-12 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black border-0 shadow-lg shadow-gold-900/10 rounded-lg flex-1 transition-all"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="flex items-center gap-2"><Check className="h-4 w-4" /> <span>{initialData ? "Save Changes" : "Add Player"}</span></div>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
