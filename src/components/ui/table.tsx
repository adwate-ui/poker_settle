import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    layout?: "fixed", // Deprecated but kept for type compat, forced to fixed
    tableClassName?: string,
    variant?: "default" | "ghost"
  }
>(({ className, tableClassName, layout: _layout = "fixed", variant = "default", ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-x-hidden rounded-xl border border-border/50",
    variant === "default" && "bg-card/30 backdrop-blur-sm shadow-2xl",
    variant === "ghost" && "border-none bg-transparent shadow-none",
    className
  )}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm select-none table-fixed",
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
    className={cn("sticky top-0 z-10 bg-card border-b border-border", className)}
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
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-1 sm:px-4 truncate whitespace-nowrap text-left align-middle font-semibold font-luxury text-foreground uppercase tracking-widest text-tiny sm:text-table-base [&:has([role=checkbox])]:pr-0",
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
  }
>(({ className, isNumeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-1 sm:p-4 truncate whitespace-nowrap align-middle font-medium font-body text-tiny sm:text-table-base [&:has([role=checkbox])]:pr-0 text-left",
      isNumeric && "font-numbers",
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
