import { abbreviateName } from "@/utils/textUtils";
import { cn } from "@/lib/utils";

interface ResponsiveNameProps {
    name: string;
    className?: string;
    mobileLimit?: number;
}

/**
 * A component that displays a full name on desktop and an abbreviated version on mobile
 * using CSS visibility and the abbreviateName utility.
 */
export const ResponsiveName = ({ name, className, mobileLimit = 10 }: ResponsiveNameProps) => {
    return (
        <span className={cn("inline-flex truncate", className)}>
            <span className="sm:inline hidden truncate">{name}</span>
            <span className="sm:hidden inline truncate">
                {abbreviateName(name, mobileLimit)}
            </span>
        </span>
    );
};

export default ResponsiveName;
