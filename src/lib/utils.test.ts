import { describe, it, expect } from 'vitest';
import { cn, parseIndianNumber } from './utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});

describe('parseIndianNumber', () => {
  it('should parse number without commas', () => {
    expect(parseIndianNumber('1000')).toBe(1000);
  });

  it('should parse Indian formatted number', () => {
    expect(parseIndianNumber('1,00,000')).toBe(100000);
  });

  it('should parse Western formatted number', () => {
    expect(parseIndianNumber('100,000')).toBe(100000);
  });

  it('should handle empty string', () => {
    expect(parseIndianNumber('')).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(parseIndianNumber('-1,000')).toBe(-1000);
  });
});
