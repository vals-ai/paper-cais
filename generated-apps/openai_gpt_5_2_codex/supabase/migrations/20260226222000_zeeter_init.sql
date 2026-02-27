create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('like', 'comment', 'follow');
  end if;
end$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 280),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 280),
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now(),
  read_at timestamptz
);

create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists likes_post_id_idx on public.likes(post_id);
create index if not exists follows_follower_id_idx on public.follows(follower_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute procedure public.set_updated_at();

create or replace function public.handle_like_notification()
returns trigger as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (post_author, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_like_notification on public.likes;
create trigger on_like_notification
after insert on public.likes
for each row execute procedure public.handle_like_notification();

create or replace function public.handle_comment_notification()
returns trigger as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (user_id, actor_id, type, post_id, comment_id)
    values (post_author, new.author_id, 'comment', new.post_id, new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_comment_notification on public.comments;
create trigger on_comment_notification
after insert on public.comments
for each row execute procedure public.handle_comment_notification();

create or replace function public.handle_follow_notification()
returns trigger as $$
begin
  if new.following_id <> new.follower_id then
    insert into public.notifications (user_id, actor_id, type)
    values (new.following_id, new.follower_id, 'follow');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_follow_notification on public.follows;
create trigger on_follow_notification
after insert on public.follows
for each row execute procedure public.handle_follow_notification();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
 drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

 drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

 drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Posts policies
 drop policy if exists "Public posts are viewable by everyone" on public.posts;
create policy "Public posts are viewable by everyone"
  on public.posts for select
  using (true);

 drop policy if exists "Users can create posts" on public.posts;
create policy "Users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

 drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id);

 drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- Follows policies
 drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

 drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow"
  on public.follows for insert
  with check (auth.uid() = follower_id);

 drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Likes policies
 drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

 drop policy if exists "Users can like" on public.likes;
create policy "Users can like"
  on public.likes for insert
  with check (auth.uid() = user_id);

 drop policy if exists "Users can unlike" on public.likes;
create policy "Users can unlike"
  on public.likes for delete
  using (auth.uid() = user_id);

-- Comments policies
 drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

 drop policy if exists "Users can comment" on public.comments;
create policy "Users can comment"
  on public.comments for insert
  with check (auth.uid() = author_id);

 drop policy if exists "Users can delete their comments" on public.comments;
create policy "Users can delete their comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- Notifications policies
 drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

 drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

 drop policy if exists "Users can delete their notifications" on public.notifications;
create policy "Users can delete their notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public avatars are viewable by everyone" on storage.objects;
create policy "Public avatars are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload avatars" on storage.objects;
create policy "Users can upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their avatars" on storage.objects;
create policy "Users can update their avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  );

drop policy if exists "Users can delete their avatars" on storage.objects;
create policy "Users can delete their avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and owner = auth.uid()
  );
