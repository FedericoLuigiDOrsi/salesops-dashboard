import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const eurFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEUR(cents: number) {
  return eurFormatter.format(cents / 100);
}

export function formatHoursAgo(hoursAgo: number) {
  return hoursAgo < 24 ? `${hoursAgo}h fa` : `${Math.round(hoursAgo / 24)}g fa`;
}
