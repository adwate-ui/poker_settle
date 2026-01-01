import { useState, useRef, useEffect } from 'react';
import { Modal, Button as MantineButton, Group, Text, Stack, FileButton, Image, ActionIcon } from '@mantine/core';
import { Camera, Upload, Check, RefreshCw, X, ScanEye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { findClosestChip, ChipDenomination } from '@/config/chips';
import { formatIndianNumber } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ChipScannerProps {
    onScanComplete: (value: number) => void;
}

export const ChipScanner = ({ onScanComplete }: ChipScannerProps) => {
    const [opened, setOpened] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<{ count: number; value: number; chip: ChipDenomination } | null>(null);
    const fileInputRef = useRef<HTMLButtonElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMobile = useIsMobile();

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

            // Resize for performance (height 500px, maintain aspect ratio)
            const scale = 500 / img.height;
            const width = img.width * scale;
            const height = 500;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            const frameData = ctx.getImageData(0, 0, width, height);

            // 1. Color Detection (Sample center column)
            // We assume the chips are stacked vertically in the center
            // Sample a region in the middle
            const centerX = Math.floor(width / 2);
            const sampleWidth = 20;
            const sampleHeight = height; // Sample full height

            let rSum = 0, gSum = 0, bSum = 0, count = 0;

            // Sample colors from the center strip
            for (let y = 0; y < height; y += 5) {
                for (let x = centerX - 10; x < centerX + 10; x++) {
                    const i = (y * width + x) * 4;
                    rSum += frameData.data[i];
                    gSum += frameData.data[i + 1];
                    bSum += frameData.data[i + 2];
                    count++;
                }
            }

            const avgR = rSum / count;
            const avgG = gSum / count;
            const avgB = bSum / count;

            const closestChip = findClosestChip(avgR, avgG, avgB);

            // 2. Stripe Detection (Scanline down the center)
            // Convert center strip to grayscale and look for high contrast edges
            let edges = 0;
            let previousGray = -1;
            const threshold = 30; // Contrast threshold

            // Use Canny-like logic: straightforward vertical scan for intensity changes
            // We are looking for the dark/light pattern of stacked chips
            // The edge of a chip usually has a highlight or shadow

            // Smoothing/Blurring slightly might help reduce noise, but simple scan first

            const scanX = centerX;
            let crossings = 0;

            for (let y = 0; y < height; y++) {
                const i = (y * width + scanX) * 4;
                // Grayscale conversion
                const gray = 0.299 * frameData.data[i] + 0.587 * frameData.data[i + 1] + 0.114 * frameData.data[i + 2];

                if (previousGray !== -1) {
                    const diff = Math.abs(gray - previousGray);
                    if (diff > threshold) {
                        crossings++;
                        // Skip a few pixels to avoid multiple triggers on the same edge (thickness of edge)
                        y += 2;
                    }
                }
                previousGray = gray;
            }

            // Logic: Total Chips = Detected Stripes / Spots-Per-Chip
            // A chip usually has 1 main edge if viewed perfectly side-on, 
            // but patterns ("stripes") might add more.
            // User Logic: "Total Chips = Detected Stripes / Spots-Per-Chip. Use 3 spots-per-chip"

            // Canny Edge detection would actually give us binary edges. 
            // The "crossings" above approximates finding high gradient points.
            // Let's refine this to be more like "peaks" in gradient.

            // Re-implementing a simple peak detector on the vertical gradient
            const gradients = [];
            for (let y = 1; y < height - 1; y++) {
                const i_prev = ((y - 1) * width + scanX) * 4;
                const i_next = ((y + 1) * width + scanX) * 4;
                const gray_prev = 0.299 * frameData.data[i_prev] + 0.587 * frameData.data[i_prev + 1] + 0.114 * frameData.data[i_prev + 2];
                const gray_next = 0.299 * frameData.data[i_next] + 0.587 * frameData.data[i_next + 1] + 0.114 * frameData.data[i_next + 2];
                gradients.push(Math.abs(gray_next - gray_prev));
            }

            // Count peaks in gradient > threshold
            let stripes = 0;
            for (let j = 1; j < gradients.length - 1; j++) {
                if (gradients[j] > threshold && gradients[j] > gradients[j - 1] && gradients[j] > gradients[j + 1]) {
                    stripes++;
                    // Enforce min distance between stripes (min chip thickness in px approx)
                    j += 3;
                }
            }

            const spotsPerChip = 3;
            // User said "Detected Stripes / Spots-Per-Chip".
            // Let's ensure we don't get 0.
            const estimatedChips = Math.max(1, Math.round(stripes / spotsPerChip));

            setResult({
                count: estimatedChips,
                value: estimatedChips * closestChip.value,
                chip: closestChip
            });
            setProcessing(false);
        };
    };

    const handleConfirm = () => {
        if (result) {
            onScanComplete(result.value);
            setOpened(false);
            reset();
        }
    };

    const reset = () => {
        setImage(null);
        setResult(null);
    };

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
                title={<Text fw={700}>Scan Chip Stack</Text>}
                centered
                size="md"
                padding="lg"
            >
                <Stack align="center" gap="lg">
                    {!image ? (
                        <div className="flex flex-col gap-4 w-full">
                            <div className="p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center text-center gap-4 bg-muted/10">
                                <ScanEye className="w-12 h-12 text-muted-foreground" />
                                <Text size="sm" c="dimmed">
                                    Take a clear photo of a <b>Vertical Stack</b> of chips.
                                    <br />
                                    Ensure good lighting and a plain background.
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
                        <div className="relative w-full flex flex-col items-center gap-4">
                            <div className="relative rounded-lg overflow-hidden border shadow-sm max-h-[300px] w-auto">
                                <img src={image} alt="Taken" className="max-h-[300px] w-auto object-contain" />
                                {processing && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                        <Stack align="center" gap="xs">
                                            <RefreshCw className="animate-spin text-white w-8 h-8" />
                                            <Text c="white" size="sm" fw={500}>Processing Stack...</Text>
                                        </Stack>
                                    </div>
                                )}
                            </div>

                            {/* Hidden Canvas for Processing */}
                            <canvas ref={canvasRef} className="hidden" />

                            {result && !processing && (
                                <div className="w-full bg-card border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <Text size="sm" c="dimmed" fw={600} tt="uppercase">Detection Result</Text>
                                        <div className={`px-2 py-0.5 rounded text-xs font-bold text-white bg-${result.chip.color}-600 capitalize`}>
                                            {result.chip.color} Chips
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <Text size="xs" c="dimmed">Estimated Count</Text>
                                            <Text size="xl" fw={800} className="leading-none">{result.count} <span className="text-sm font-normal text-muted-foreground">chips</span></Text>
                                        </div>
                                        <div className="text-right">
                                            <Text size="xs" c="dimmed">Total Value</Text>
                                            <Text size="xl" fw={800} c="primary" className="leading-none">Rs. {formatIndianNumber(result.value)}</Text>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t flex gap-2">
                                        <Button variant="ghost" className="flex-1" onClick={reset}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Retake
                                        </Button>
                                        <Button className="flex-1" onClick={handleConfirm}>
                                            <Check className="mr-2 h-4 w-4" />
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Stack>
            </Modal>
        </>
    );
};
