import { toast as sonnerToast } from "sonner";

// High-end notification helper utility mapping to sonner
export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      className: "border-border bg-popover text-popover-foreground",
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      className: "border-destructive bg-popover text-destructive",
    });
  },
  info: (message: string) => {
    sonnerToast.info(message, {
      className: "border-blue-500/20 bg-popover text-blue-500",
    });
  },
  warning: (message: string) => {
    sonnerToast.warning(message, {
      className: "border-yellow-500/20 bg-popover text-yellow-600 dark:text-yellow-400",
    });
  },
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      className: "border-border bg-popover text-popover-foreground",
    });
  },
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};
