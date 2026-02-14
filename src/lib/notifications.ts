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
      className: "border-destructive bg-popover text-destructive",
      ...options,
    });
  },
  info: (message: string, options?: ExternalToast) => {
    sonnerToast.info(message, {
      className: "border-blue-500/20 bg-popover text-blue-500",
      ...options,
    });
  },
  warning: (message: string, options?: ExternalToast) => {
    sonnerToast.warning(message, {
      className: "border-yellow-500/20 bg-popover text-yellow-600 dark:text-yellow-400",
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
