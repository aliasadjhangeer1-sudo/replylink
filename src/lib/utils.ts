import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const fmtPKR = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;
export const fmtUSD = (n: number) => `$${n}`;
export function yearlyPrice(monthlyUSD: number, monthlyPKR: number) {
  // Yearly = 2 months free → pay for 10 months, billed yearly.
  return { usd: monthlyUSD * 10, pkr: monthlyPKR * 10, savePct: 17 };
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function randomDelayMs(): number { return 3000 + Math.random() * 12000; } // Meta human-like 3–15s
