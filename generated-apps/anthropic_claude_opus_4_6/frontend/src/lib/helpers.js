import { formatDistanceToNow } from 'date-fns';

export function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getAvatarUrl(supabase, avatarUrl) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
  return data?.publicUrl || null;
}

export function extractHashtags(text) {
  const matches = text.match(/#\w+/g);
  return matches || [];
}

export function highlightHashtags(text) {
  return text.replace(
    /#(\w+)/g,
    '<span class="text-primary font-medium cursor-pointer hover:underline">#$1</span>'
  );
}
