import { describe, it, expect } from 'vitest';
import { formatNumber, formatIndianNumber, formatCurrency } from './currencyUtils';

describe('formatNumber', () => {
  it('should format small numbers without commas', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(999)).toBe('999');
  });

  it('should format thousands with Indian comma style', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(10000)).toBe('10,000');
  });

  it('should format lakhs with Indian comma style', () => {
    expect(formatNumber(100000)).toBe('1,00,000');
    expect(formatNumber(500000)).toBe('5,00,000');
  });

  it('should format crores with Indian comma style', () => {
    expect(formatNumber(10000000)).toBe('1,00,00,000');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000');
    expect(formatNumber(-100000)).toBe('-1,00,000');
  });

  it('should truncate decimals', () => {
    expect(formatNumber(1000.99)).toBe('1,001');
    expect(formatNumber(1000.49)).toBe('1,000');
  });
});

describe('formatIndianNumber', () => {
  it('should be an alias for formatNumber', () => {
    expect(formatIndianNumber(100000)).toBe(formatNumber(100000));
    expect(formatIndianNumber(1234567)).toBe(formatNumber(1234567));
  });
});

describe('formatCurrency', () => {
  it('should format with currency symbol by default', () => {
    expect(formatCurrency(1000)).toBe('Rs. 1,000');
    expect(formatCurrency(100000)).toBe('Rs. 1,00,000');
  });

  it('should format without symbol when includeSymbol is false', () => {
    expect(formatCurrency(1000, false)).toBe('1,000');
    expect(formatCurrency(100000, false)).toBe('1,00,000');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('Rs. 0');
  });

  it('should handle negative amounts', () => {
    expect(formatCurrency(-5000)).toBe('Rs. -5,000');
  });
});
