-- Add is_admin column to profiles
alter table public.profiles
add column if not exists is_admin boolean default false;

-- Create contacts table
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text check (status in ('new', 'replied')) not null default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  replied_at timestamp with time zone
);

-- Enable RLS
alter table public.contacts enable row level security;

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and is_admin = true
  );
end;
$$;

-- Policies for contacts

-- Anyone can insert (for public contact form)
create policy "Anyone can insert contacts" on public.contacts for
insert
with
    check (true);

-- Only admins can view contacts
create policy "Admins can view contacts" on public.contacts for
select using (public.is_admin ());

-- Only admins can update contacts (e.g., mark as replied)
create policy "Admins can update contacts" on public.contacts for
update using (public.is_admin ());

-- Only admins can delete contacts
create policy "Admins can delete contacts" on public.contacts for delete using (public.is_admin ());