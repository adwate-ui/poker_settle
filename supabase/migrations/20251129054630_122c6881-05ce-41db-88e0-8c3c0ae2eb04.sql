-- Update can_view_player_in_game_context to only allow game links for players in that specific game
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
      and public.is_valid_game_link(_token, g.id)
  );
$$;