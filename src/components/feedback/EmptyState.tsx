import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) => {
  return (
    <Card className="max-w-2xl mx-auto border-border/50 bg-background/40 backdrop-blur-sm">
      <CardHeader className="text-center py-12 sm:py-16">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>

        {/* Title */}
        <CardTitle className="text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-3">
          {title}
        </CardTitle>

        {/* Description */}
        <CardDescription className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      {(action || secondaryAction || children) && (
        <CardContent className="pb-12 sm:pb-16">
          {children || (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {action && (
                <Button
                  onClick={action.onClick}
                  size="lg"
                  className="h-12 sm:h-14 px-6 sm:px-8 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary-foreground text-xs sm:text-sm uppercase tracking-wider transition-all"
                >
                  {action.label}
                </Button>
              )}

              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant="ghost"
                  size="lg"
                  className="h-12 sm:h-14 px-6 sm:px-8 bg-muted/20 border border-border/30 hover:bg-muted/40 text-foreground text-xs sm:text-sm uppercase tracking-wider transition-all"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// Compact variant for smaller spaces
export const EmptyStateCompact = ({
  icon: Icon,
  title,
  description,
  action,
}: Omit<EmptyStateProps, "secondaryAction" | "children">) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-12 h-12 rounded-xl bg-muted/20 border border-border/30 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        {description}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          variant="outline"
          className="text-xs uppercase tracking-wider"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
