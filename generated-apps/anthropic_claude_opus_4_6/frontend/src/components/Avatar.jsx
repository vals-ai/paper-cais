import { User } from 'lucide-react';
import { getAvatarUrl } from '../lib/helpers';
import { supabase } from '../lib/supabase';

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const iconSizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
};

export default function Avatar({ src, size = 'md', className = '' }) {
  const url = getAvatarUrl(supabase, src);
  const sizeClass = sizeMap[size] || sizeMap.md;
  const iconSize = iconSizeMap[size] || iconSizeMap.md;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-accent flex items-center justify-center flex-shrink-0 ${className}`}>
      {url ? (
        <img
          src={url}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={`${url ? 'hidden' : 'flex'} items-center justify-center w-full h-full text-accent-foreground`}
      >
        <User className={iconSize} />
      </div>
    </div>
  );
}
