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

// 1. Color Conversion (RGB -> HSL)
// H: 0-360, S: 0-100, L: 0-100
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

// 2. Laplacian Variance (Blur Detection)
// Returns a score. Lower < 100 usually means blurry.
const computeLaplacianVariance = (data: Uint8ClampedArray, width: number, height: number): number => {
    // Standard Laplacian kernel
    // [0  1  0]
    // [1 -4  1]
    // [0  1  0]
    let mean = 0;
    let count = 0;
    const laplacianValues = new Float32Array(width * height);

    // Skip borders
    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            const idx = (y * width + x) * 4;
            // luminosity
            const getLum = (i: number) => (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);

            const center = getLum(idx);
            const north = getLum(((y - 1) * width + x) * 4);
            const south = getLum(((y + 1) * width + x) * 4);
            const west = getLum((y * width + (x - 1)) * 4);
            const east = getLum((y * width + (x + 1)) * 4);

            // Convolution
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

// 3. Autocorrelation for Periodicity (Counting)
const computeAutocorrelation = (signal: number[]): number[] => {
    const n = signal.length;
    let mean = 0;
    for (let val of signal) mean += val;
    mean /= n;

    // Normalized zero-mean signal
    const norm = signal.map(v => v - mean);
    const result = [];

    // Compute AC for lags 0 to n/2
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

    // Advanced Color Matching with White Balance
    const findClosestChip = (r: number, g: number, b: number, whitePoint?: { r: number, g: number, b: number }): ChipDenomination => {
        // 1. White Balance (Von Kries)
        if (whitePoint) {
            r = Math.min(255, (r / whitePoint.r) * 255);
            g = Math.min(255, (g / whitePoint.g) * 255);
            b = Math.min(255, (b / whitePoint.b) * 255);
        }

        const [h, s, l] = rgbToHsl(r, g, b);

        let minScore = Infinity;
        let closest = chips[0];

        for (const chip of chips) {
            const [ch, cs, cl] = rgbToHsl(chip.rgb[0], chip.rgb[1], chip.rgb[2]);

            // Perceptual distance
            // Hue distance (circular)
            let hDiff = Math.abs(h - ch);
            if (hDiff > 180) hDiff = 360 - hDiff;

            // Weights: Hue is critical for colors, L is critical for black/white
            let score = 0;

            if (cs < 10 || cl > 90 || cl < 15) {
                // Achromatic chips (White, Black, Grey)
                // Rely mostly on Lightness
                score = Math.abs(l - cl) * 2 + Math.abs(s - cs) * 0.5;
            } else {
                // Chromatic chips (Red, Blue, Green, Yellow)
                // Rely mostly on Hue
                score = hDiff * 2 + Math.abs(s - cs) * 0.5 + Math.abs(l - cl) * 0.5;
            }

            if (score < minScore) {
                minScore = score;
                closest = chip;
            }
        }
        return closest;
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

            // 1. Load & Resize
            // High Resolution for Blur Check
            const targetHeight = 800;
            const scale = targetHeight / img.height;
            const width = Math.floor(img.width * scale);
            const height = targetHeight;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);
            const frameData = ctx.getImageData(0, 0, width, height);

            // 2. Pre-processing: Blur Detection
            const blurScore = computeLaplacianVariance(frameData.data, width, height);
            console.log('Blur Score:', blurScore);
            if (blurScore < 100) { // Threshold for "Too Blurry"
                setWarning("Image appears blurry. Results may be inaccurate. Please ensure distinct chip edges are visible.");
            }

            // 3. Segmentation: Adaptive Thresholding & Tower Finding
            // We use vertical projection profiling again, but robustified
            const vProfile = new Float32Array(width);
            let globalMaxVal = 0;

            for (let x = 0; x < width; x++) {
                let colSum = 0;
                // Sample vertical line
                for (let y = 0; y < height; y += 4) {
                    const i = (y * width + x) * 4;
                    // Invert: Chips are usually distinct from background.
                    // Assume background is darker or uniform.
                    // Let's rely on edge density for column activity
                    if (y > 4) {
                        const i_prev = ((y - 4) * width + x) * 4;
                        const diff = Math.abs(
                            (frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3 -
                            (frameData.data[i_prev] + frameData.data[i_prev + 1] + frameData.data[i_prev + 2]) / 3
                        );
                        colSum += diff;
                    }
                }
                vProfile[x] = colSum;
                if (colSum > globalMaxVal) globalMaxVal = colSum;
            }

            // Threshold: 20% of max activity
            const towers: { start: number, end: number }[] = [];
            let inTower = false;
            let start = 0;
            const actThresh = globalMaxVal * 0.2;

            for (let x = 0; x < width; x++) {
                if (vProfile[x] > actThresh) {
                    if (!inTower) { inTower = true; start = x; }
                } else {
                    if (inTower) {
                        // End of tower
                        if (x - start > 40) { // Min width
                            towers.push({ start, end: x });
                        }
                        inTower = false;
                    }
                }
            }
            if (inTower && width - start > 40) towers.push({ start, end: width });

            // Merge close towers (gap < 20px)
            const mergedTowers: typeof towers = [];
            if (towers.length > 0) {
                let curr = towers[0];
                for (let i = 1; i < towers.length; i++) {
                    if (towers[i].start - curr.end < 20) {
                        curr.end = towers[i].end;
                    } else {
                        mergedTowers.push(curr);
                        curr = towers[i];
                    }
                }
                mergedTowers.push(curr);
            } else {
                // Fallback center
                mergedTowers.push({ start: width * 0.25, end: width * 0.75 });
            }

            // 4. White Anchor Detection
            // Scan distinct colors to find a "White" candidate to calibrate
            let whitePoint = { r: 255, g: 255, b: 255 }; // Default no-op
            let maxLum = 0;
            // Iterate centers of towers
            mergedTowers.forEach(t => {
                const cx = Math.floor((t.start + t.end) / 2);
                for (let y = height * 0.2; y < height * 0.8; y += 10) {
                    const i = (Math.floor(y) * width + cx) * 4;
                    const r = frameData.data[i], g = frameData.data[i + 1], b = frameData.data[i + 2];
                    const [h, s, l] = rgbToHsl(r, g, b);
                    // Potential white: High brightness, low saturation
                    if (l > 60 && s < 20) {
                        if (l > maxLum) {
                            maxLum = l;
                            whitePoint = { r, g, b };
                        }
                    }
                }
            });
            console.log("White Anchor:", whitePoint);


            // 5. Processing Towers (Counting & Color)
            const detected: DetectedStack[] = [];

            mergedTowers.forEach((tower, idx) => {
                const w = tower.end - tower.start;
                const cx = Math.floor(tower.start + w / 2);

                // A. Color
                let rAcc = 0, gAcc = 0, bAcc = 0, nAcc = 0;
                for (let y = height * 0.2; y < height * 0.8; y += 5) {
                    const i = (Math.floor(y) * width + cx) * 4;
                    rAcc += frameData.data[i];
                    gAcc += frameData.data[i + 1];
                    bAcc += frameData.data[i + 2];
                    nAcc++;
                }
                const matchedChip = findClosestChip(rAcc / nAcc, gAcc / nAcc, bAcc / nAcc, whitePoint);

                // B. Counting via Autocorrelation (FFT-lite)
                // Extract vertical signal (luminance)
                const signal: number[] = [];
                for (let y = 0; y < height; y++) {
                    const i = (y * width + cx) * 4;
                    const lum = (frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3;
                    signal.push(lum);
                }

                // Smooth signal
                const smoothed = [];
                for (let i = 2; i < signal.length - 2; i++) {
                    smoothed.push((signal[i - 2] + signal[i - 1] + signal[i] + signal[i + 1] + signal[i + 2]) / 5);
                }

                // Compute Edges (Gradient)
                const edges = [];
                for (let i = 1; i < smoothed.length; i++) {
                    edges.push(Math.abs(smoothed[i] - smoothed[i - 1]));
                }

                // Autocorrelate the Edge signal
                // Peaks in AC of edges = chip thickness
                const ac = computeAutocorrelation(edges);

                // Find first major peak in AC (after lag 5 to avoid noise)
                let peakLag = 0;
                let peakVal = 0;
                // Search range: 8px to 60px (valid chip thickness range)
                for (let lag = 8; lag < 60 && lag < ac.length; lag++) {
                    // Simple local max
                    if (ac[lag] > ac[lag - 1] && ac[lag] > ac[lag + 1]) {
                        if (ac[lag] > peakVal) {
                            peakVal = ac[lag];
                            peakLag = lag;
                        }
                    }
                }

                let count = 0;
                // If we found a valid frequency
                if (peakLag > 0) {
                    // Check vertical extent of stack (where signal activity is high)
                    // Use threshold on edge signal
                    const thresh = Math.max(...edges) * 0.15;
                    let top = 0, bot = edges.length;
                    for (let i = 0; i < edges.length; i++) {
                        if (edges[i] > thresh) { top = i; break; }
                    }
                    for (let i = edges.length - 1; i > 0; i--) {
                        if (edges[i] > thresh) { bot = i; break; }
                    }
                    const stackHeight = bot - top;
                    count = Math.round(stackHeight / peakLag);
                } else {
                    // Fallback to simple peak counting if periodicity failed
                    let peaks = 0;
                    const thresh = Math.max(...edges) * 0.2;
                    for (let i = 1; i < edges.length - 1; i++) {
                        if (edges[i] > edges[i - 1] && edges[i] > edges[i + 1] && edges[i] > thresh) {
                            // Enforce min dist
                            peaks++;
                        }
                    }
                    // Edges per chip usually 2 (top/bot) or 3 (stripe)
                    // Conservative estimate
                    count = Math.max(1, Math.round(peaks / 3));
                }

                detected.push({
                    id: idx,
                    count: Math.max(1, count),
                    value: Math.max(1, count) * matchedChip.value,
                    chip: matchedChip
                });

            });

            setResults(detected);
            setProcessing(false);
        };
    }

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
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpened(true)}
                className="h-8 w-8 p-0"
                title="Scan Chips"
            >
                <ScanEye className="h-4 w-4 text-primary" />
            </Button>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={<Text fw={700}>Scan Chip Stacks</Text>}
                centered
                size="lg"
                padding="lg"
            >
                <Stack align="center" gap="lg">
                    {!image ? (
                        <div className="flex flex-col gap-4 w-full">
                            <div className="p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center text-center gap-4 bg-muted/10 h-[300px]">
                                <Layers className="w-12 h-12 text-muted-foreground" />
                                <Text size="sm" c="dimmed">
                                    Take a photo of <b>Vertical Towers</b> of chips.
                                    <br />
                                    Supports multiple towers side-by-side.
                                </Text>
                            </div>

                            <Group grow>
                                <FileButton onChange={handleFileChange} accept="image/*" capture="environment">
                                    {(props) => (
                                        <Button {...props} variant="default" className="h-12">
                                            <Camera className="mr-2 h-4 w-4" />
                                            Take Photo
                                        </Button>
                                    )}
                                </FileButton>

                                <FileButton onChange={handleFileChange} accept="image/*">
                                    {(props) => (
                                        <Button {...props} variant="outline" className="h-12">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload
                                        </Button>
                                    )}
                                </FileButton>
                            </Group>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-6 w-full items-start">
                            {/* Image Preview */}
                            <div className="relative rounded-lg overflow-hidden border shadow-sm w-full md:w-1/2 bg-black/5 flex items-center justify-center">
                                <img src={image} alt="Taken" className="max-h-[400px] w-auto object-contain" />
                                {processing && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                        <Stack align="center" gap="xs">
                                            <RefreshCw className="animate-spin text-white w-8 h-8" />
                                            <Text c="white" size="sm" fw={500}>Analyzing...</Text>
                                        </Stack>
                                    </div>
                                )}
                            </div>

                            {/* Hidden Canvas */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Results Panel */}
                            <div className="w-full md:w-1/2 flex flex-col gap-4 h-full">
                                {warning && (
                                    <Alert variant="light" color="yellow" title="Checking Image Quality" icon={<AlertTriangle className="w-4 h-4" />}>
                                        {warning}
                                    </Alert>
                                )}

                                <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-4 flex-1">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <Text size="sm" c="dimmed" fw={600} tt="uppercase">Detected Stacks</Text>
                                        <Badge variant="light" color="gray">{results.length} found</Badge>
                                    </div>

                                    <ScrollArea.Autosize mah={300} type="scroll">
                                        {results.length === 0 && !processing && (
                                            <div className="py-8 text-center text-muted-foreground italic text-sm">
                                                No distinct chip towers detected.
                                            </div>
                                        )}
                                        <Stack gap="sm">
                                            {results.map((stack) => {
                                                const colorClasses: Record<string, string> = {
                                                    blue: 'bg-blue-600',
                                                    white: 'bg-slate-100 text-slate-900 border-slate-300',
                                                    green: 'bg-green-600',
                                                    black: 'bg-black',
                                                    red: 'bg-red-600',
                                                    yellow: 'bg-yellow-500',
                                                };
                                                const bgClass = colorClasses[stack.chip.color] || 'bg-gray-500';

                                                return (
                                                    <div key={stack.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-transparent hover:border-border transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-[10px] font-bold text-white border-2 border-white/20 ${bgClass}`}>
                                                                {stack.chip.label}
                                                            </div>
                                                            <div className="flex flex-col leading-tight">
                                                                <Text size="sm" fw={600}>{stack.chip.color.charAt(0).toUpperCase() + stack.chip.color.slice(1)}</Text>
                                                                <Text size="xs" c="dimmed">{stack.count} chips</Text>
                                                            </div>
                                                        </div>
                                                        <Text fw={700} size="sm">Rs. {formatIndianNumber(stack.value)}</Text>
                                                    </div>
                                                );
                                            })}
                                        </Stack>
                                    </ScrollArea.Autosize>

                                    <div className="mt-auto pt-4 border-t">
                                        <div className="flex items-end justify-between mb-4">
                                            <Text size="sm" c="dimmed">Total Estimate</Text>
                                            <Text size="xl" fw={800} c="primary">Rs. {formatIndianNumber(totalValue)}</Text>
                                        </div>

                                        <Group grow>
                                            <Button variant="ghost" onClick={reset}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Retake
                                            </Button>
                                            <Button onClick={handleConfirm} disabled={totalValue === 0}>
                                                <Check className="mr-2 h-4 w-4" />
                                                Confirm
                                            </Button>
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
