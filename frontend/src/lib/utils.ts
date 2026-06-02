import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministic gradient palette. The seed (e.g. tournament id/name) is hashed
 * to a stable index so the same entity always renders the same gradient when it
 * has no logo.
 */
const GRADIENTS = [
  'from-rose-500 to-orange-400',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-fuchsia-500',
  'from-amber-500 to-pink-500',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-purple-600 to-blue-500',
]

function hashString(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function gradientFor(seed: string): string {
  return GRADIENTS[hashString(seed) % GRADIENTS.length]
}
