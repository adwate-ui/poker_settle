export interface ChipDenomination {
    value: number;
    color: 'blue' | 'white' | 'green' | 'black' | 'red' | 'yellow';
    label: string;
    rgb: [number, number, number]; // RGB values for color matching
}

export const CHIP_DENOMINATIONS: ChipDenomination[] = [
    { value: 5000, color: 'blue', label: '5K', rgb: [29, 78, 216] }, // blue-700
    { value: 1000, color: 'yellow', label: '1K', rgb: [161, 98, 7] }, // yellow-700
    { value: 500, color: 'green', label: '500', rgb: [21, 128, 61] }, // green-700
    { value: 100, color: 'black', label: '100', rgb: [24, 24, 27] }, // zinc-900
    { value: 20, color: 'red', label: '20', rgb: [185, 28, 28] }, // red-700
    { value: 10, color: 'white', label: '10', rgb: [245, 245, 245] }, // neutral-100
];

// Helper to find closest chip color
export const findClosestChip = (r: number, g: number, b: number): ChipDenomination => {
    let minDistance = Infinity;
    let closest = CHIP_DENOMINATIONS[0];

    for (const chip of CHIP_DENOMINATIONS) {
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
