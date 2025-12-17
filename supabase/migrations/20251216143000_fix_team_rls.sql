-- Fix RLS Infinite Recursion

-- First, drop the problematic policies and any we are about to create (for idempotency)
drop policy if exists "Users can view teams they belong to" on public.teams;

drop policy if exists "Users can view members of their teams" on public.team_members;

drop policy if exists "Owners can add team members" on public.team_members;

drop policy if exists "Owners can remove team members" on public.team_members;

-- Helper function to check team ownership without triggering RLS recursion
create or replace function public.is_team_owner(team_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.teams
    where id = team_id
    and owner_id = auth.uid()
  );
end;
$$;

-- Helper function to check team membership without triggering RLS recursion
create or replace function public.is_team_member(team_uuid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.team_members
    where team_id = team_uuid
    and user_id = auth.uid()
  );
end;
$$;

-- 1. Policies for TEAMS
create policy "Users can view teams they belong to" on public.teams for
select using (
        auth.uid () = owner_id
        or public.is_team_member (id)
    );

-- 2. Policies for TEAM_MEMBERS
create policy "Users can view members of their teams" on public.team_members for
select using (
        auth.uid () = user_id
        OR public.is_team_member (team_id)
    );

-- 3. INSERT Policies (Create Team)
-- Use the SECURITY DEFINER function to break the loop
create policy "Owners can add team members" on public.team_members for
insert
with
    check (
        public.is_team_owner (team_id)
    );

-- 4. DELETE Policies
-- Use the SECURITY DEFINER function to break the loop
create policy "Owners can remove team members" on public.team_members for delete using (
    public.is_team_owner (team_id)
);