ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chip_denominations jsonb DEFAULT '[
    {"value": 5000, "color": "blue", "label": "5K", "rgb": [30, 64, 175]},
    {"value": 1000, "color": "white", "label": "1K", "rgb": [255, 255, 255]},
    {"value": 500, "color": "green", "label": "500", "rgb": [21, 128, 61]},
    {"value": 100, "color": "black", "label": "100", "rgb": [26, 26, 26]},
    {"value": 20, "color": "red", "label": "20", "rgb": [185, 28, 28]}
]'::jsonb;
