alter table profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;
