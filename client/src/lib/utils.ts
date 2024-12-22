import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Browser and platform detection utility
export function detect() {
  const userAgent = navigator.userAgent;
  return {
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
    supportsWebAudio: typeof window !== 'undefined' && (!!window.AudioContext || !!(window as any).webkitAudioContext),
    supportsTouchEvents: typeof window !== 'undefined' && ('ontouchstart' in window)
  };
}
