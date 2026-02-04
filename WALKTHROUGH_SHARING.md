# Sharing System Refactor Walkthrough

I have completed the refactoring of the sharing system to implement "Owner-Centric" data access with strict "Resource-Scoped" UI permissions.

## Changes Overview

### 1. Database Security (Owner-Centric Access)
- Created migration `supabase/migrations/20260204120000_owner_centric_access.sql`.
- Defined RPC `get_shared_link_owner` to securely retrieve the owner ID from a token.
- **Revoked** old RLS policies that allowed "Public" access.
- **Implemented** new RLS policies for `games`, `players`, `game_players`, `buy_in_history`, and `table_positions`.
  - Policies now check: `user_id = auth.uid()` OR `user_id = get_shared_link_owner(token)`.
  - This ensures users (authenticated or via token) can only see data belonging to the owner.

### 2. Shared Context & Client Injection
- Created `src/contexts/SharedContext.tsx`.
  - Validates token via `get_shared_link_owner`.
  - Determines scope (`game` or `player`).
  - Creates a `SupabaseClient` instance with the `x-share-token` header.
- Updated `gameApi.ts` and `playerApi.ts` to accept an optional `SupabaseClient`.
- Updated `useGames` and `usePlayers` hooks to use the injected client.

### 3. Adaptive UI (Resource-Scoped)
- **Refactored `GamesHistory.tsx`**:
  - Now uses `useGames` hook (reactive updates).
  - Accepts `userId`, `client`, `readOnly`, and `disablePlayerLinks` props.
  - Hides "Delete" buttons and "new session" prompts in read-only mode.
- **Refactored `PlayerDetail.tsx`**:
  - Accepts `userId`, `client`, and `readOnly` props.
  - Uses injected client for fetching data.
  - Hides "Edit" and "Share" actions in read-only mode.
- **Created `SharedLayout.tsx`**:
  - Replaces `SharedView.tsx`.
  - Wraps content in `SharedProvider`.
  - Implements the tabbed logic:
    - **Game Token**: Renders `GamesHistory` (read-only, no player links).
    - **Player Token**: Renders Tabs (`Game History` / `Player Details`).
- **Refactored `SharedGameDetail.tsx` & `SharedPlayerDetail.tsx`**:
  - Wrapped in `SharedProvider`.
  - Uses `useSharedContext` to access the valid client.

### 4. Logic Fixes (Heads-Up Poker)
- **Updated `src/utils/pokerPositions.ts`**:
  - `getSmallBlindPlayer`: Returns Button for 2-player games.
  - `getBigBlindPlayer`: Returns non-Button for 2-player games.
- **Updated `src/utils/handStateMachine.ts`**:
  - `getStartingPlayerIndex`: Returns Button for 2-player preflop.
  - `isBettingRoundComplete`: Validates SB/BB actions using correct Heads-Up indices.

## Verification Steps

### Automated Verification
Run the following checks (if environment allows):
1. **Lint Check**: Ensure no type errors in new files.
   ```bash
   npm run lint
   ```
   *(Note: Some type errors related to generated Supabase types for the new RPC might persist until types are regenerated).*

### Manual Verification
1. **Valid Game Token**:
   - Access `/shared/<GAME_TOKEN>`.
   - Verify `SharedLayout` loads.
   - Verify only **GamesHistory** is shown (no tabs).
   - Verify games list loads correctly.
   - Verify Player Names are visible but NOT clickable (or link is disabled).
   - Click a game -> verify navigation to `/shared/<TOKEN>/game/<ID>` and details load.

2. **Valid Player Token**:
   - Access `/shared/<PLAYER_TOKEN>`.
   - Verify `SharedLayout` loads.
   - Verify **Tabs** are present (Games / Player Details).
   - **Games Tab**: Verify games list loads.
   - **Player Details Tab**: Verify specific player details load.
   - Verify "Edit" button is hidden.

3. **Invalid Token**:
   - Access `/shared/INVALID_TOKEN`.
   - Verify "Invalid share link" alert is shown.

4. **Owner Access**:
   - Login as owner.
   - Verify normal Dashboard and History views still work (RLS `auth.uid() = user_id` check).

5. **Heads-Up Logic**:
   - Start a game with 2 players.
   - Verify Button player is Small Blind.
   - Verify Button player acts first Preflop.
   - Verify Betting Round completes correctly.

## Files Modified
- `supabase/migrations/20260204120000_owner_centric_access.sql`
- `src/features/game/api/gameApi.ts`
- `src/features/players/api/playerApi.ts`
- `src/features/game/hooks/useGames.ts`
- `src/features/players/hooks/usePlayers.ts`
- `src/contexts/SharedContext.tsx`
- `src/pages/GamesHistory.tsx`
- `src/pages/PlayerDetail.tsx`
- `src/pages/SharedLayout.tsx`
- `src/pages/SharedGameDetail.tsx`
- `src/pages/SharedPlayerDetail.tsx`
- `src/App.tsx`
- `src/pages/SharedView.tsx` (Deleted/Replaced)
- `src/utils/pokerPositions.ts`
- `src/utils/handStateMachine.ts`
