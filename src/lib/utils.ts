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
  return amount >= 0 ? 'green' : 'red';
}

// Get consistent badge variant for profit/loss values (for shadcn badges)
export function getProfitLossVariant(amount: number): 'success' | 'destructive' {
  return amount >= 0 ? 'success' : 'destructive';
}

// Format profit/loss with sign
// For positive amounts: adds '+' after Rs. (e.g., "Rs. +1,000")
// For negative amounts: adds '-' after Rs. (e.g., "Rs. -1,000")
export function formatProfitLoss(amount: number): string {
  const sign = amount >= 0 ? '+' : '-';
  return `Rs. ${sign}${formatIndianNumber(Math.abs(amount))}`;
}
