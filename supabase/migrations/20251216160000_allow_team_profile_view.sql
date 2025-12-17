-- Allow users to view profiles of people in the same team
-- This is needed so team members can see the Name/Email of the Team Owner and other members.

-- Helper function to check if auth user shares a team with target user
create or replace function public.shares_team_with(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.team_members tm1
    join public.team_members tm2 on tm1.team_id = tm2.team_id
    where tm1.user_id = auth.uid()
    and tm2.user_id = target_user_id
  );
end;
$$;

create policy "Users can view profile of team members" on public.profiles for
select using (public.shares_team_with (id));