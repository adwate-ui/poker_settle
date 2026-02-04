import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with Indian numbering style (commas at lakhs/crores)
export function formatIndianNumber(num: number): string {
  const numStr = Math.abs(num).toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);

  if (otherNumbers !== '') {
    return (num < 0 ? '-' : '') + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return (num < 0 ? '-' : '') + lastThree;
}

// Parse Indian formatted number string back to number
export function parseIndianNumber(str: string): number {
  const cleaned = str.replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

// Format display value for input (blank if zero, formatted if non-zero)
export function formatInputDisplay(value: number | null | undefined): string {
  return (value === 0 || value === null || value === undefined) ? '' : formatIndianNumber(value);
}

// Get consistent badge color for profit/loss values
// Returns 'green' for positive amounts (profit) and 'red' for negative amounts (loss)
export function getProfitLossColor(amount: number): 'green' | 'red' {
  // Handle NaN, Infinity, and undefined values
  // Default to red as invalid calculations typically indicate errors or losses
  if (!isFinite(amount)) {
    return 'red';
  }
  // Any negative value (even very small) should be red
  // Any positive value or zero should be green
  return amount < 0 ? 'red' : 'green';
}

// Get consistent badge variant for profit/loss values (for shadcn badges)
export function getProfitLossVariant(amount: number): 'profit' | 'loss' {
  return amount >= 0 ? 'profit' : 'loss';
}

// Format profit/loss with sign
// For positive amounts: adds '+' after Rs. (e.g., "Rs. +1,000")
// For negative amounts: adds '-' after Rs. (e.g., "Rs. -1,000")
export function formatProfitLoss(amount: number): string {
  const sign = amount >= 0 ? '+' : '-';
  return `Rs. ${sign}${formatIndianNumber(Math.abs(amount))}`;
}

/**
 * Generates a consistent hex color from a string
 * Returns color without the '#' prefix for easier URL usage
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use HSL for better control over vibrancy and lightness
  const h = Math.abs(hash) % 360;
  const s = 70; // Vibrant but not overly saturated
  const l = 60; // Light enough for the adventure character style to pop

  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  let r, g, b;
  if (sDecimal === 0) {
    r = g = b = lDecimal;
  } else {
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}
