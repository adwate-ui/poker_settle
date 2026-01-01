import { useState, useRef, useEffect } from 'react';
import { Modal, Group, Text, Stack, FileButton, ScrollArea, Alert, Badge } from '@mantine/core';
import { Camera, Upload, Check, RefreshCw, ScanEye, Layers, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipDenomination } from '@/config/chips';
import { formatIndianNumber } from '@/lib/utils';
import { useChips } from '@/contexts/ChipContext';

interface ChipScannerProps {
    onScanComplete: (value: number) => void;
}

interface DetectedStack {
    id: number;
    count: number;
    value: number;
    chip: ChipDenomination;
}

// --- CV Helper Functions ---

const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return [h, s * 100, l * 100];
};

const computeLaplacianVariance = (data: Uint8ClampedArray, width: number, height: number): number => {
    let mean = 0;
    let count = 0;
    const laplacianValues = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const idx = (y * width + x) * 4;
            const getLum = (i: number) => (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const center = getLum(idx);
            const north = getLum(((y - 1) * width + x) * 4);
            const south = getLum(((y + 1) * width + x) * 4);
            const west = getLum((y * width + (x - 1)) * 4);
            const east = getLum((y * width + (x + 1)) * 4);
            const lap = north + south + west + east - 4 * center;
            laplacianValues[count] = lap;
            mean += lap;
            count++;
        }
    }
    mean /= count;
    let variance = 0;
    for (let i = 0; i < count; i++) {
        variance += Math.pow(laplacianValues[i] - mean, 2);
    }
    return variance / count;
};

// Direct Stripe Counting
const countStripes = (signal: number[]): { count: number, confidence: number } => {
    // 1. Detect significant edges
    const edges: number[] = [];
    const threshold = 15; // Min variation to considered edge

    // Smooth first
    const smoothed = [];
    for (let i = 2; i < signal.length - 2; i++) {
        smoothed.push((signal[i - 2] + signal[i - 1] + signal[i] + signal[i + 1] + signal[i + 2]) / 5);
    }

    // Find peaks in gradient -> stripe edges
    let lastPeakPos = -100;
    let stripeEvents = 0;

    for (let i = 1; i < smoothed.length - 1; i++) {
        const grad = Math.abs(smoothed[i + 1] - smoothed[i - 1]);
        if (grad > threshold) {
            // Local max gradient
            const gradPrev = Math.abs(smoothed[i] - smoothed[i - 2]);
            const gradNext = Math.abs(smoothed[i + 2] - smoothed[i]);
            if (grad >= gradPrev && grad >= gradNext) {
                // Check debounce/min dist
                if (i - lastPeakPos > 3) {
                    stripeEvents++;
                    lastPeakPos = i;
                }
            }
        }
    }

    // Heuristic: A chip has 2 edges (top/bottom) or 3 if we see the stripe.
    // If we count 'stripe events', we roughly have 2-3 events per chip.
    // Let's assume ~2.5 events per chip on average for typical pattern.
    // Or closer to 1 chip = ~10-15px height.

    return { count: stripeEvents, confidence: stripeEvents > 3 ? 1.0 : 0.0 };
};

