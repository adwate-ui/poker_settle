-- Create helper function to check if player is visible in game context
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

-- Drop the existing public view policy
drop policy if exists "Public can view players with valid share token" on public.players;

-- Create updated policy that allows viewing players in game context
create policy "Public can view players with valid share token"
on public.players
for select
using (
  public.can_view_player(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
  or
  public.can_view_player_in_game_context(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);