import { useState, useMemo } from 'react';
import { formatMonthYear, getUniqueMonthYears } from '@/lib/utils';

export function useMonthYearFilter<T>(
  data: T[],
  getDateFromItem: (item: T) => string | Date
) {
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("all");

  const uniqueMonthYears = useMemo(() => {
    return getUniqueMonthYears(data.map(getDateFromItem));
  }, [data, getDateFromItem]);

  const filteredData = useMemo(() => {
    if (selectedMonthYear === "all") return data;
    
    return data.filter((item) => {
      const monthYear = formatMonthYear(getDateFromItem(item));
      return monthYear === selectedMonthYear;
    });
  }, [data, selectedMonthYear, getDateFromItem]);

  return {
    selectedMonthYear,
    setSelectedMonthYear,
    uniqueMonthYears,
    filteredData,
  };
}
