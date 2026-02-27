-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'user_name');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create posts table
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table posts enable row level security;

create policy "Posts are viewable by everyone." on posts
  for select using (true);

create policy "Users can insert their own posts." on posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own posts." on posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts." on posts
  for delete using (auth.uid() = user_id);

-- Create follows table
create table if not exists follows (
  follower_id uuid references profiles(id) not null,
  following_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Follows are viewable by everyone." on follows
  for select using (true);

create policy "Users can insert their own follows." on follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can delete own follows." on follows
  for delete using (auth.uid() = follower_id);

-- Create likes table
create table if not exists likes (
  user_id uuid references profiles(id) not null,
  post_id uuid references posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

alter table likes enable row level security;

create policy "Likes are viewable by everyone." on likes
  for select using (true);

create policy "Users can insert their own likes." on likes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes." on likes
  for delete using (auth.uid() = user_id);

-- Create comments table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  post_id uuid references posts(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table comments enable row level security;

create policy "Comments are viewable by everyone." on comments
  for select using (true);

create policy "Users can insert their own comments." on comments
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments." on comments
  for delete using (auth.uid() = user_id);

-- Create notifications table
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  actor_id uuid references profiles(id) not null,
  type text not null check (type in ('start_following', 'post_like', 'post_comment')),
  post_id uuid references posts(id) on delete cascade,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notifications enable row level security;

create policy "Users can view their own notifications." on notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications." on notifications
  for update using (auth.uid() = user_id);

-- Create storage bucket for avatars if strictly necessary via SQL, but SDK is surer.
-- However, we can try to insert if not exists.
insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (
    select 1 from storage.buckets where id = 'avatars'
);

create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid() = owner);
