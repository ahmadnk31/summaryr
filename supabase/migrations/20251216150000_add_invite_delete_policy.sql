-- Allow owners to delete team_invites
-- Use the SECURITY DEFINER function to break any potential loops (though less likely here)
-- and for consistency

create policy "Owners can delete invites" on public.team_invites for delete using (
    public.is_team_owner (team_id)
);