# Supabase Configuration Guide

This guide explains how Supabase is configured in Poker Settle and how to use a custom Supabase instance if needed.

## Overview

Poker Settle uses Supabase as its backend database and authentication provider. By default, the application comes with a pre-configured Supabase instance that works out of the box. However, advanced users can configure their own Supabase instance for additional control and customization.

## Default Configuration

### What's Included

The application includes a default Supabase configuration that:
- Is already set up and ready to use
- Provides authentication (sign up, login, password reset)
- Stores all game data, players, hands, and settlements
- Manages user profiles and preferences
- Is shared among all users of the application
- Is fully managed and maintained

### No Setup Required

For most users, **no Supabase configuration is needed**. The default instance:
- Works immediately after sign up
- Is reliable and maintained
- Has proper security policies (Row Level Security)
- Includes automatic backups
- Is free for personal use

### Default Configuration Details

The default Supabase instance is:
- URL: `https://xfahfllkbutljcowwxpx.supabase.co`
- Configured with Row Level Security (RLS)
- Each user can only access their own data
- Automatically created for all new users

**You don't need to see or configure these values** - they're built into the application.

## Custom Supabase Configuration

### When to Use Custom Configuration

Consider setting up your own Supabase instance if you:
- Want complete control over your data
- Need additional database customizations
- Want to host data in a specific region
- Require custom database functions or triggers
- Need higher rate limits than the default instance provides
- Want to backup and export data independently

### Prerequisites

Before setting up a custom Supabase instance, you need:
- A Supabase account (free tier available)
- Basic understanding of databases and SQL
- Time to set up the schema (15-30 minutes)

## Setting Up Your Own Supabase Instance

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Choose your organization (or create one)
5. Fill in the project details:
   - **Name**: Choose a name (e.g., "Poker Settle")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is sufficient for most use cases
6. Click **"Create New Project"**
7. Wait 2-3 minutes for the project to be provisioned

### Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

⚠️ **Important**: 
- The **anon public** key is safe to use in client-side code
- Never share your **service_role** key (keep it secret!)
- Only use the **anon public** key in Poker Settle

### Step 3: Set Up the Database Schema

You need to recreate the Poker Settle database schema in your instance.

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the migration files in order from the repository:
   - Navigate to `supabase/migrations/` in the Poker Settle repository
   - Run each `.sql` file in chronological order (sorted by filename)
   - Files are named like `20250929035938_xxxxx.sql`

#### Quick Setup Script

You can run all migrations at once using this approach:

1. Clone the Poker Settle repository
2. Navigate to `supabase/migrations/`
3. Copy each migration file's content
4. Paste into Supabase SQL Editor and run in order

Example files to run (in order):
```
20250929035938_fa6e59d6-a0c4-4537-b2fe-27bd85bc5a22.sql  (Initial schema)
20251130043538_cc0fdf2c-40cd-4952-802b-47e5fff0b1e0.sql  (Theme support)
20251201012732_9184be01-a45e-4689-affc-0503905c2647.sql  (Additional features)
... (and all subsequent migrations)
```

### Step 4: Configure Row Level Security (RLS)

The migration files should automatically set up RLS, but verify:

1. Go to **Authentication** > **Policies** in Supabase dashboard
2. Check that each table has policies for:
   - Users can read their own data
   - Users can insert their own data
   - Users can update their own data
   - Users can delete their own data
3. Public tables (like `shared_links`) should have special policies

### Step 5: Enable Authentication

1. Go to **Authentication** > **Settings**
2. Enable **Email Authentication**
3. Configure email templates (optional):
   - Customize confirmation, reset password, and magic link emails
   - Set your app's URL in the redirect URLs
4. Add your site URL to **Allowed redirect URLs**:
   - Add `http://localhost:5173` for local development
   - Add your production URL (e.g., `https://your-domain.com`)

### Step 6: Configure Poker Settle to Use Your Instance

1. Log in to Poker Settle
2. Go to your **Profile** page
3. Navigate to **Settings** or **Advanced** tab (if available)
4. Enter your custom Supabase configuration:
   - **Supabase URL**: Your project URL from Step 2
   - **Supabase Publishable Key**: Your anon public key from Step 2
5. Click **"Save Configuration"**
6. Log out and log back in to use your custom instance

