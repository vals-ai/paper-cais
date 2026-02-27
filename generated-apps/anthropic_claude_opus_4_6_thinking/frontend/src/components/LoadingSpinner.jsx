import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoadingSpinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />
    </div>
  );
}
