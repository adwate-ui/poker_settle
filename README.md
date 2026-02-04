# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0134d31a-2890-48d1-aa51-c00458b3a10b

# Poker Settle (Poker Game Tracker)

Track buy-ins, stacks, settlements and record hands for home poker games.

## Local development

Requirements: Node.js and npm.

```bash
git clone <YOUR_GIT_URL>
cd poker-settle
npm install
npm run dev
```

## Build

```bash
# Poker Settle (Poker Game Tracker)

Track buy-ins, stacks, settlements and record hands for home poker games with anime-themed customization.

## Features

- 🎮 **Game Management**: Track poker games, buy-ins, and settlements
- 👥 **Player Tracking**: Monitor player statistics and performance
- 🃏 **Hand Recording**: Record and replay poker hands
- 📧 **Email Notifications**: Automatic game reports and settlement notifications via email
- 💳 **Payment Integration**: UPI payment links for seamless settlements
- 🎨 **Anime Themes**: Choose from 5 anime-based themes with unique color schemes and player avatars
  - One Piece (Ocean adventure vibes)
  - Bleach (Soul Society style)
  - Naruto (Hidden Leaf ninja)
  - Dandadan (Supernatural retro)
  - Default (Classic poker)
- 📊 **Statistics**: Detailed analytics for players and games
- 🌙 **Dark Mode**: Full dark mode support
- 📱 **Responsive**: Works on desktop and mobile devices

## Anime Theme System

Each theme includes:
- **Unique Color Scheme**: Custom colors for light and dark modes
- **25 Character Avatars**: Each player gets a unique character avatar
- **Automatic Assignment**: Characters are automatically assigned to players based on their name
- **No Repetition**: Up to 25 players per theme with unique characters

See [THEMES.md](THEMES.md) for detailed theme documentation.

## Local development

Requirements: Node.js and npm.

```bash
git clone <YOUR_GIT_URL>
cd poker-settle
npm install
```

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:

**Supabase Configuration:**
- Get your Supabase URL and key from: https://app.supabase.com/project/_/settings/api
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your public anon key
- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID

**EmailJS Configuration (Optional):**
- Sign up at: https://www.emailjs.com/
- Configure email service for game notifications
- Update `VITE_EMAILJS_*` variables with your credentials

3. Start the development server:
```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Cloudflare Pages

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`

After configuring those values in Cloudflare Pages, connect a GitHub repo and deploy.

If you need me to push these changes (commit + push), tell me and I'll do it.
