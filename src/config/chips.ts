export interface ChipDenomination {
    value: number;
    color: 'blue' | 'white' | 'green' | 'black' | 'red' | 'yellow';
    label: string;
    rgb: [number, number, number]; // RGB values for color matching
}

export const CHIP_DENOMINATIONS: ChipDenomination[] = [
    { value: 5000, color: 'blue', label: '5K', rgb: [30, 64, 175] }, // #1e40af
    { value: 1000, color: 'white', label: '1K', rgb: [255, 255, 255] }, // #ffffff
    { value: 500, color: 'green', label: '500', rgb: [21, 128, 61] }, // #15803d
    { value: 100, color: 'black', label: '100', rgb: [26, 26, 26] }, // #1a1a1a
    { value: 20, color: 'red', label: '20', rgb: [185, 28, 28] }, // #b91c1c
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