**Note**: Currently, custom Supabase configuration is stored but not yet fully implemented in the UI. This feature is coming in a future update. For now, you can modify the code directly:

In `src/integrations/supabase/client.ts`:
```typescript
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "your-anon-public-key-here";
```

## Data Migration

### Moving from Default to Custom Instance

If you want to move your existing data:

1. Export data from the default instance:
   - Use Supabase dashboard SQL Editor
   - Export tables: `games`, `players`, `poker_hands`, etc.
   - Save as CSV or SQL dump

2. Import into your custom instance:
   - Use SQL Editor to import data
   - Or use CSV import feature in Supabase dashboard
   - Make sure to maintain foreign key relationships

### Backup Your Data

For your custom instance:

1. Go to **Database** > **Backups** in Supabase dashboard
2. Free tier includes daily backups (7 days retention)
3. Pro tier includes point-in-time recovery
4. Export data regularly for additional safety:
   ```sql
   -- Export games
   SELECT * FROM games;
   
   -- Export players
   SELECT * FROM players;
   
   -- Export hands
   SELECT * FROM poker_hands;
   ```

## Security Considerations

### What's Protected

With proper RLS policies:
- Users can only see their own games and data
- Shared links work only with valid tokens
- Authentication is required for all data access
- SQL injection is prevented by Supabase

### Best Practices

1. **Never expose service_role key**: Only use anon public key in the app
2. **Use strong database password**: Mix of letters, numbers, symbols
3. **Enable 2FA on Supabase account**: Protect your Supabase login
4. **Regular backups**: Export important data periodically
5. **Monitor usage**: Check Supabase dashboard for unusual activity

## Troubleshooting

### Authentication Issues

**Problem**: Can't log in after configuring custom instance

**Solutions**:
1. Verify the Supabase URL is correct (no trailing slash)
2. Check that anon public key is copied completely
3. Ensure email authentication is enabled in Supabase
4. Add your app URL to allowed redirect URLs

### Database Errors

**Problem**: "relation does not exist" or similar SQL errors

**Solutions**:
1. Verify all migration files were run in order
2. Check that tables were created: go to **Database** > **Tables**
3. Confirm RLS policies are set up correctly
4. Check SQL Editor for any migration errors

### Data Not Showing

**Problem**: Data doesn't appear after switching to custom instance

**Solutions**:
1. Remember: Custom instance starts empty
2. Data from default instance is not automatically migrated
3. Check that RLS policies allow you to read data
4. Verify you're logged in with the correct account

### Rate Limiting

**Problem**: "Rate limit exceeded" errors

**Solutions**:
1. Free tier limits: 50,000 requests/month
2. Upgrade to Pro tier for higher limits
3. Optimize queries to reduce request count
4. Use caching where appropriate

## Advanced Topics

### Custom Database Functions

Add custom PostgreSQL functions for advanced features:

```sql
-- Example: Custom function to calculate player statistics
CREATE OR REPLACE FUNCTION calculate_player_stats(player_id UUID)
RETURNS TABLE (
  total_games INT,
  total_profit NUMERIC,
  avg_profit_per_game NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT,
    SUM(net_amount),
    AVG(net_amount)
  FROM game_players
  WHERE player_id = $1;
END;
$$ LANGUAGE plpgsql;
```

### Database Triggers

Set up triggers for automatic updates:

```sql
-- Example: Auto-update player statistics
CREATE TRIGGER update_player_stats
AFTER INSERT OR UPDATE ON game_players
FOR EACH ROW
EXECUTE FUNCTION update_player_statistics();
```

### Performance Optimization

For better performance:

1. Add indexes on frequently queried columns:
   ```sql
   CREATE INDEX idx_games_user_id ON games(user_id);
   CREATE INDEX idx_players_user_id ON players(user_id);
   ```

2. Use prepared statements in your queries
3. Enable database query caching
4. Monitor slow queries in Supabase dashboard

## Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Poker Settle Issues**: https://github.com/adwate-ui/poker_settle/issues
- **Migration Files**: See `supabase/migrations/` in repository

## Future Updates

The Poker Settle team is working on:
- UI for easy custom Supabase configuration
- One-click database migration tool
- Automatic schema sync for updates
- Better data import/export tools

Stay tuned for these features in upcoming releases!
