import { formatCurrency } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";
import { CurrencyConfig } from "@/config/localization";

interface ResponsiveCurrencyProps {
    amount: number;
    className?: string;
    mobileCompact?: boolean;
}

/**
 * A component that displays a formatted currency.
 * On mobile, it can optionally use a more compact format (e.g., direct symbol without space).
 */
export const ResponsiveCurrency = ({ amount, className, mobileCompact = true }: ResponsiveCurrencyProps) => {
    const formatted = formatCurrency(amount);

    if (!mobileCompact) {
        return <span className={className}>{formatted}</span>;
    }

    // Compact mobile format: Symbol + Rounded Number (e.g. Rs.1,000 instead of Rs. 1,000.00)
    const compactMobile = `${CurrencyConfig.symbol}${Math.round(amount).toLocaleString('en-IN')}`;

    return (
        <span className={cn("inline-flex", className)}>
            <span className="sm:inline hidden">{formatted}</span>
            <span className="sm:hidden inline">{compactMobile}</span>
        </span>
    );
};

export default ResponsiveCurrency;
