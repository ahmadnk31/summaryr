-- Create teams table
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create team_members table
create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) not null default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, user_id)
);

-- Create team_invites table
create table public.team_invites (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  email text not null,
  token uuid default gen_random_uuid() not null,
  status text check (status in ('pending', 'accepted')) not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.teams enable row level security;

alter table public.team_members enable row level security;

alter table public.team_invites enable row level security;

-- Policies for teams
create policy "Users can view teams they belong to" on public.teams for
select using (
        auth.uid () = owner_id
        or exists (
            select 1
            from public.team_members
            where
                team_id = public.teams.id
                and user_id = auth.uid ()
        )
    );

create policy "Users can create teams" on public.teams for
insert
with
    check (auth.uid () = owner_id);

create policy "Owners can update their teams" on public.teams for
update using (auth.uid () = owner_id);

-- Policies for team_members
create policy "Users can view members of their teams" on public.team_members for
select using (
        exists (
            select 1
            from public.team_members tm
            where
                tm.team_id = public.team_members.team_id
                and tm.user_id = auth.uid ()
        )
        or exists (
            select 1
            from public.teams t
            where
                t.id = public.team_members.team_id
                and t.owner_id = auth.uid ()
        )
    );

-- Policies for team_invites
create policy "Users can view invites for their teams" on public.team_invites for
select using (
        exists (
            select 1
            from public.teams t
            where
                t.id = public.team_invites.team_id
                and t.owner_id = auth.uid ()
        )
    );

create policy "Owners can create invites" on public.team_invites for
insert
with
    check (
        exists (
            select 1
            from public.teams t
            where
                t.id = team_id
                and t.owner_id = auth.uid ()
        )
    );

-- API Function to get effective plan tier
-- This function checks if the user has a direct subscription OR inherits one from a team
create or replace function public.get_user_plan_tier(user_uuid uuid)
returns text
language plpgsql
security definer
as $$
declare
  direct_plan text;
  team_plan text;
begin
  -- Check direct plan
  select plan_tier into direct_plan
  from public.profiles
  where id = user_uuid;

  if direct_plan is not null and direct_plan != 'free' then
    return direct_plan;
  end if;

  -- Check team plan (inherit from owner)
  -- We assume if you are in a team, and the team owner has a 'team' plan, you get 'team' status
  select p.plan_tier into team_plan
  from public.team_members tm
  join public.teams t on t.id = tm.team_id
  join public.profiles p on p.id = t.owner_id
  where tm.user_id = user_uuid
  and p.plan_tier = 'team'
  limit 1;

  if team_plan is not null then
    return team_plan;
  end if;

  return 'free';
end;
$$;