export const ChipScanner = ({ onScanComplete }: ChipScannerProps) => {
    const [opened, setOpened] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<DetectedStack[]>([]);
    const [warning, setWarning] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { chips } = useChips();
    const chipsRef = useRef(chips);

    useEffect(() => {
        chipsRef.current = chips;
    }, [chips]);

    const handleFileChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImage(e.target.result as string);
                    processImage(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Strict Color Voting ---
    const getDominantChipColor = (
        data: Uint8ClampedArray,
        width: number,
        startX: number,
        endX: number,
        startY: number,
        endY: number,
        whitePoint?: { r: number, g: number, b: number }
    ): { chip: ChipDenomination, confidence: number } => {
        const votes: Record<string, number> = {};
        chips.forEach(c => votes[c.color] = 0);
        let totalVotes = 0;

        for (let y = startY; y < endY; y += 4) {
            for (let x = startX; x < endX; x += 4) {
                const i = (y * width + x) * 4;
                let r = data[i], g = data[i + 1], b = data[i + 2];

                if (whitePoint) {
                    r = Math.min(255, (r / whitePoint.r) * 255);
                    g = Math.min(255, (g / whitePoint.g) * 255);
                    b = Math.min(255, (b / whitePoint.b) * 255);
                }

                const [h, s, l] = rgbToHsl(r, g, b);

                // --- 1. FILTER: Ignore Stripe Colors (Hypothesis) ---
                // Most chips have WHITE stripes. If pixel is white-ish, IGNORE IT for voting.
                // Unless the chip ITSELF is white.
                // Heuristic: If Saturation is very low and Lightness is high, it's likely a stripe 
                // (or a white chip). 
                // We collect votes. If 'White' wins, we accept it. But for Red/Blue/Green, we rely on HUE.

                let bestMatchForPixel = null;
                let minDist = Infinity;

                for (const chip of chips) {
                    const [ch, cs, cl] = rgbToHsl(chip.rgb[0], chip.rgb[1], chip.rgb[2]);
                    let hDiff = Math.abs(h - ch);
                    if (hDiff > 180) hDiff = 360 - hDiff;

                    let dist = 0;
                    if (cs < 15 || cl < 15 || cl > 85) {
                        // Achromatic chip target
                        dist = Math.abs(l - cl) * 2 + Math.abs(s - cs) * 0.5;
                    } else {
                        // Chromatic chip target
                        dist = hDiff * 2 + Math.abs(s - cs) * 0.5 + Math.abs(l - cl) * 0.5;
                    }

                    if (dist < minDist) {
                        minDist = dist;
                        bestMatchForPixel = chip;
                    }
                }

                if (bestMatchForPixel && minDist < 50) {
                    // Inner Core Vote Logic
                    // If pixel looks "White-ish" (Stripe) but vote is for "Blue" -> It might be a stripe.
                    // But if 'bestMatch' IS Blue, it means pixel is Blue.
                    // If pixel is White, 'bestMatch' would be White (if White chip exists).
                    votes[bestMatchForPixel.color]++;
                    totalVotes++;
                }
            }
        }

        let winner = chips[0];
        let maxVotes = -1;
        for (const chip of chips) {
            if (votes[chip.color] > maxVotes) {
                maxVotes = votes[chip.color];
                winner = chip;
            }
        }

        return {
            chip: winner,
            confidence: totalVotes > 0 ? maxVotes / totalVotes : 0
        };
    };

    const processImage = (imageSrc: string) => {
        setProcessing(true);
        setWarning(null);
        setResults([]);

        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const targetHeight = 600;
            const scale = targetHeight / img.height;
            const width = Math.floor(img.width * scale);
            const height = targetHeight;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);
            const frameData = ctx.getImageData(0, 0, width, height);

            const blurScore = computeLaplacianVariance(frameData.data, width, height);
            if (blurScore < 80) setWarning("Image is blurry. Please keep phone steady.");

            // --- Robust Segmentation ---
            const vProfile = new Float32Array(width);
            for (let x = 0; x < width; x++) {
                let colSum = 0;
                for (let y = 10; y < height - 10; y += 2) {
                    const i = (y * width + x) * 4;
                    const i_prev = ((y - 2) * width + x) * 4;
                    const diff = Math.abs(frameData.data[i] - frameData.data[i_prev]);
                    if (diff > 10) colSum += diff;
                }
                vProfile[x] = colSum;
            }

            const smoothedProfile = new Float32Array(width);
            const wSize = 10;
            for (let x = 0; x < width; x++) {
                let sum = 0, cnt = 0;
                for (let k = -wSize; k <= wSize; k++) {
                    if (x + k >= 0 && x + k < width) { sum += vProfile[x + k]; cnt++; }
                }
                smoothedProfile[x] = sum / cnt;
            }

            const maxVal = Math.max(...smoothedProfile);
            const noiseFloor = maxVal * 0.15;

            const peaks: { pos: number, val: number }[] = [];
            for (let x = wSize; x < width - wSize; x++) {
                if (smoothedProfile[x] > noiseFloor) {
                    if (smoothedProfile[x] >= smoothedProfile[x - 1] && smoothedProfile[x] > smoothedProfile[x + 1]) {
                        let impliesPeak = true;
                        for (let k = -15; k <= 15; k++) if (smoothedProfile[x + k] > smoothedProfile[x]) impliesPeak = false;
                        if (impliesPeak) {
                            if (peaks.length === 0 || x - peaks[peaks.length - 1].pos > 30) {
                                peaks.push({ pos: x, val: smoothedProfile[x] });
                            }
                        }
                    }
                }
            }

            const towers: { start: number, end: number }[] = [];
            if (peaks.length > 0) {
                if (peaks.length === 1) {
                    let s = peaks[0].pos, e = peaks[0].pos;
                    while (s > 0 && smoothedProfile[s] > noiseFloor * 0.5) s--;
                    while (e < width && smoothedProfile[e] > noiseFloor * 0.5) e++;
                    if (e - s > 20) towers.push({ start: s, end: e });
                } else {
                    let bounds: number[] = [];
                    let s = peaks[0].pos;
                    while (s > 0 && smoothedProfile[s] > noiseFloor * 0.5) s--;
                    bounds.push(s);

                    for (let i = 0; i < peaks.length - 1; i++) {
                        let minV = Infinity, minPos = peaks[i].pos;
                        for (let k = peaks[i].pos; k < peaks[i + 1].pos; k++) {
                            if (smoothedProfile[k] < minV) { minV = smoothedProfile[k]; minPos = k; }
                        }
                        bounds.push(minPos);
                    }

                    let e = peaks[peaks.length - 1].pos;
                    while (e < width && smoothedProfile[e] > noiseFloor * 0.5) e++;
                    bounds.push(e);

                    for (let i = 0; i < bounds.length - 1; i++) {
                        if (bounds[i + 1] - bounds[i] > 20) {
                            towers.push({ start: bounds[i], end: bounds[i + 1] });
                        }
                    }
                }
            } else {
                towers.push({ start: width * 0.25, end: width * 0.75 });
            }

            // White Point
            let whitePoint = { r: 255, g: 255, b: 255 };
            let maxLum = 0;
            for (let y = height * 0.3; y < height * 0.7; y += 10) {
                for (let t of towers) {
                    const cx = Math.floor((t.start + t.end) / 2);
                    const i = (Math.floor(y) * width + cx) * 4;
                    const r = frameData.data[i], g = frameData.data[i + 1], b = frameData.data[i + 2];
                    const [h, s, l] = rgbToHsl(r, g, b);
                    if (l > 60 && s < 15 && l > maxLum) {
                        maxLum = l;
                        whitePoint = { r, g, b };
                    }
                }
            }

            // --- Visualization Setup ---
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const y = height - (smoothedProfile[x] / maxVal) * (height / 4);
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();

            const detected: DetectedStack[] = [];

            // --- Tower Processing & Validation ---
            towers.forEach((tower, idx) => {
                const cx = Math.floor((tower.start + tower.end) / 2);
                const w = tower.end - tower.start;

                // Vertical Crop
                let topY = 0, bottomY = height;
                for (let y = height * 0.1; y < height - 10; y += 5) {
                    const i = (Math.floor(y) * width + cx) * 4;
                    if (y < height - 10) {
                        const i_next = (Math.floor(y + 5) * width + cx) * 4;
                        if (Math.abs(frameData.data[i] - frameData.data[i_next]) > 20) {
                            topY = y; break;
                        }
                    }
                }
                for (let y = height * 0.9; y > topY; y -= 5) {
                    const i = (Math.floor(y) * width + cx) * 4;
                    if (y > 10) {
                        const i_prev = (Math.floor(y - 5) * width + cx) * 4;
                        if (Math.abs(frameData.data[i] - frameData.data[i_prev]) > 20) {
                            bottomY = y; break;
                        }
                    }
                }
                topY += 10; bottomY -= 10;
                if (bottomY <= topY) { bottomY = height * 0.8; topY = height * 0.2; }

                // --- 1. STRIPE VALIDATION (Anti-Hallucination) ---
                // Extract signal
                const signal = [];
                for (let y = topY; y < bottomY; y++) {
                    const i = (y * width + cx) * 4;
                    signal.push((frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3);
                }

                const { count: stripeEvents } = countStripes(signal);

                // Draw validation Dots
                ctx.fillStyle = "lime";
                if (stripeEvents < 3) ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(cx, topY, 5, 0, Math.PI * 2);
                ctx.fill();

                if (stripeEvents < 3) {
                    // REJECT: Not enough stripes to be a chip stack
                    // This kills shadows/wood textures
                    return;
                }

                // --- 2. Color Detection (Inner Core) ---
                const result = getDominantChipColor(
                    frameData.data, width,
                    tower.start + w * 0.35, // Stricter Inner 30%
                    tower.end - w * 0.35,
                    topY, bottomY, whitePoint
                );

                // --- 3. Counting ---
                // Use stripe count refined by chip thickness estimate
                // A typical chip is ~10-15px. 
                // If stripe events are high, use them.
                // let count = Math.ceil(stripeEvents / 2.5); 
                // Or better: use height / 12px default
                const stackHeight = bottomY - topY;
                let count = Math.round(stackHeight / 13); // Approx 13px per chip default


                detected.push({
                    id: idx,
                    count: Math.max(1, count),
                    value: Math.max(1, count) * result.chip.value,
                    chip: result.chip
                });

                // Draw Box
                ctx.lineWidth = 3;
                ctx.strokeStyle = result.chip.color === 'black' ? '#FFFFFF' : result.chip.color;
                if (result.chip.color === 'white') ctx.strokeStyle = 'gold';

                ctx.strokeRect(tower.start, topY - 10, w, (bottomY - topY) + 20);

                // Label
                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(tower.start, topY - 45, w, 35);
                ctx.fillStyle = "white";
                ctx.font = "bold 14px Arial";
                ctx.fillText(`${count}x ${result.chip.label}`, tower.start + 5, topY - 25);
                ctx.font = "10px Arial";
                ctx.fillText(`Stripes: ${stripeEvents}`, tower.start + 5, topY - 12);
            });

            setResults(detected);
            setProcessing(false);
            canvas.classList.remove('hidden');
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
        };
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
    };

    const totalValue = results.reduce((sum, stack) => sum + stack.value, 0);

    return (
        <>
            <Button variant="ghost" size="sm" onClick={() => setOpened(true)} className="h-8 w-8 p-0" title="Scan Chips">
                <ScanEye className="h-4 w-4 text-primary" />
            </Button>

            <Modal opened={opened} onClose={() => setOpened(false)} title={<Text fw={700}>Scan Chip Stacks</Text>} centered size="xl" padding="lg">
                <Stack align="center" gap="lg">
                    {!image ? (
                        <div className="flex flex-col gap-4 w-full h-[300px] justify-center">
                            <div className="p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center text-center gap-4 bg-muted/10 h-full">
                                <Layers className="w-12 h-12 text-muted-foreground" />
                                <Text size="sm" c="dimmed">Take a photo of chip towers. <br />Ensure distinct gaps between stacks.</Text>
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
                                <Text size="xs" c="dimmed" className="bg-white/80 px-2 py-1 rounded w-fit">Debug View (Green Dot = Valid Stack)</Text>
                                <canvas ref={canvasRef} className="w-full h-auto rounded border border-gray-300 shadow-sm" style={{ maxHeight: '500px' }} />
                            </div>

                            <div className="w-full lg:w-1/2 flex flex-col gap-4 h-full">
                                {warning && (
                                    <Alert variant="light" color="yellow" title="Warning" icon={<AlertTriangle className="w-4 h-4" />}>{warning}</Alert>
                                )}
                                <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-4 flex-1">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <Text size="sm" c="dimmed" fw={600} tt="uppercase">Detected Stacks</Text>
                                        <Badge variant="light" color="gray">{results.length} found</Badge>
                                    </div>
                                    <ScrollArea.Autosize mah={300} type="scroll">
                                        <Stack gap="sm">
                                            {results.map((stack) => (
                                                <div key={stack.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white/20"
                                                            style={{ backgroundColor: stack.chip.color === 'white' ? '#f0f0f0' : stack.chip.color, color: stack.chip.color === 'white' ? 'black' : 'white' }}>
                                                            {stack.chip.label}
                                                        </div>
                                                        <div>
                                                            <Text size="sm" fw={600}>{stack.chip.color}</Text>
                                                            <Text size="xs" c="dimmed">{stack.count} chips</Text>
                                                        </div>
                                                    </div>
                                                    <Text fw={700} size="sm">Rs. {formatIndianNumber(stack.value)}</Text>
                                                </div>
                                            ))}
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
