
import { useState, useRef, useEffect } from 'react';
import { Modal, Group, Text, Stack, FileButton, ScrollArea, Alert, Badge } from '@mantine/core';
import { Camera, Upload, Check, RefreshCw, ScanEye, Layers, AlertTriangle, Eye, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipDenomination } from '@/config/chips';
import { formatIndianNumber } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
    const { chips } = useChips();
    const navigate = useNavigate();

    const handleFileChange = (file: File | null) => {
        if (file) {
            // Compress Image Logic
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
            // Fetch API Key from Profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to scan chips.");

            const { data: profile } = await supabase
                .from('profiles')
                .select('gemini_api_key')
                .eq('id', user.id)
                .single();

            // @ts-ignore
            const apiKey = profile?.gemini_api_key;

            if (!apiKey) {
                setWarning("Gemini API Key is missing. Please go to Profile -> AI Settings to add it.");
                setProcessing(false);
                return;
            }

            const { data, error } = await supabase.functions.invoke('analyze-chips', {
                body: {
                    image: imageSrc,
                    apiKey: apiKey // Send user key from DB
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            console.log("Gemini Response:", data);

            if (data.analysis_notes) setAiNotes(data.analysis_notes); // Fixed typo setAiNotes vs analysis_notes

            const parsedStacks: DetectedStack[] = [];

            if (data.stacks && Array.isArray(data.stacks)) {
                data.stacks.forEach((s: any, idx: number) => {
                    // Match color to our config
                    // AI returns 'red', 'blue', etc.
                    // We need to find the chip config that matches this color.
                    const matchedChip = chips.find(c => c.color.toLowerCase() === s.color.toLowerCase()) ||
                        chips.find(c => c.label.toLowerCase().includes(s.color.toLowerCase())) ||
                        chips[0]; // Fallback?

                    const val = (matchedChip ? matchedChip.value : 0) * s.count;

                    parsedStacks.push({
                        id: idx,
                        count: s.count,
                        value: val,
                        chip: matchedChip ? matchedChip.color : s.color, // Display string
                        raw: s
                    });
                });
            }

            setResults(parsedStacks);

            // Draw Bounding Boxes if available
            if (canvasRef.current) {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = canvasRef.current!;
                    const ctx = canvas.getContext('2d')!;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // Draw boxes
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
            <Button variant="ghost" size="sm" onClick={() => setOpened(true)} className="h-8 w-8 p-0" title="Scan Chips">
                <ScanEye className="h-4 w-4 text-primary" />
            </Button>

            <Modal opened={opened} onClose={() => setOpened(false)} title={<Text fw={700}>AI Chip Scanner (Gemini 3.0)</Text>} centered size="xl" padding="lg">
                <Stack align="center" gap="lg">
                    {!image ? (
                        <div className="flex flex-col gap-4 w-full h-[300px] justify-center">
                            <div className="p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center text-center gap-4 bg-muted/10 h-full">
                                <Layers className="w-12 h-12 text-muted-foreground" />
                                <Text size="sm" c="dimmed">Take a photo of chip towers. <br />Gemini 3.0 will analyze them.</Text>
                            </div>
                            <Group grow>
                                <FileButton onChange={handleFileChange} accept="image/*" capture="environment">
                                    {(props) => <Button {...props} variant="default" className="h-12"><Camera className="mr-2 h-4 w-4" />Take Photo</Button>}
                                </FileButton>
                                <FileButton onChange={handleFileChange} accept="image/*">
                                    {(props) => <Button {...props} variant="outline" className="h-12"><Upload className="mr-2 h-4 w-4" />Upload</Button>}
                                </FileButton>
                            </Group>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                            <div className="relative rounded-lg overflow-hidden border shadow-sm w-full lg:w-1/2 bg-black/5 flex flex-col gap-2 p-2">
                                <canvas ref={canvasRef} className="w-full h-auto rounded border border-gray-300 shadow-sm" style={{ maxHeight: '500px' }} />
                                {processing && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
                                        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            <Text fw={500}>Gemini is counting...</Text>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full lg:w-1/2 flex flex-col gap-4 h-full">
                                {warning && (
                                    <Alert variant="destructive" title="Error" icon={<AlertTriangle className="w-4 h-4" />}>{warning}</Alert>
                                )}
                                {aiNotes && (
                                    <Alert variant="light" color="blue" icon={<Eye className="h-4 w-4" />}>
                                        <Text size="xs">{aiNotes}</Text>
                                    </Alert>
                                )}
                                <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-4 flex-1">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <Text size="sm" c="dimmed" fw={600} tt="uppercase">AI Findings</Text>
                                        <Badge variant="light" color="gray">{results.length} stacks</Badge>
                                    </div>
                                    <ScrollArea.Autosize mah={300} type="scroll">
                                        <Stack gap="sm">
                                            {results.map((stack) => {
                                                const chipConfig = chips.find(c => c.color === stack.chip) || { label: '?', color: 'gray' };
                                                return (
                                                    <div key={stack.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white/20"
                                                                style={{ backgroundColor: stack.chip === 'white' ? '#f0f0f0' : stack.chip, color: stack.chip === 'white' ? 'black' : 'white' }}>
                                                                {chipConfig?.label || '?'}
                                                            </div>
                                                            <div>
                                                                <Text size="sm" fw={600} className="capitalize">{stack.chip}</Text>
                                                                <Text size="xs" c="dimmed">{stack.count} chips</Text>
                                                            </div>
                                                        </div>
                                                        <Text fw={700} size="sm">Rs. {formatIndianNumber(stack.value)}</Text>
                                                    </div>
                                                )
                                            })}
                                        </Stack>
                                    </ScrollArea.Autosize>
                                    <div className="mt-auto pt-4 border-t">
                                        <div className="flex items-end justify-between mb-4">
                                            <Text size="sm" c="dimmed">Total</Text>
                                            <Text size="xl" fw={800} c="primary">Rs. {formatIndianNumber(totalValue)}</Text>
                                        </div>
                                        <Group grow>
                                            <Button variant="ghost" onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />Retake</Button>
                                            <Button onClick={handleConfirm} disabled={totalValue === 0}><Check className="mr-2 h-4 w-4" />Confirm</Button>
                                        </Group>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Stack>
            </Modal>
        </>
    );
};
