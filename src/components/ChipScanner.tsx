import { useState, useRef } from 'react';
import { Camera, Upload, Check, RefreshCw, ScanEye, Layers, AlertTriangle, Eye, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatIndianNumber, cn } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChipScannerProps {
    onScanComplete: (value: number) => void;
}

interface DetectedStack {
    id: number;
    count: number;
    value: number;
    chip: string; // Color name from AI
    raw: any;
}

export const ChipScanner = ({ onScanComplete }: ChipScannerProps) => {
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
                        const MAX_DIM = 1000;

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
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

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

            // @ts-ignore
            const apiKey = profile?.gemini_api_key;

            if (!apiKey) {
                setWarning("Gemini API Key is missing. Please go to Profile -> AI Settings to add it.");
                setProcessing(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const functionUrl = 'https://xfahfllkbutljcowwxpx.supabase.co/functions/v1/analyze-chips';

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || apiKey}`,
                },
                body: JSON.stringify({
                    image: imageSrc,
                    apiKey: apiKey
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || "Unknown Edge Function Error");
            }

            if (data.analysis_notes) setAiNotes(data.analysis_notes);

            const parsedStacks: DetectedStack[] = [];

            if (data.stacks && Array.isArray(data.stacks)) {
                data.stacks.forEach((s: any, idx: number) => {
                    const matchedChip = chips.find(c => c.color.toLowerCase() === s.color.toLowerCase()) ||
                        chips.find(c => c.label.toLowerCase().includes(s.color.toLowerCase())) ||
                        chips[0];

                    const val = (matchedChip ? matchedChip.value : 0) * s.count;

                    parsedStacks.push({
                        id: idx,
                        count: s.count,
                        value: val,
                        chip: matchedChip ? matchedChip.color : s.color,
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

                    data.stacks?.forEach((s: any) => {
                        if (s.box_2d) {
                            const [ymin, xmin, ymax, xmax] = s.box_2d;
                            const x = xmin / 1000 * img.width;
                            const y = ymin / 1000 * img.height;
                            const w = (xmax - xmin) / 1000 * img.width;
                            const h = (ymax - ymin) / 1000 * img.height;

                            ctx.lineWidth = 5;
                            ctx.strokeStyle = "lime";
                            ctx.strokeRect(x, y, w, h);

                            ctx.fillStyle = "rgba(0,0,0,0.5)";
                            ctx.fillRect(x, y - 40, w, 40);
                            ctx.fillStyle = "white";
                            ctx.font = "bold 30px Arial";
                            ctx.fillText(`${s.count}x ${s.color}`, x + 5, y - 10);
                        }
                    });
                };
                img.src = imageSrc;
            }
        } catch (err: any) {
            console.error(err);
            setWarning(err.message || "Failed to analyze image with Gemini.");
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

    const reset = () => {
        setImage(null);
        setResults([]);
        setWarning(null);
        setAiNotes(null);
    };

    const totalValue = results.reduce((sum, stack) => sum + stack.value, 0);

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpened(true)} className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full" title="AI Chip Scanner">
                <ScanEye className="h-4 w-4" />
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
                                        <Button onClick={() => camInputRef.current?.click()} className="flex-1 h-14 bg-muted hover:bg-muted/80 text-foreground text-xs border">
                                            <Camera className="mr-2 h-4 w-4 text-primary" />
                                            Open Lens
                                        </Button>
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
                                                {results.map((stack) => {
                                                    const chipConfig = chips.find(c => c.color === stack.chip) || { label: '?', color: 'gray' };
                                                    return (
                                                        <div key={stack.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-border group hover:border-primary/30 transition-colors">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-border shadow-lg relative overflow-hidden"
                                                                    style={{ backgroundColor: stack.chip === 'white' ? '#f0f0f0' : stack.chip, color: stack.chip === 'white' ? 'black' : 'white' }}>
                                                                    <div className="absolute inset-0 bg-white/10" />
                                                                    <span className="relative z-10">{chipConfig?.label || '?'}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold uppercase tracking-widest">{stack.chip}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-numbers uppercase">{stack.count} units</p>
                                                                </div>
                                                            </div>
                                                            <p className="font-numbers text-sm text-foreground">Rs. {formatIndianNumber(stack.value)}</p>
                                                        </div>
                                                    )
                                                })}
                                                {results.length === 0 && !processing && (
                                                    <div className="py-10 text-center opacity-20 grayscale">
                                                        <Info className="h-8 w-8 mx-auto mb-2" />
                                                        <p className="text-[10px] uppercase tracking-widest">Awaiting visual data</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-6 border-t">
                                                <div className="flex items-baseline justify-between mb-6">
                                                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Collective Value</span>
                                                    <span className="text-3xl font-numbers text-foreground">
                                                        Rs. {formatIndianNumber(totalValue)}
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
