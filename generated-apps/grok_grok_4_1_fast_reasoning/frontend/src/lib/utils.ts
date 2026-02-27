import { type ClassValue, clsx } from &quot;clsx&quot;
import { twMerge } from &quot;tailwind-merge&quot;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}