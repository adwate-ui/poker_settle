import { useState, useEffect } from "react";
import { Player } from "@/types/poker";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notifications";
import { validateUpiId } from "@/utils/playerUtils";
import { Loader2, Phone, CreditCard, User, ShieldCheck, Coins, Check } from "lucide-react";
import { PaymentMethodConfig } from "@/config/localization";
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
  phone_number?: string;
  email?: string;
  upi_id?: string;
  payment_preference?: string;
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
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phone_number || "");
  const [upiId, setUpiId] = useState(initialData?.upi_id || "");
  const [paymentPreference, setPaymentPreference] = useState<string>(
    initialData?.payment_preference || PaymentMethodConfig.digital.key
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field-level validation state
  const [errors, setErrors] = useState<{
    name?: string;
    phoneNumber?: string;
    upiId?: string;
  }>({});

  const [touched, setTouched] = useState<{
    name?: boolean;
    phoneNumber?: boolean;
    upiId?: boolean;
  }>({});

  // Sync form fields with initialData when it changes (for edit mode)
  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || "");
      setPhoneNumber(initialData.phone_number || "");
      setUpiId(initialData.upi_id || "");
      setPaymentPreference(initialData.payment_preference || PaymentMethodConfig.digital.key);
    } else if (open && !initialData) {
      // Reset for new player
      setName("");
      setPhoneNumber("");
      setUpiId("");
      setPaymentPreference(PaymentMethodConfig.digital.key);
    }
    // Reset errors and touched state when dialog opens
    setErrors({});
    setTouched({});
  }, [open, initialData]);

  // Real-time validation
  const validateField = (fieldName: 'name' | 'phoneNumber' | 'upiId', value: string) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = "Player name is required";
        } else if (value.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        } else {
          delete newErrors.name;
        }
        break;

      case 'phoneNumber':
        if (value.trim() && !validatePhoneNumber(value.trim())) {
          newErrors.phoneNumber = "Phone number must be 10-15 digits";
        } else {
          delete newErrors.phoneNumber;
        }
        break;

      case 'upiId':
        if (value.trim() && !validateUpiId(value)) {
          newErrors.upiId = "Invalid UPI ID format";
        } else {
          delete newErrors.upiId;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (fieldName: 'name' | 'phoneNumber' | 'upiId', value: string) => {
    switch (fieldName) {
      case 'name':
        setName(value);
        break;
      case 'phoneNumber':
        setPhoneNumber(value);
        break;
      case 'upiId':
        setUpiId(value);
        break;
    }

    // Validate on change if field has been touched
    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  };

  const handleBlur = (fieldName: 'name' | 'phoneNumber' | 'upiId') => {
    setTouched({ ...touched, [fieldName]: true });

    const value = fieldName === 'name' ? name : fieldName === 'phoneNumber' ? phoneNumber : upiId;
    validateField(fieldName, value);
  };

  const isFieldValid = (fieldName: 'name' | 'phoneNumber' | 'upiId'): boolean => {
    const value = fieldName === 'name' ? name : fieldName === 'phoneNumber' ? phoneNumber : upiId;
    return touched[fieldName] && !errors[fieldName] && value.trim().length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ name: true, phoneNumber: true, upiId: true });

    // Validate all fields
    const isNameValid = validateField('name', name);
    const isPhoneValid = validateField('phoneNumber', phoneNumber);
    const isUpiIdValid = validateField('upiId', upiId);

    // Check if form has any errors
    if (!isNameValid || !isPhoneValid || !isUpiIdValid) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const playerData: PlayerFormData = {
        name: name.trim(),
        phone_number: phoneNumber.trim() || '',
        email: initialData?.email || '', // Keep existing email if any
        upi_id: upiId.trim() || '',
        payment_preference: paymentPreference,
      };

      await onSave(playerData);

      // Reset form
      setName("");
      setPhoneNumber("");
      setUpiId("");
      setPaymentPreference(PaymentMethodConfig.digital.key);
      onOpenChange(false);
      toast.success(initialData ? "Player updated" : "New player added");
    } catch (error) {
      console.error("Error saving player:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\+/g, ''));
  };

  const handleCancel = () => {
    setName(initialData?.name || "");
    setPhoneNumber(initialData?.phone_number || "");
    setUpiId(initialData?.upi_id || "");
    setPaymentPreference(initialData?.payment_preference || PaymentMethodConfig.digital.key);
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
              <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1 mb-2 block font-medium">
                Player Identity *
              </Label>
              <div className="relative">
                <Input
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  disabled={isSubmitting}
                  className={cn(
                    "h-14 bg-accent/5 pr-10",
                    errors.name && touched.name && "border-destructive focus-visible:ring-destructive",
                    isFieldValid('name') && "border-green-500 focus-visible:ring-green-500"
                  )}
                  required
                />
                {isFieldValid('name') && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-state-success" />
                )}
              </div>
              {errors.name && touched.name && (
                <p className="text-xs text-destructive ml-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1 mb-2 block font-medium">WhatsApp Number (Optional)</Label>
                  {phoneNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneNumber("");
                        setErrors({ ...errors, phoneNumber: undefined });
                        setTouched({ ...touched, phoneNumber: false });
                      }}
                      disabled={isSubmitting}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >Clear</button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="919876543210"
                    value={phoneNumber}
                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                    onBlur={() => handleBlur('phoneNumber')}
                    disabled={isSubmitting}
                    className={cn(
                      "h-14 bg-accent/5 pr-10",
                      errors.phoneNumber && touched.phoneNumber && "border-destructive focus-visible:ring-destructive",
                      isFieldValid('phoneNumber') && "border-green-500 focus-visible:ring-green-500"
                    )}
                  />
                  {isFieldValid('phoneNumber') && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-state-success" />
                  )}
                </div>
                {errors.phoneNumber && touched.phoneNumber && (
                  <p className="text-xs text-destructive ml-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground ml-1 mb-2 block font-medium">Digital Transfer ID (Optional)</Label>
                  {upiId && (
                    <button
                      type="button"
                      onClick={() => {
                        setUpiId("");
                        setErrors({ ...errors, upiId: undefined });
                        setTouched({ ...touched, upiId: false });
                      }}
                      disabled={isSubmitting}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >Clear</button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    placeholder="username@bank"
                    value={upiId}
                    onChange={(e) => handleFieldChange('upiId', e.target.value)}
                    onBlur={() => handleBlur('upiId')}
                    disabled={isSubmitting}
                    className={cn(
                      "h-14 bg-accent/5 pr-10",
                      errors.upiId && touched.upiId && "border-destructive focus-visible:ring-destructive",
                      isFieldValid('upiId') && "border-green-500 focus-visible:ring-green-500"
                    )}
                  />
                  {isFieldValid('upiId') && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-state-success" />
                  )}
                </div>
                {errors.upiId && touched.upiId && (
                  <p className="text-xs text-destructive ml-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                    {errors.upiId}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Preferred Payment Method</Label>
              <Select value={paymentPreference} onValueChange={(value) => setPaymentPreference(value)}>
                <SelectTrigger className="h-12 bg-white/5 border-0 border-b border-white/10 rounded-none focus:ring-0 focus:border-primary transition-all tracking-wider text-[11px] uppercase">
                  <div className="flex items-center gap-3">
                    <Coins className="h-4 w-4 text-muted-foreground/40" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethodConfig.digital.key} className="uppercase text-[10px] tracking-widest">Digital Payment ({PaymentMethodConfig.digital.label})</SelectItem>
                  <SelectItem value={PaymentMethodConfig.cash.key} className="uppercase text-[10px] tracking-widest">{PaymentMethodConfig.cash.label}</SelectItem>
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
