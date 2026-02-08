import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    layout?: "auto" | "fixed",
    tableClassName?: string,
    variant?: "default" | "ghost"
  }
>(({ className, tableClassName, layout = "fixed", variant = "default", ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-y-auto overflow-x-hidden md:overflow-auto rounded-xl",
    variant === "default" && "border border-white/10 bg-card/30 backdrop-blur-sm shadow-2xl",
    variant === "ghost" && "border-none bg-transparent shadow-none",
    className
  )}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm select-none",
        "table-fixed",
        layout === "auto" && "sm:table-auto",
        tableClassName
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("sticky top-0 z-10 bg-black/20 backdrop-blur-md [&_tr]:border-b border-white/5", className)}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("backdrop-blur-sm [&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-white/10 bg-muted/50 font-medium [&>tr]:last:border-b-0 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-white/5 transition-colors hover:bg-white/5 data-[state=selected]:bg-muted backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    align?: 'left' | 'center' | 'right';
  }
>(({ className, align = 'left', ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 truncate whitespace-nowrap text-left align-middle font-medium font-luxury text-muted-foreground/70 uppercase tracking-widest text-2xs sm:text-xs [&:has([role=checkbox])]:pr-0",
      align === 'center' && "text-center",
      align === 'right' && "text-right",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    isNumeric?: boolean;
    align?: 'left' | 'center' | 'right';
  }
>(({ className, isNumeric, align = 'left', ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 py-3 sm:px-4 sm:py-4 truncate whitespace-nowrap align-middle font-medium font-body text-2xs sm:text-xs [&:has([role=checkbox])]:pr-0",
      isNumeric && "font-numbers",
      align === 'center' && "text-center",
      align === 'right' && "text-right",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
