# Poker Settle (Poker Game Tracker)

Track buy-ins, stacks, settlements and record hands for home poker games with anime-themed customization.

## Features

- 🎮 **Game Management**: Track poker games, buy-ins, and settlements
- 👥 **Player Tracking**: Monitor player statistics and performance
- 🃏 **Hand Recording**: Record and replay poker hands with grouping by game
- 📧 **Email Notifications**: User-configurable email notifications via EmailJS
  - Configure your own EmailJS account from Profile settings
  - Custom email templates and sender address
  - Detailed setup guide included
- 💳 **Payment Integration**: UPI payment links for seamless settlements
  - Automatic payment confirmation via email replies
  - Customizable confirmation keywords
- ⚙️ **Modular Configuration**: All integrations configurable per user
  - Email service settings (EmailJS)
  - Payment confirmation keywords
  - Optional custom Supabase instance
- 📚 **First-Time Tutorial**: Interactive step-by-step guide for new users
  - Automatic on first login
  - Replayable from Profile page
- 🎨 **Anime Themes**: Choose from 5 anime-based themes with unique color schemes and player avatars
  - One Piece (Ocean adventure vibes)
  - Bleach (Soul Society style)
  - Naruto (Hidden Leaf ninja)
  - Dandadan (Supernatural retro)
  - Default (Classic poker)
- 📊 **Statistics**: Detailed analytics for players and games
- 🌙 **Dark Mode**: Full dark mode support
- 📱 **Responsive**: Works on desktop and mobile devices

## Configuration and Setup

### Email Notifications

To enable email notifications for settlements and game updates:

1. Create a free EmailJS account at [emailjs.com](https://www.emailjs.com/)
2. Log in to Poker Settle and go to Profile > Email tab
3. Follow the setup guide to configure your email service
4. See [EMAIL_CONFIGURATION_GUIDE.md](EMAIL_CONFIGURATION_GUIDE.md) for detailed instructions

### Payment Confirmation

Configure automatic payment confirmation:

1. Go to Profile > Payments tab
2. Set up keywords (e.g., PAID, DONE, SETTLED)
3. When players reply to settlement emails with these keywords, payments are auto-confirmed
4. Set up email webhook for automatic processing (see PAYMENT_CONFIRMATION_WEBHOOK.md)

### Custom Supabase Instance (Optional)

For advanced users who want to host their own database:

1. See [SUPABASE_CONFIGURATION_GUIDE.md](SUPABASE_CONFIGURATION_GUIDE.md) for instructions
2. The default Supabase instance works out of the box - custom configuration is optional
3. Useful for data control, custom regions, or additional features

## Getting Started

### First-Time Users

1. Sign up for a Poker Settle account
2. Complete the interactive tutorial (shown automatically on first login)
3. Add players to your database
4. Create your first game
5. (Optional) Configure email notifications from Profile settings

See [TUTORIAL.md](TUTORIAL.md) for a comprehensive guide on using all features.

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
