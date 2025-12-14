/**
 * Player Form Dialog Component
 * Form for creating/editing players with phone number and UPI ID
 */

import { useState, useEffect } from "react";
import { Player } from "@/types/poker";
import { Modal, Button, TextInput, Stack, Text, Group, Select } from "@mantine/core";
import { toast } from "@/lib/notifications";
import { validateUpiId, getPaymentMethodIcon } from "@/utils/playerUtils";
import { Loader2, Mail, CreditCard, User } from "lucide-react";

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
    <Modal 
      opened={open} 
      onClose={() => onOpenChange(false)} 
      title={title}
      size="lg"
    >
      <Stack gap="xs" mb="md">
        <Text size="sm" c="dimmed">{description}</Text>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Name Field */}
          <TextInput
            label={
              <Group gap="xs">
                <User className="h-4 w-4" />
                <span>Player Name *</span>
              </Group>
            }
            placeholder="Enter player name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
            autoFocus
          />

          {/* Email Field */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                <Group gap="xs">
                  <Mail className="h-4 w-4" />
                  <span>Email Address (Optional)</span>
                </Group>
              </Text>
              {email && (
                <Button
                  type="button"
                  variant="subtle"
                  size="xs"
                  onClick={() => setEmail("")}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
              )}
            </Group>
            <TextInput
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <Text size="xs" c="dimmed" mt="xs">
              For receiving game reports and payment links. Leave empty to remove.
            </Text>
          </div>

          {/* UPI ID Field */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                <Group gap="xs">
                  <CreditCard className="h-4 w-4" />
                  <span>UPI ID (Optional)</span>
                </Group>
              </Text>
              {upiId && (
                <Button
                  type="button"
                  variant="subtle"
                  size="xs"
                  onClick={() => setUpiId("")}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
              )}
            </Group>
            <TextInput
              placeholder="username@paytm or 9876543210@ybl"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              disabled={isSubmitting}
            />
            <Text size="xs" c="dimmed" mt="xs">
              For receiving UPI payment links. Leave empty if player prefers cash payments.
            </Text>
          </div>

          {/* Payment Preference Selection */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              <Group gap="xs">
                <CreditCard className="h-4 w-4" />
                <span>Preferred Payment Mode</span>
              </Group>
            </Text>
            <Select
              value={paymentPreference}
              onChange={(value) => setPaymentPreference(value as 'upi' | 'cash')}
              disabled={isSubmitting}
              data={[
                { value: 'upi', label: 'UPI' },
                { value: 'cash', label: 'Cash' },
              ]}
            />
            <Text size="xs" c="dimmed" mt="xs">
              You can change this preference anytime
            </Text>
          </div>

          <Group justify="flex-end" mt="md">
            <Button
              type="button"
              variant="default"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              leftSection={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            >
              {initialData ? "Update" : "Add"} Player
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
