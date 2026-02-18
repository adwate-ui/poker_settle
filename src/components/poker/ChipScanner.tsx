import { useState, useRef } from 'react';
import { Camera, Upload, Check, RefreshCw, ScanEye, Layers, AlertTriangle, Eye, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currencyUtils';
import { useChips } from '@/contexts/ChipContext';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChipScannerProps {
    onScanComplete: (value: number) => void;
    triggerProps?: Partial<React.ComponentProps<typeof Button>>;
}

interface Stack {
    color: string;
    count: number;
    confidence?: number;
    box_2d?: [number, number, number, number];
}

interface DetectedStack {
    id: number;
    count: number;
    value: number;
    chip: string; // Color name from AI
    confidence: number;
    needsReview: boolean;
    isUnknown: boolean;
    raw: unknown;
}

// Accuracy improvement constants
const MAX_DIM = 1800; // Increased from 1000 for better ridge detection
const JPEG_QUALITY = 0.88; // Increased from 0.8 to reduce artifacts
const CONFIDENCE_THRESHOLD = 0.50; // Minimum confidence to show result
const REVIEW_THRESHOLD = 0.85; // Below this, flag for user review
const MAX_CHIPS_PER_STACK = 100; // Physical limit for stable stack
const MIN_CHIPS_PER_STACK = 1;

export const ChipScanner = ({ onScanComplete, triggerProps }: ChipScannerProps) => {
    const [opened, setOpened] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<DetectedStack[]>([]);
    const [warning, setWarning] = useState<string | null>(null);
    const [aiNotes, setAiNotes] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const camInputRef = useRef<HTMLInputElement>(null);
    const { chips } = useChips();

    // White balance normalization to improve color detection under different lighting
    const normalizeWhiteBalance = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Sample from border regions (likely felt/background)
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        const borderSize = Math.floor(Math.min(width, height) * 0.05);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Only sample border pixels
                if (x < borderSize || x > width - borderSize ||
                    y < borderSize || y > height - borderSize) {
                    const i = (y * width + x) * 4;
                    sumR += data[i];
                    sumG += data[i + 1];
                    sumB += data[i + 2];
                    count++;
                }
            }
        }

        if (count === 0) return; // Safety check

        const avgR = sumR / count;
        const avgG = sumG / count;
        const avgB = sumB / count;
        const grayTarget = (avgR + avgG + avgB) / 3;

        // Apply correction (clamp factors to avoid extreme corrections)
        const rFactor = Math.min(1.5, Math.max(0.7, grayTarget / avgR));
        const gFactor = Math.min(1.5, Math.max(0.7, grayTarget / avgG));
        const bFactor = Math.min(1.5, Math.max(0.7, grayTarget / avgB));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * rFactor);
            data[i + 1] = Math.min(255, data[i + 1] * gFactor);
            data[i + 2] = Math.min(255, data[i + 2] * bFactor);
        }

        ctx.putImageData(imageData, 0, 0);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    const img = new window.Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        if (width > height && width > MAX_DIM) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                        } else if (height > MAX_DIM) {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;

                        ctx.drawImage(img, 0, 0, width, height);

                        // Apply white balance normalization for better color detection
                        normalizeWhiteBalance(ctx, width, height);

                        const compressedBase64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

                        setImage(compressedBase64);
                        processWithGemini(compressedBase64);
                    };
                    img.src = e.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const processWithGemini = async (imageSrc: string) => {
        setProcessing(true);
        setWarning(null);
        setResults([]);
        setAiNotes(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to scan chips.");

            const { data: profile } = await supabase
                .from('user_api_keys')
                .select('gemini_api_key')
                .eq('user_id', user.id)
                .maybeSingle();

            const apiKey = (profile as { gemini_api_key: string } | null)?.gemini_api_key;

            if (!apiKey) {
                setWarning("Gemini API Key is missing. Please go to Profile -> AI Settings to add it.");
                setProcessing(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-chips`;

            // Create context for the AI
            const definedChips = chips.map(c => ({
                color: c.color,
                label: c.label,
                value: c.value
            }));

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || apiKey}`,
                },
                body: JSON.stringify({
                    image: imageSrc,
                    apiKey: apiKey,
                    defined_chips: definedChips
                })
            });

            const data = await response.json() as {
                analysis_notes?: string;
                stacks?: Stack[];
                error?: string;
                details?: string;
            };

            if (!response.ok) {
                throw new Error(data.error || data.details || "Unknown Edge Function Error");
            }

            if (data.analysis_notes) setAiNotes(data.analysis_notes);

            const parsedStacks: DetectedStack[] = [];

            if (data.stacks && Array.isArray(data.stacks)) {
                data.stacks.forEach((s: Stack, idx: number) => {
                    const confidence = s.confidence ?? 1;

                    // Filter out very low confidence results
                    if (confidence < CONFIDENCE_THRESHOLD) {
                        return;
                    }

                    // Fuzzy match the color returned by AI to our defined chips
                    const lowerColor = s.color.toLowerCase();

                    const matchedChip = chips.find(c => c.color.toLowerCase() === lowerColor) ||
                        chips.find(c => c.label.toLowerCase().includes(lowerColor)) ||
                        chips.find(c => lowerColor.includes(c.color.toLowerCase()));

                    // Sanity checks on count
                    let needsReview = confidence < REVIEW_THRESHOLD;
                    if (s.count < MIN_CHIPS_PER_STACK || s.count > MAX_CHIPS_PER_STACK) {
                        needsReview = true;
                    }

                    // Handle unknown colors - flag for manual assignment instead of defaulting
                    if (!matchedChip) {
                        parsedStacks.push({
                            id: idx,
                            count: s.count,
                            value: 0, // Unknown value - user must assign
                            chip: s.color,
                            confidence,
                            needsReview: true,
                            isUnknown: true,
                            raw: s
                        });
                        return;
                    }

                    // Use the AI's count with our local value
                    const val = matchedChip.value * s.count;

                    parsedStacks.push({
                        id: idx,
                        count: s.count,
                        value: val,
                        chip: matchedChip.color,
                        confidence,
                        needsReview,
                        isUnknown: false,
                        raw: s
                    });
                });
            }

            setResults(parsedStacks);

            if (canvasRef.current) {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = canvasRef.current!;
                    const ctx = canvas.getContext('2d')!;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    data.stacks?.forEach((s: Stack) => {
                        // Validate bounding box before rendering
                        if (s.box_2d && Array.isArray(s.box_2d) && s.box_2d.length === 4) {
                            const [ymin, xmin, ymax, xmax] = s.box_2d;

                            // Validate bounds are within 0-1000 range and properly ordered
                            if (ymin >= 0 && xmin >= 0 && ymax <= 1000 && xmax <= 1000 &&
                                ymin < ymax && xmin < xmax) {

                                const x = xmin / 1000 * img.width;
                                const y = ymin / 1000 * img.height;
                                const w = (xmax - xmin) / 1000 * img.width;
                                const h = (ymax - ymin) / 1000 * img.height;

                                // Color box based on confidence
                                const confidence = s.confidence ?? 1;
                                ctx.lineWidth = 5;
                                ctx.strokeStyle = confidence >= REVIEW_THRESHOLD ? "lime" :
                                                  confidence >= CONFIDENCE_THRESHOLD ? "yellow" : "red";
                                ctx.strokeRect(x, y, w, h);

                                ctx.fillStyle = "rgba(0,0,0,0.5)";
                                ctx.fillRect(x, y - 40, w, 40);
                                ctx.fillStyle = "white";
                                ctx.font = "bold 30px Arial";
                                ctx.fillText(`${s.count}x ${s.color}`, x + 5, y - 10);
                            }
                        }
                    });
                };
                img.src = imageSrc;
            }
        } catch (err) {
            const error = err as Error;
            console.error(error);
            setWarning(error.message || "Failed to analyze image with Gemini.");
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirm = () => {
        const totalValue = results.reduce((sum, stack) => sum + stack.value, 0);
        if (totalValue > 0) {
            onScanComplete(totalValue);
            setOpened(false);
            reset();
        }
    };

    const handleUpdateCount = (index: number, delta: number) => {
        setResults(prev => {
            const newResults = [...prev];
            const stack = { ...newResults[index] };
            const newCount = Math.max(0, stack.count + delta);

            // Calculate new value
            const chipConfig = chips.find(c => c.color === stack.chip) || { value: 0 };
            const newValue = newCount * chipConfig.value;

            // User-adjusted counts are now considered reviewed
            newResults[index] = {
                ...stack,
                count: newCount,
                value: newValue,
                needsReview: false // User has reviewed/adjusted
            };
            return newResults;
        });
    };

    const reset = () => {
        setImage(null);
        setResults([]);
        setWarning(null);
        setAiNotes(null);
    };

    const totalValue = results.reduce((sum, stack) => sum + stack.value, 0);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpened(true)}
                aria-label="Open AI chip scanner"
                {...triggerProps}
                className={cn(
                    "text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full h-9 w-9",
                    triggerProps?.className
                )}
            >
                <ScanEye className={cn(
                    "h-4 w-4",
                    triggerProps?.size === "icon-sm" && "h-3.5 w-3.5"
                )} />
            </Button>

            <Dialog open={opened} onOpenChange={setOpened}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted border">
                                <ScanEye className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold uppercase tracking-widest">AI Chip Auditor</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest">Gemini 3.0 High-Fidelity Recognition</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {!image ? (
                                <div className="flex flex-col gap-6 w-full py-10">
                                    {/* Photo guidance for best accuracy */}
                                    <Alert className="bg-muted/30 border-primary/20">
                                        <Info className="h-4 w-4 text-primary" />
                                        <AlertTitle className="text-xs uppercase tracking-wider font-bold">For Best Accuracy</AlertTitle>
                                        <AlertDescription>
                                            <ul className="text-[10px] space-y-1 mt-2 text-muted-foreground">
                                                <li>• Take photo from the <strong>side</strong> at stack height level</li>
                                                <li>• Ensure good, even lighting (avoid shadows on stacks)</li>
                                                <li>• Separate overlapping stacks if possible</li>
                                                <li>• Keep camera steady to avoid blur</li>
                                            </ul>
                                        </AlertDescription>
                                    </Alert>

                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center gap-6 bg-accent/5 hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                                            onClick={() => camInputRef.current?.click()}>
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-2">
                                                <Layers className="w-10 h-10 text-primary/60" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-foreground font-bold tracking-widest uppercase mb-1">Capture Stack Snapshot</p>
                                                <p className="text-xs text-muted-foreground tracking-wider">Position towers within clear visibility</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <input
                                            type="file"
                                            ref={camInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileChange}
                                        />
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex-1 flex flex-col gap-2">
                                            <Button onClick={() => camInputRef.current?.click()} className="h-14 bg-muted hover:bg-muted/80 text-foreground text-xs border w-full">
                                                <Camera className="mr-2 h-4 w-4 text-primary" />
                                                Open Lens
                                            </Button>
                                        </div>
                                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 h-14 text-muted-foreground uppercase tracking-widest text-xs">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import Media
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">
                                    <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl w-full lg:w-1/2 bg-black/40 flex flex-col gap-2 p-2 min-h-[300px] lg:min-h-0">
                                        <canvas ref={canvasRef} className="w-full h-auto rounded-lg border border-border shadow-inner" />
                                        {processing && (
                                            <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center backdrop-blur-md gap-4">
                                                <div className="relative">
                                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                    <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse" />
                                                </div>
                                                <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground animate-pulse">Quantifying Assets...</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full lg:w-1/2 flex flex-col gap-6 h-full">
                                        {warning && (
                                            <Alert variant="destructive">
                                                <AlertTriangle className="w-4 h-4" />
                                                <AlertTitle className="uppercase tracking-widest text-xs font-bold">Audit Failure</AlertTitle>
                                                <AlertDescription className="text-[10px] tracking-wider">{warning}</AlertDescription>
                                            </Alert>
                                        )}
                                        {aiNotes && (
                                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
                                                <Eye className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-muted-foreground leading-relaxed italic">"{aiNotes}"</p>
                                            </div>
                                        )}

                                        <div className="bg-muted/30 border rounded-xl p-6 shadow-inner flex flex-col gap-6 flex-1">
                                            <div className="flex items-center justify-between pb-4 border-b">
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Audit Findings</span>
                                                <Badge variant="outline" className="text-primary border-primary/20 uppercase text-[9px] tracking-widest">{results.length} Stacks Detected</Badge>
                                            </div>

                                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {results.map((stack, idx) => {
                                                    const chipConfig = chips.find(c => c.color === stack.chip) || { label: '?', color: 'gray', value: 0 };
                                                    return (
                                                        <div key={stack.id} className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg bg-accent/5 border group transition-colors",
                                                            stack.isUnknown ? "border-destructive/50 bg-destructive/5" :
                                                            stack.needsReview ? "border-yellow-500/50 bg-yellow-500/5" :
                                                            "border-border hover:border-primary/30"
                                                        )}>
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-border shadow-lg relative overflow-hidden"
                                                                        style={{ backgroundColor: stack.chip === 'white' ? '#f0f0f0' : stack.chip, color: stack.chip === 'white' ? 'black' : 'white' }}>
                                                                        <div className="absolute inset-0 bg-white/10" />
                                                                        <span className="relative z-10">{chipConfig?.label || '?'}</span>
                                                                    </div>
                                                                    {/* Confidence indicator */}
                                                                    {(stack.needsReview || stack.isUnknown) && (
                                                                        <div className={cn(
                                                                            "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                                                                            stack.isUnknown ? "bg-destructive" : "bg-yellow-500"
                                                                        )}>
                                                                            <AlertTriangle className="w-2.5 h-2.5 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xs font-bold uppercase tracking-widest">{stack.chip}</p>
                                                                        {stack.isUnknown && (
                                                                            <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">Unknown</Badge>
                                                                        )}
                                                                        {!stack.isUnknown && stack.needsReview && (
                                                                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-yellow-500/50 text-yellow-600">Review</Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <button
                                                                            onClick={() => handleUpdateCount(idx, -1)}
                                                                            className="w-5 h-5 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs border"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <p className="text-[10px] text-muted-foreground font-numbers uppercase w-12 text-center">{stack.count} units</p>
                                                                        <button
                                                                            onClick={() => handleUpdateCount(idx, 1)}
                                                                            className="w-5 h-5 flex items-center justify-center rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs border"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                    {/* Confidence percentage for review items */}
                                                                    {stack.needsReview && !stack.isUnknown && (
                                                                        <p className="text-[9px] text-yellow-600 mt-0.5">
                                                                            {Math.round(stack.confidence * 100)}% confidence
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className={cn(
                                                                "font-numbers text-sm",
                                                                stack.isUnknown ? "text-destructive" : "text-foreground"
                                                            )}>
                                                                {stack.isUnknown ? "Assign value" : formatCurrency(stack.value)}
                                                            </p>
                                                        </div>
                                                    )
                                                })}
                                                {results.length === 0 && !processing && (
                                                    <div className="py-10 text-center opacity-20 grayscale">
                                                        <Info size="icon-sm" className=" mx-auto mb-2" />
                                                        <p className="text-[10px] uppercase tracking-widest">Awaiting visual data</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-6 border-t">
                                                <div className="flex items-baseline justify-between mb-6">
                                                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Collective Value</span>
                                                    <span className="text-3xl font-numbers text-foreground">
                                                        {formatCurrency(totalValue)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Button variant="ghost" onClick={reset} className="flex-1 h-12 bg-muted text-muted-foreground text-label">
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Reset Audit
                                                    </Button>
                                                    <Button onClick={handleConfirm} disabled={totalValue === 0 || processing} className="flex-1 h-12 bg-primary text-primary-foreground text-label">
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Authorize
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
};
