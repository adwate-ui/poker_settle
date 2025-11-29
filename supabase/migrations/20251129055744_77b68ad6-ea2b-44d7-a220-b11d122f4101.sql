-- Update can_view_player_in_game_context to work with any valid link (game or player)
-- This allows showing player names in game views for both link types
create or replace function public.can_view_player_in_game_context(_token text, _player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_players gp
    join public.games g on g.id = gp.game_id
    where gp.player_id = _player_id
      and public.has_any_valid_link(_token, g.user_id)
  );
$$;

-- Update game_players policy to allow viewing for any valid link
drop policy if exists "Public can view game_players with valid share token" on public.game_players;
drop policy if exists "Public can view game_players only for linked player" on public.game_players;

create policy "Public can view game_players with valid share token"
on public.game_players
for select
using (
  exists (
    select 1
    from public.games g
    where g.id = game_players.game_id
      and public.has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        g.user_id
      )
  )
);

-- Update buy_in_history policy to allow viewing for any valid link
drop policy if exists "Public can view buy-in history with valid share token" on public.buy_in_history;

create policy "Public can view buy-in history with valid share token"
on public.buy_in_history
for select
using (
  exists (
    select 1
    from public.game_players gp
    join public.games g on g.id = gp.game_id
    where gp.id = buy_in_history.game_player_id
      and public.has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        g.user_id
      )
  )
);