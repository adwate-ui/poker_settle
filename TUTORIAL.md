# Poker Settle - Complete Tutorial

Welcome to Poker Settle! This comprehensive tutorial will guide you through all features of the application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Players](#managing-players)
3. [Creating and Running Games](#creating-and-running-games)
4. [Recording Poker Hands](#recording-poker-hands)
5. [Settlements and Notifications](#settlements-and-notifications)
6. [Configuration and Settings](#configuration-and-settings)
7. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### First Time Setup

When you first log in to Poker Settle, you'll see an interactive tutorial that walks you through the basics. You can:
- Skip the tutorial if you're already familiar with the app
- Replay the tutorial anytime from your Profile page

### Navigation

The main navigation has three tabs:
- **Games**: View and manage your poker games
- **Players**: Manage your player database
- **Hands**: View hand history and statistics

### Your Profile

Access your profile by clicking your avatar in the top right corner. Here you can:
- View your account information
- Configure email notifications
- Set up payment confirmation keywords
- Choose your anime theme
- Manage storage and cache
- Replay the tutorial

## Managing Players

### Adding a New Player

1. Go to the **Players** tab
2. Click the **"+ Add Player"** button
3. Fill in the player information:
   - **Name**: Player's name (required)
   - **Email**: For sending notifications (optional but recommended)
   - **UPI ID**: For payment links (optional)
   - **Payment Preference**: UPI or Cash

4. Click **"Create Player"**

### Why Add Email and UPI?

- **Email**: Enables automatic settlement notifications
- **UPI ID**: Generates clickable payment links in emails
- **Payment Preference**: Helps organize settlements

### Viewing Player Statistics

Click on any player card to view:
- Total games played
- Overall profit/loss
- Game history
- Detailed performance metrics
- Hand history (if hands were recorded)

### Editing Players

1. Open the player detail view
2. Click the **"Edit Player"** button
3. Update information as needed
4. Save changes

## Creating and Running Games

### Creating a New Game

1. Go to the **Games** tab
2. Click **"New Game"**
3. Set game parameters:
   - **Date**: When the game took place (defaults to today)
   - **Buy-in Amount**: Initial buy-in per player (e.g., 1000)
   - **Small Blind**: Optional (e.g., 5)
   - **Big Blind**: Optional (e.g., 10)

4. Add players:
   - Search for players by name
   - Click **"Add to Game"** for each player
   - Set initial buy-ins (defaults to the game buy-in)

5. Click **"Create Game"**

### During the Game

#### Adding Buy-ins

As players buy in for more chips:

1. Open the game details
2. Click on the player who's buying in
3. Enter the additional buy-in amount
4. Click **"Add Buy-in"**

The system tracks:
- Total buy-ins per player
- History of all buy-ins with timestamps
- Running total for each player

#### Recording Final Stacks

When the game ends:

1. Open the game details
2. For each player, enter their **Final Stack**
3. The system automatically calculates:
   - Net profit/loss per player
   - Who owes whom
   - Optimal settlement arrangements

### Completing a Game

1. Ensure all final stacks are entered
2. Review the **Settlements** section
3. The app suggests optimal settlements to minimize transactions
4. Click **"Mark Game as Complete"**

## Recording Poker Hands

### Why Record Hands?

Recording hands helps you:
- Review interesting or difficult decisions
- Analyze your play over time
- Learn from mistakes
- Track performance by position, hand type, etc.

### Recording a Hand

1. Open a game's detail view
2. Go to the **"Hands"** tab
3. Click **"Record Hand"**

#### Basic Hand Information

1. **Hand Number**: Sequential number (auto-increments)
2. **Button Position**: Select the player on the button
3. **Pot Size**: Final pot size
4. **Final Stage**: How far the hand went
   - Preflop
   - Flop
   - Turn
   - River
   - Showdown

#### Player Actions

For each street (Preflop, Flop, Turn, River):

1. Add actions in sequence:
   - **Player**: Who acted
   - **Action**: Check, Call, Raise, Fold, All-In, Blinds
   - **Bet Size**: Amount (if applicable)
   - **Position**: Player's position (e.g., BTN, BB, CO)
   - **Hole Cards**: If known (especially for showdowns)

2. Mark yourself as **Hero** to track your hands specifically

#### Community Cards

Add community cards for each street:
- **Flop**: 3 cards (e.g., "Ah Kd 7s")
- **Turn**: 1 card (e.g., "Qc")
- **River**: 1 card (e.g., "2h")

Use card notation:
- Ranks: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
- Suits: h (hearts), d (diamonds), c (clubs), s (spades)
- Example: "As Kh" = Ace of spades, King of hearts

### Viewing Hand History

#### Filters

In the **Hands** tab, filter by:
- **Hero Position**: Your position in the hand
- **Game**: Specific game
- **Result**: Win, Loss, or Split
- **Showdown**: Whether hand went to showdown
- **Final Stage**: How far the hand progressed
- **Villain**: Specific opponent
- **Hole Cards**: Type of starting hand

#### Hand Grouping

Hands are automatically grouped by game, showing:
- Game date and buy-in
- Number of hands per game
- All hands from that game together

#### Hand Details

Click any hand to view:
- Complete action sequence
- All community cards
- Winner(s) and pot distribution
- Hand strength at showdown
- Position information

### Hand Statistics

The Hand History page shows:
- **Total Hands**: Number of hands recorded
- **Win Rate**: Percentage of hands won
- **Total Won**: Amount won across all hands
- **Showdown Rate**: How often you see showdown

## Settlements and Notifications

### Understanding Settlements

After a game, some players profit and others lose. The settlement system:
- Calculates who owes whom
- Minimizes the number of transactions
- Generates payment links

### Viewing Settlements

1. Open a completed game
2. Go to the **"Settlements"** tab
3. See suggested settlements:
   - From: Player who owes
   - To: Player who should receive
   - Amount: How much to pay

### Sending Notifications

To notify players about settlements:

1. Ensure email configuration is set up (see [Email Configuration](#email-configuration))
2. In the Settlements tab, click **"Send Notifications"**
3. The system sends emails to all players with:
   - Amount they owe or should receive
   - UPI payment link (if UPI ID is configured)
   - Game summary

### Payment Confirmation

When players pay:

#### Automatic Confirmation

If you've set up payment keywords:
1. Player receives settlement email
2. Player makes payment
3. Player replies to email with "PAID" or other keyword
4. System automatically marks settlement as confirmed

#### Manual Confirmation

1. Go to game settlements
2. Find the settlement to confirm
3. Click **"Mark as Confirmed"**

## Configuration and Settings

### Email Configuration

Configure email notifications to automatically send settlement information to players.

#### Prerequisites

- EmailJS account (free tier: 100 emails/month)
- Gmail account (or other email provider)

#### Setup Steps

1. Go to **Profile** > **Email** tab
2. Follow the setup guide to get:
   - Service ID from EmailJS
   - Template ID from EmailJS
   - Public Key from EmailJS
3. Enter your email address and display name
4. Save configuration

For detailed instructions, see [EMAIL_CONFIGURATION_GUIDE.md](EMAIL_CONFIGURATION_GUIDE.md)

### Payment Keywords

Configure keywords that trigger automatic payment confirmation:

1. Go to **Profile** > **Payments** tab
2. Add keywords (e.g., PAID, DONE, SETTLED)
3. Keywords are case-insensitive
4. Save configuration

When players reply to settlement emails with these keywords, payments are auto-confirmed.

### Theme Selection

Choose from 5 anime-inspired themes:

1. Go to **Profile** > **Theme** tab
2. Select a theme:
   - **Default**: Classic poker theme
   - **One Piece**: Ocean adventure vibes
   - **Bleach**: Soul Society style
   - **Naruto**: Hidden Leaf ninja
   - **Dandadan**: Supernatural retro

Each theme includes:
- Unique color scheme
- 25 character avatars
- Automatic player avatar assignment
- Dark/light mode support

### Storage Management

Manage app storage and cache:

1. Go to **Profile** > **Storage** tab
2. View storage usage
3. Clear cache if needed
4. Optimize performance

## Tips and Best Practices

### Game Organization

- **Use consistent buy-in amounts** for easier tracking
- **Record final stacks immediately** after game ends
- **Double-check totals** before sending notifications
- **Save games regularly** during play

### Player Management

- **Add emails for all regular players** to enable notifications
- **Update UPI IDs** when players change payment methods
- **Use consistent naming** to avoid duplicate players
- **Archive inactive players** (feature coming soon)

### Hand Recording

- **Record hands immediately** while fresh in memory
- **Use consistent notation** for cards
- **Add notes** for interesting spots (coming soon)
- **Record position accurately** for better analysis
- **Track villain tendencies** in hand history

### Settlements

- **Review calculations** before sending notifications
- **Use UPI links** for faster payments
- **Follow up** on unconfirmed payments
- **Keep records** of all settlements

### Email Notifications

- **Test email config** with a test game first
- **Check spam folders** if emails don't arrive
- **Use clear subject lines** in notifications
- **Include payment instructions** in custom messages

### Performance

- **Clear cache** periodically for better performance
- **Use Wi-Fi** when possible for faster sync
- **Update regularly** to get latest features
- **Backup important data** (export feature coming soon)

### Mobile Usage

- **Install as PWA** for app-like experience
- **Use landscape mode** for hand recording
- **Enable notifications** for updates
- **Bookmark frequently used pages**

### Privacy and Security

- **Use strong passwords** for your account
- **Don't share account credentials**
- **Review shared links** regularly
- **Limit email configuration access**

## Keyboard Shortcuts (Coming Soon)

Future versions will include keyboard shortcuts for:
- Quick navigation between tabs
- Fast player/game search
- Rapid hand recording
- Settlement review

## Getting Help

### In-App Help

- Click **Help** button on any page
- View tooltips by hovering over icons
- Replay tutorial from Profile page

### Documentation

- [EMAIL_CONFIGURATION_GUIDE.md](EMAIL_CONFIGURATION_GUIDE.md)
- [SUPABASE_CONFIGURATION_GUIDE.md](SUPABASE_CONFIGURATION_GUIDE.md)
- [README.md](README.md)

### Community

- Report issues: [GitHub Issues](https://github.com/adwate-ui/poker_settle/issues)
- Feature requests: Open a GitHub issue
- Discussions: GitHub Discussions (coming soon)

## Frequently Asked Questions

### Can I use this for tournament poker?

Currently, Poker Settle is optimized for cash games. Tournament support is planned for a future release.

### How many players can I add?

You can add unlimited players to your database. Each game supports up to 25 players (based on theme character limits).

### Is my data private?

Yes! With Row Level Security in Supabase, you can only see your own data. Other users cannot access your games, players, or hands.

### Can I export my data?

Data export feature is coming in a future update. Currently, you can view all data through the app.

### Does this work offline?

The app caches data for better performance, but requires an internet connection for initial loading and saving changes. Full offline support is planned.

### Can I customize email templates?

Yes! In your EmailJS account, you can fully customize the email template used for notifications.

### How do I delete a game or player?

Delete functionality is coming soon. For now, contact support if you need data removed.

### Can multiple people manage the same games?

Currently, each user manages their own games independently. Multi-user game management is planned for future releases.

## What's Next?

Upcoming features:
- Data export/import
- Tournament support
- Advanced statistics and charts
- Player performance trends
- Hand strength calculator
- Range analysis tools
- Multi-user game management
- Mobile app (iOS/Android)

---

**Happy tracking!** 🎮🃏

For more help, visit your Profile page and click "Start Tutorial" to see an interactive walkthrough.
