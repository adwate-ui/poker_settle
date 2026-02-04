import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Check, Share2, Link as LinkIcon } from "lucide-react";
import { useSharedLink } from "@/hooks/useSharedLink";
import { ShareResourceType, buildShortUrl } from "@/lib/shareUtils";
import { toast } from "sonner";
import { ErrorMessages } from "@/lib/errorUtils";

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceType: ShareResourceType;
    resourceId: string;
    title: string;
    description?: string;
}

export const ShareDialog = ({
    open,
    onOpenChange,
    resourceType,
    resourceId,
    title,
    description
}: ShareDialogProps) => {
    const { createOrGetSharedLink, loading: hookLoading } = useSharedLink();
    const [shortUrl, setShortUrl] = useState<string>("");
    const [internalLoading, setInternalLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate link when dialog opens
    useEffect(() => {
        if (open && resourceId) {
            const generateLink = async () => {
                setInternalLoading(true);
                try {
                    const linkData = await createOrGetSharedLink(resourceType, resourceId);
                    if (linkData) {
                        setShortUrl(buildShortUrl(linkData.shortCode));
                    }
                } catch (error) {
                    console.error("Failed to generate link:", error);
                    toast.error(ErrorMessages.share.generate(error));
                } finally {
                    setInternalLoading(false);
                }
            };

            generateLink();
        } else {
            // Reset state on close
            setShortUrl("");
            setCopied(false);
        }
    }, [open, resourceId, resourceType, createOrGetSharedLink]);

    const handleCopy = async () => {
        if (!shortUrl) return;

        try {
            await navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");

            // Reset icon after 2 seconds
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to clean copy:", error);
            toast.error("Failed to copy link");
        }
    };

    const handleNativeShare = async () => {
        if (!shortUrl) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: description || `Check out this ${resourceType} on Poker Settle!`,
                    url: shortUrl,
                });
                toast.success("Opened share options");
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error("Error sharing:", error);
                    toast.error("Failed to share");
                }
            }
        } else {
            // Fallback if not supported (though button shouldn't show if we check properly, but explicit check is good)
            handleCopy();
        }
    };

    const isLoading = hookLoading || internalLoading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-luxury">
                        <Share2 className="h-5 w-5 text-primary" />
                        Share {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {description || "Anyone with this link can view the details."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 py-4">
                    <div className="grid flex-1 gap-2">
                        <div className="relative">
                            <Input
                                readOnly
                                value={shortUrl}
                                placeholder={isLoading ? "Generating link..." : "https://..."}
                                className="pr-10 font-mono text-sm bg-muted/30 border-primary/20 focus-visible:ring-primary/30"
                            />
                            {isLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className="px-3 min-w-[3rem]"
                        onClick={handleCopy}
                        disabled={isLoading || !shortUrl}
                        aria-label={copied ? "Link copied" : "Copy link"}
                        variant="secondary"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy</span>
                    </Button>
                </div>

                <DialogFooter className="sm:justify-between flex-row items-center gap-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" />
                        <span>Link expires automatically if unused</span>
                    </div>

                    {/* Only show native share if available (and mostly on mobile) */}
                    {typeof navigator !== 'undefined' && navigator.share && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleNativeShare}
                            disabled={isLoading || !shortUrl}
                            className="gap-2"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            Share via...
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
