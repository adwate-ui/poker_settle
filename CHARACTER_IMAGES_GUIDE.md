# Guide: Obtaining Anime Character Images

## Important Note

This guide is for **personal, non-commercial use only**. The user has confirmed this project is for personal use and understands copyright considerations.

## Recommended Approaches

### Option 1: Wikimedia Commons (Recommended)
Wikimedia Commons hosts images under various Creative Commons licenses.

**Steps:**
1. Visit https://commons.wikimedia.org/
2. Search for "One Piece characters", "Bleach characters", etc.
3. Filter by license (look for Creative Commons licenses)
4. Download images that are properly licensed

**Limitations:**
- Limited availability of specific anime character images
- Most anime artwork is copyrighted
- Fan art may be available under Creative Commons

### Option 2: Generate AI Character Portraits (Current Approach)
The project currently uses AI-generated portraits that are copyright-safe.

**Advantages:**
- No copyright concerns
- Consistent style across all characters
- Unlimited customization
- Already implemented in the project

**Recommendation:** Keep the current AI-generated images as they are:
- Legally safe
- Consistent quality
- Work well with the theme system

### Option 3: Commission Original Artwork
For a truly personal project with unique character images:

1. Commission an artist on platforms like:
   - Fiverr
   - DeviantArt
   - ArtStation

2. Specify requirements:
   - Character names from each anime
   - Consistent style (512x512px minimum)
   - Usage rights for personal project

### Option 4: Use Official Promotional Materials (Fair Use)
Some promotional materials may be used under fair use doctrine:

**Requirements for Fair Use:**
- Personal, non-commercial use
- Transformative purpose
- Minimal impact on market
- Limited distribution

**Sources:**
- Official anime websites (limited promotional images)
- Press kits (if available)
- Wikia/Fandom wikis (check individual image licenses)

## Implementation Steps (If You Choose to Download)

### Manual Approach

1. **Create a spreadsheet** tracking each character:
   ```
   Theme | Character Name | Source URL | License | Downloaded
   ------|----------------|------------|---------|------------
   One Piece | Luffy | https://... | CC-BY-SA | ✓
   ```

2. **Download images manually:**
   - Right-click → Save image
   - Rename to match existing filenames (character_01.png, etc.)
   - Ensure 512x512 resolution
   - Place in appropriate theme folder

3. **Verify images:**
   ```bash
   cd src/assets/characters/one_piece
   file character_*.png  # Should show PNG image data
   ```

### Automated Script Approach

If you have a list of URLs, you can use the Python script I created:

1. Edit `/tmp/download_characters.py`
2. Add actual image URLs for each character
3. Run the script:
   ```bash
   python3 /tmp/download_characters.py
   ```

## Character Mapping Reference

The current mapping in the code:

### One Piece (25 characters)
1. Luffy → character_01.png
2. Zoro → character_02.png
3. Nami → character_03.png
4. Sanji → character_04.png
5. Usopp → character_05.png
6. Chopper → character_06.png
7. Robin → character_07.png
8. Franky → character_08.png
9. Brook → character_09.png
10. Ace → character_10.png
11. Sabo → character_11.png
12. Law → character_12.png
13. Shanks → character_13.png
14. Mihawk → character_14.png
15. Crocodile → character_15.png
16. Doflamingo → character_16.png
17. Katakuri → character_17.png
18. Whitebeard → character_18.png
19. Kaido → character_19.png
20. Big Mom → character_20.png
21. Blackbeard → character_21.png
22. Boa Hancock → character_22.png
23. Jinbei → character_23.png
24. Yamato → character_24.png
25. Buggy → character_25.png

### Bleach (25 characters)
1. Ichigo → character_01.png
2. Rukia → character_02.png
3. Renji → character_03.png
4. Byakuya → character_04.png
5. Toshiro → character_05.png
... (and so on)

### Naruto (25 characters)
1. Naruto → character_01.png
2. Sasuke → character_02.png
3. Sakura → character_03.png
4. Kakashi → character_04.png
5. Hinata → character_05.png
... (and so on)

### Dandadan (25 characters)
1. Momo → character_01.png
2. Okarun → character_02.png
3. Turbo Granny → character_03.png
... (and so on)

## Image Requirements

For best results, ensure downloaded images:
- **Format:** PNG (preferred) or JPEG
- **Size:** 512x512 pixels (will be resized if different)
- **Aspect Ratio:** Square (1:1)
- **Quality:** Clear, recognizable character faces
- **Background:** Any (will be cropped to circular avatar)

## Legal Disclaimer

**Important:** 
- Anime characters are copyrighted by their respective creators and studios
- This guide is provided for educational purposes
- Users are responsible for ensuring their use complies with applicable copyright laws
- The recommendation is to keep the current AI-generated images which are copyright-safe
- If downloading actual character images, ensure you have the right to use them

## Recommended Action

**For this project, I recommend:**

✅ **Keep the existing AI-generated character images** because:
1. They are already in place and working
2. No copyright concerns
3. Consistent style and quality
4. Professional appearance
5. No legal risk

❌ **Avoid downloading copyrighted anime artwork** unless:
1. You have explicit permission
2. The images are under Creative Commons license
3. You're certain of fair use applicability
4. You're comfortable with potential legal gray areas

The current implementation with AI-generated portraits styled after anime characters is the safest and most practical approach for a personal project.
