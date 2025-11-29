import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

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

// Date formatting utilities
export function formatGameDate(date: string | Date): string {
  return format(new Date(date), "MMMM d, yyyy");
}

export function formatShortDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatMonthYear(date: string | Date): string {
  return format(new Date(date), "MMM yyyy");
}

export function formatTimestamp(date: string | Date): string {
  return format(new Date(date), "MMM d, h:mm a");
}

// Extract unique dates/months from games
export function getUniqueDates(dates: (string | Date)[]): string[] {
  const formatted = dates.map((d) => formatShortDate(d));
  return Array.from(new Set(formatted)).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
}

export function getUniqueMonthYears(dates: (string | Date)[]): string[] {
  const formatted = dates.map((d) => formatMonthYear(d));
  return Array.from(new Set(formatted)).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
}
