import { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortOrder = 'asc' | 'desc' | null;

export function useSortableData<T, K extends keyof T>(
  data: T[],
  defaultSortField?: K
) {
  const [sortField, setSortField] = useState<K | null>(defaultSortField ?? null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortField ? 'asc' : null);

  const handleSort = useCallback((field: K) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const getSortIcon = useCallback((field: K) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  }, [sortField, sortOrder]);

  const sortedData = useMemo(() => {
    if (!sortField || !sortOrder) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      // Handle string comparisons
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle numeric comparisons
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle date comparisons
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'asc' 
          ? aVal.getTime() - bVal.getTime() 
          : bVal.getTime() - aVal.getTime();
      }

      return 0;
    });
  }, [data, sortField, sortOrder]);

  return {
    sortedData,
    sortField,
    sortOrder,
    handleSort,
    getSortIcon,
  };
}
