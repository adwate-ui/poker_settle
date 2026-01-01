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

const computeAutocorrelation = (signal: number[]): number[] => {
    const n = signal.length;
    let mean = 0;
    for (let val of signal) mean += val;
    mean /= n;
    const norm = signal.map(v => v - mean);
    const result = [];
    for (let lag = 0; lag < Math.floor(n / 2); lag++) {
        let sum = 0;
        for (let i = 0; i < n - lag; i++) {
            sum += norm[i] * norm[i + lag];
        }
        result.push(sum);
    }
    return result;
}

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

    // --- Voting-Based Color Detecion ---
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

                let minDist = Infinity;
                let bestMatchForPixel = null;
                const [h, s, l] = rgbToHsl(r, g, b);

                for (const chip of chips) {
                    const [ch, cs, cl] = rgbToHsl(chip.rgb[0], chip.rgb[1], chip.rgb[2]);
                    let hDiff = Math.abs(h - ch);
                    if (hDiff > 180) hDiff = 360 - hDiff;

                    let dist = 0;
                    if (cs < 15 || cl < 15 || cl > 85) {
                        dist = Math.abs(l - cl) * 2 + Math.abs(s - cs) * 0.5;
                    } else {
                        dist = hDiff * 2 + Math.abs(s - cs) * 0.5 + Math.abs(l - cl) * 0.5; // Hue weighted heavily
                    }

                    if (dist < minDist) {
                        minDist = dist;
                        bestMatchForPixel = chip;
                    }
                }

                // Stricter Threshold: Pixel must be reasonably close to a known color
                if (bestMatchForPixel && minDist < 50) {
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

            // --- Peak & Valley Segmentation ---
            // 1. Vertical Energy Profile
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

            // 2. Smooth Profile
            const smoothedProfile = new Float32Array(width);
            const wSize = 10;
            for (let x = 0; x < width; x++) {
                let sum = 0, cnt = 0;
                for (let k = -wSize; k <= wSize; k++) {
                    if (x + k >= 0 && x + k < width) { sum += vProfile[x + k]; cnt++; }
                }
                smoothedProfile[x] = sum / cnt;
            }

            // 3. Find Valley-Separated Towers
            const maxVal = Math.max(...smoothedProfile);
            const noiseFloor = maxVal * 0.15;

            // Find all potential peaks
            const peaks: { pos: number, val: number }[] = [];
            for (let x = wSize; x < width - wSize; x++) {
                if (smoothedProfile[x] > noiseFloor) {
                    if (smoothedProfile[x] >= smoothedProfile[x - 1] && smoothedProfile[x] > smoothedProfile[x + 1]) {
                        // Check local neighborhood max
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

            // Check valleys between peaks
            const towers: { start: number, end: number }[] = [];

            if (peaks.length > 0) {
                if (peaks.length === 1) {
                    // Single peak logic
                    let s = peaks[0].pos, e = peaks[0].pos;
                    while (s > 0 && smoothedProfile[s] > noiseFloor * 0.5) s--;
                    while (e < width && smoothedProfile[e] > noiseFloor * 0.5) e++;
                    if (e - s > 20) towers.push({ start: s, end: e });
                } else {
                    // Multiple peaks - check valleys
                    let bounds: number[] = [];
                    // Start boundary
                    let s = peaks[0].pos;
                    while (s > 0 && smoothedProfile[s] > noiseFloor * 0.5) s--;
                    bounds.push(s);

                    for (let i = 0; i < peaks.length - 1; i++) {
                        // Find lowest point between peak i and i+1
                        let minV = Infinity, minPos = peaks[i].pos;
                        for (let k = peaks[i].pos; k < peaks[i + 1].pos; k++) {
                            if (smoothedProfile[k] < minV) { minV = smoothedProfile[k]; minPos = k; }
                        }
                        bounds.push(minPos);
                    }

                    // End boundary
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

            // 4. White Point
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

            // 5. Detection & Visualization
            const detected: DetectedStack[] = [];

            // Draw Energy Profile
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const y = height - (smoothedProfile[x] / maxVal) * (height / 4);
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw Peaks/Bounds
            peaks.forEach(p => {
                ctx.fillStyle = "rgba(255, 255, 0, 0.5)"; // Yellow peaks
                ctx.fillRect(p.pos - 2, height - 15, 4, 15);
            });

            towers.forEach((tower, idx) => {
                const cx = Math.floor((tower.start + tower.end) / 2);
                const w = tower.end - tower.start;

                // Vertical Crop logic
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

                const result = getDominantChipColor(
                    frameData.data, width,
                    tower.start + w * 0.3,
                    tower.end - w * 0.3,
                    topY, bottomY, whitePoint
                );

                // Autocorrelation Counting
                const signal = [];
                for (let y = 0; y < height; y++) {
                    const i = (y * width + cx) * 4;
                    signal.push((frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3);
                }
                const smoothed = [];
                for (let i = 2; i < signal.length - 2; i++) smoothed.push((signal[i - 2] + signal[i - 1] + signal[i] + signal[i + 1] + signal[i + 2]) / 5);
                const edges = [];
                for (let i = 1; i < smoothed.length; i++) edges.push(Math.abs(smoothed[i] - smoothed[i - 1]));
                const ac = computeAutocorrelation(edges);
                let peakLag = 0, peakVal = 0;
                for (let lag = 8; lag < 65 && lag < ac.length; lag++) {
                    if (ac[lag] > ac[lag - 1] && ac[lag] > ac[lag + 1] && ac[lag] > peakVal) {
                        peakVal = ac[lag]; peakLag = lag;
                    }
                }
                let count = 0;
                if (peakLag > 0) {
                    const activeHeight = bottomY - topY + 20;
                    count = Math.max(1, Math.round(activeHeight / peakLag));
                } else {
                    count = Math.max(1, Math.round((bottomY - topY) / 15));
                }

                detected.push({
                    id: idx,
                    count: count,
                    value: count * result.chip.value,
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
                ctx.fillText(`Conf: ${(result.confidence * 100).toFixed(0)}%`, tower.start + 5, topY - 12);
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
                                <Text size="xs" c="dimmed" className="bg-white/80 px-2 py-1 rounded w-fit">Debug View (Cyan Line = Edge Energy)</Text>
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
                                            {results.map((stack) => {
                                                const bgClass = stack.chip.color === 'white' ? 'bg-slate-100 border-slate-300 text-black' : `bg-${stack.chip.color}-600 text-white`;
                                                return (
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
