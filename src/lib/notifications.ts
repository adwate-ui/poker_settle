import { toast as sonnerToast, ExternalToast } from "sonner";

// High-end notification helper utility mapping to sonner
export const toast = {
  success: (message: string, options?: ExternalToast) => {
    sonnerToast.success(message, {
      className: "border-border bg-popover text-popover-foreground",
      ...options,
    });
  },
  error: (message: string, options?: ExternalToast) => {
    sonnerToast.error(message, {
      className: "border-destructive bg-destructive text-destructive-foreground",
      ...options,
    });
  },
  info: (message: string, options?: ExternalToast) => {
    sonnerToast.info(message, {
      className: "border-state-info/20 bg-popover text-state-info",
      ...options,
    });
  },
  warning: (message: string, options?: ExternalToast) => {
    sonnerToast.warning(message, {
      className: "border-state-warning/20 bg-popover text-state-warning",
      ...options,
    });
  },
  loading: (message: string, options?: ExternalToast) => {
    return sonnerToast.loading(message, {
      className: "border-border bg-popover text-popover-foreground",
      ...options,
    });
  },
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};
