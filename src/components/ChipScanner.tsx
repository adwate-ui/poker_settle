import { useState, useRef } from 'react';
import { Modal, Group, Text, Stack, FileButton, ScrollArea } from '@mantine/core';
import { Camera, Upload, Check, RefreshCw, ScanEye, Layers } from 'lucide-react';
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

export const ChipScanner = ({ onScanComplete }: ChipScannerProps) => {
    const [opened, setOpened] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<DetectedStack[]>([]);
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

    const findClosestChip = (r: number, g: number, b: number): ChipDenomination => {
        let minDistance = Infinity;
        let closest = chips[0];

        for (const chip of chips) {
            const distance = Math.sqrt(
                Math.pow(chip.rgb[0] - r, 2) +
                Math.pow(chip.rgb[1] - g, 2) +
                Math.pow(chip.rgb[2] - b, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closest = chip;
            }
        }
        return closest;
    };

    const processImage = (imageSrc: string) => {
        setProcessing(true);
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Resize for performance (height 600px, maintain aspect ratio)
            // Increased resolution for better edge detection
            const scale = 600 / img.height;
            const width = Math.floor(img.width * scale);
            const height = 600;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            const frameData = ctx.getImageData(0, 0, width, height);

            // 1. Tower Detection (Horizontal Energy Scan)
            // Calculate "Vertical Gradient Energy" for each column
            const energyProfile = new Float32Array(width);
            let totalEnergy = 0;

            for (let x = 0; x < width; x++) {
                let colEnergy = 0;
                for (let y = 0; y < height - 2; y += 2) { // Skip pixels for speed
                    const i = (y * width + x) * 4;
                    const i_next = ((y + 2) * width + x) * 4;

                    const gray = (frameData.data[i] + frameData.data[i + 1] + frameData.data[i + 2]) / 3;
                    const gray_next = (frameData.data[i_next] + frameData.data[i_next + 1] + frameData.data[i_next + 2]) / 3;

                    const diff = Math.abs(gray - gray_next);
                    if (diff > 10) colEnergy += diff;
                }
                energyProfile[x] = colEnergy;
                totalEnergy += colEnergy;
            }

            const avgEnergy = totalEnergy / width;
            const energyThreshold = avgEnergy * 0.5; // Lower threshold to capture stacks

            // Segment into towers
            const towers: { start: number; end: number }[] = [];
            let currentStart = -1;

            for (let x = 0; x < width; x++) {
                if (energyProfile[x] > energyThreshold) {
                    if (currentStart === -1) currentStart = x;
                } else {
                    if (currentStart !== -1) {
                        if (x - currentStart > 30) { // Min width 30px
                            towers.push({ start: currentStart, end: x });
                        }
                        currentStart = -1;
                    }
                }
            }
            if (currentStart !== -1 && width - currentStart > 30) {
                towers.push({ start: currentStart, end: width });
            }

            // Improved Merge Logic: Only merge if gap is very small (< 15px)
            // This prevents merging distinct stacks
            const mergedTowers: { start: number; end: number }[] = [];
            if (towers.length > 0) {
                let current = towers[0];
                for (let i = 1; i < towers.length; i++) {
                    if (towers[i].start - current.end < 15) {
                        current.end = towers[i].end; // Merge
                    } else {
                        mergedTowers.push(current);
                        current = towers[i];
                    }
                }
                mergedTowers.push(current);
            } else {
                // Fallback
                mergedTowers.push({ start: Math.floor(width * 0.2), end: Math.floor(width * 0.8) });
            }

            const detectedStacks: DetectedStack[] = [];

            // 2. Process Each Tower
            mergedTowers.forEach((tower, idx) => {
                const towerWidth = tower.end - tower.start;
                const centerX = Math.floor(tower.start + towerWidth / 2);

                // A. Color Detection (Sample narrow central strip 20%)
                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                const sampleStart = Math.floor(tower.start + towerWidth * 0.4);
                const sampleEnd = Math.floor(tower.end - towerWidth * 0.4);

                for (let y = 0; y < height; y += 4) {
                    for (let x = sampleStart; x < sampleEnd; x += 2) {
                        const i = (y * width + x) * 4;
                        rSum += frameData.data[i];
                        gSum += frameData.data[i + 1];
                        bSum += frameData.data[i + 2];
                        count++;
                    }
                }

                const closestChip = findClosestChip(rSum / count, gSum / count, bSum / count);

                // B. Stripe Detection (Scanline at centerX) using Median Edge Distance
                const gradients = [];
                for (let y = 2; y < height - 2; y++) {
                    const i_prev = ((y - 1) * width + centerX) * 4;
                    const i_next = ((y + 1) * width + centerX) * 4;
                    const gray_prev = (frameData.data[i_prev] + frameData.data[i_prev + 1] + frameData.data[i_prev + 2]) / 3;
                    const gray_next = (frameData.data[i_next] + frameData.data[i_next + 1] + frameData.data[i_next + 2]) / 3;

                    const grad = Math.abs(gray_next - gray_prev);
                    if (grad > 15) gradients.push({ y, strength: grad });
                }

                // Find peaks
                const peaks: number[] = [];
                for (let i = 1; i < gradients.length - 1; i++) {
                    if (gradients[i].strength > gradients[i - 1].strength && gradients[i].strength > gradients[i + 1].strength) {
                        if (peaks.length === 0 || (gradients[i].y - peaks[peaks.length - 1] > 3)) {
                            peaks.push(gradients[i].y);
                        }
                    }
                }

                // Calculate chip thickness (median distance between edges)
                const distances: number[] = [];
                for (let i = 1; i < peaks.length; i++) {
                    distances.push(peaks[i] - peaks[i - 1]);
                }
                distances.sort((a, b) => a - b);

                let estimatedChips = 0;
                let medianThickness = 0;

                if (distances.length > 0) {
                    medianThickness = distances[Math.floor(distances.length / 2)];
                    // Valid chip thickness range check (5px - 50px)
                    if (medianThickness > 5 && medianThickness < 50) {
                        const stackHeight = peaks[peaks.length - 1] - peaks[0];
                        estimatedChips = Math.round(stackHeight / medianThickness);
                    }
                }

                // Fallback if structure not clear
                if (estimatedChips === 0) {
                    estimatedChips = Math.max(1, Math.round(peaks.length / 2));
                }

                detectedStacks.push({
                    id: idx,
                    count: Math.max(1, estimatedChips),
                    value: Math.max(1, estimatedChips) * closestChip.value,
                    chip: closestChip
                });
            });

            setResults(detectedStacks);
            setProcessing(false);
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
                                            <Text c="white" size="sm" fw={500}>Analyzing Towers...</Text>
                                        </Stack>
                                    </div>
                                )}
                            </div>

                            {/* Hidden Canvas */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Results Panel */}
                            <div className="w-full md:w-1/2 flex flex-col gap-4 h-full">
                                <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-4 flex-1">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <Text size="sm" c="dimmed" fw={600} tt="uppercase">Detected Stacks</Text>
                                        <Text size="xs" c="dimmed">{results.length} found</Text>
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
