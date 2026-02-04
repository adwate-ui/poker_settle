import { CurrencyConfig } from '@/config/localization';

/**
 * Format number with Indian numbering style (commas at lakhs/crores)
 * Extracted from legacy utils.ts for centralization
 */
/**
 * Format number based on global locale config
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat(CurrencyConfig.locale, {
        maximumFractionDigits: 0 // Default to no decimals for chips/money in this app usually
    }).format(num);
}

/**
 * Legacy alias for backward compatibility.
 * Now uses the centralized locale-aware formatNumber.
 */
export const formatIndianNumber = formatNumber;

/**
 * Formats a number as a currency string based on the global localization config.
 * 
 * @param amount The amount to format
 * @param includeSymbol Whether to include the currency symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, includeSymbol = true): string => {
    if (!includeSymbol) {
        return formatIndianNumber(amount);
    }

    // Intl.NumberFormat might use a different symbol than requested in the prompt
    // The prompt specifically asked to replace literall "Rs." with the config symbol.
    // We'll use the config symbol explicitly to match the user's specific requirement.
    const formattedNumber = formatIndianNumber(amount);

    return `${CurrencyConfig.symbol} ${formattedNumber}`;
};
