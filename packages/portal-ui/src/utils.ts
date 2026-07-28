import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function fmtHUF(n: number): string {
  return new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(n) + ' Ft'
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('hu-HU').format(n)
}
