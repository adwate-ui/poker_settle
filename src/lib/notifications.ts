import { toast as sonnerToast } from "sonner";

// High-end notification helper utility mapping to sonner
export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      className: "border-gold-500/20 bg-[#0a0a0a]/95 text-gold-50 font-luxury",
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      className: "border-red-500/20 bg-[#0a0a0a]/95 text-red-400 font-luxury",
    });
  },
  info: (message: string) => {
    sonnerToast.info(message, {
      className: "border-blue-500/20 bg-[#0a0a0a]/95 text-blue-400 font-luxury",
    });
  },
  warning: (message: string) => {
    sonnerToast.warning(message, {
      className: "border-yellow-500/20 bg-[#0a0a0a]/95 text-yellow-400 font-luxury",
    });
  },
};
