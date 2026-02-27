-- Zeeter Social Network: initial schema

create extension if not exists pgcrypto;

-- Core entities
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_content_length check (char_length(content) <= 280 and char_length(content) > 0)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_length check (char_length(content) <= 280 and char_length(content) > 0)
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(user_id) on delete cascade,
  followee_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self_follow check (follower_id <> followee_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(user_id) on delete cascade,
  actor_id uuid references public.profiles(user_id) on delete set null,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_type_check check (type in ('like','comment','follow'))
);

-- Indexes
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_created_at_idx on public.posts (user_id, created_at desc);
create index if not exists comments_post_created_at_idx on public.comments (post_id, created_at asc);
create index if not exists likes_post_idx on public.likes (post_id);
create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_followee_idx on public.follows (followee_id);
create index if not exists notifications_recipient_created_at_idx on public.notifications (recipient_id, created_at desc);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

-- Create profile row for each new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Notifications triggers
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.followee_id, new.follower_id, 'follow');
  return new;
end;
$$;

create or replace function public.notify_on_like()
returns trigger
language plpgsql
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  if post_owner is null or post_owner = new.user_id then
    return new;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, post_id)
  values (post_owner, new.user_id, 'like', new.post_id);
  return new;
end;
$$;

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  if post_owner is null or post_owner = new.user_id then
    return new;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
  values (post_owner, new.user_id, 'comment', new.post_id, new.id);
  return new;
end;
$$;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
after insert on public.follows
for each row execute function public.notify_on_follow();

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
after insert on public.likes
for each row execute function public.notify_on_like();

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
after insert on public.comments
for each row execute function public.notify_on_comment();

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles
for select using (true);

drop policy if exists "Users can insert their profile" on public.profiles;
create policy "Users can insert their profile" on public.profiles
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile" on public.profiles
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Posts policies
drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone" on public.posts
for select using (true);

drop policy if exists "Users can create posts" on public.posts;
create policy "Users can create posts" on public.posts
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their posts" on public.posts;
create policy "Users can update their posts" on public.posts
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their posts" on public.posts;
create policy "Users can delete their posts" on public.posts
for delete to authenticated
using (auth.uid() = user_id);

-- Comments policies
drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone" on public.comments
for select using (true);

drop policy if exists "Users can create comments" on public.comments;
create policy "Users can create comments" on public.comments
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their comments" on public.comments;
create policy "Users can update their comments" on public.comments
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their comments" on public.comments;
create policy "Users can delete their comments" on public.comments
for delete to authenticated
using (auth.uid() = user_id);

-- Likes policies
drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes are viewable by everyone" on public.likes
for select using (true);

drop policy if exists "Users can like posts" on public.likes;
create policy "Users can like posts" on public.likes
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can unlike posts" on public.likes;
create policy "Users can unlike posts" on public.likes
for delete to authenticated
using (auth.uid() = user_id);

-- Follows policies
drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone" on public.follows
for select using (true);

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others" on public.follows
for insert to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow others" on public.follows;
create policy "Users can unfollow others" on public.follows
for delete to authenticated
using (auth.uid() = follower_id);

-- Notifications policies
drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications" on public.notifications
for select to authenticated
using (auth.uid() = recipient_id);

drop policy if exists "Users can mark notifications read" on public.notifications;
create policy "Users can mark notifications read" on public.notifications
for update to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

drop policy if exists "Users can insert notifications for actions" on public.notifications;
create policy "Users can insert notifications for actions" on public.notifications
for insert to authenticated
with check (
  actor_id = auth.uid()
  and recipient_id <> actor_id
  and (
    (type = 'follow' and post_id is null and comment_id is null and exists (
      select 1 from public.follows f
      where f.follower_id = actor_id and f.followee_id = recipient_id
    ))
    or
    (type = 'like' and post_id is not null and comment_id is null and exists (
      select 1 from public.likes l
      join public.posts p on p.id = l.post_id
      where l.user_id = actor_id and l.post_id = post_id and p.user_id = recipient_id
    ))
    or
    (type = 'comment' and post_id is not null and comment_id is not null and exists (
      select 1 from public.comments c
      join public.posts p on p.id = c.post_id
      where c.id = comment_id and c.user_id = actor_id and p.user_id = recipient_id
    ))
  )
);

-- Storage (avatars)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true, name = excluded.name;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible" on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
