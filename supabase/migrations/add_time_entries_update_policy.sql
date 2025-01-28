-- Create policy to allow users to update their own time entries
create policy "Users can update their own time entries"
on time_entries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id); 