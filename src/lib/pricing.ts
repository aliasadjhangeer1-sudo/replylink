export type PlanSlug = "free" | "starter" | "pro" | "agency";
export interface Plan { slug: PlanSlug; name: string; usd: number; pkr: number; accounts: number; automations: string; dms: string; features: string[]; popular?: boolean; cta: string; }
export const PLANS: Plan[] = [
  { slug: "free", name: "Free", usd: 0, pkr: 0, accounts: 1, automations: "3", dms: "100 / mo", features: ["1 account", "3 automations", "100 DMs / month", "Basic logs", "“Powered by ReplyLink” footer"], cta: "Start Free" },
  { slug: "starter", name: "Starter", usd: 1, pkr: 150, accounts: 1, automations: "5", dms: "500 / mo", features: ["1 account", "5 automations", "500 DMs / month", "No branding", "CSV export", "Public comment replies"], cta: "Start for Rs 150/mo" },
  { slug: "pro", name: "Pro", usd: 19, pkr: 5499, accounts: 3, automations: "Unlimited", dms: "10,000 / mo", popular: true, features: ["3 accounts", "Unlimited automations", "10,000 DMs / month", "Follow-gate flow", "Lead export", "Priority queue", "Keyword variants"], cta: "Start 7-day Pro trial" },
  { slug: "agency", name: "Agency", usd: 49, pkr: 13999, accounts: 10, automations: "Unlimited", dms: "50,000 / mo", features: ["10 accounts", "Unlimited automations", "50,000 DMs / month", "Team members", "White-label", "API access", "Priority support"], cta: "Talk to us" },
];
// Yearly = pay for 10 months. Monthly display = monthly price; yearly display = monthly-equivalent (×10/12).
export function priceFor(p: Plan, yearly: boolean, currency: "USD" | "PKR"): { amount: number; per: string; note: string } {
  const base = currency === "USD" ? p.usd : p.pkr;
  const sym = currency === "USD" ? "$" : "Rs ";
  if (!yearly) return { amount: base, per: "/mo", note: base === 0 ? "Free forever" : "Billed monthly" };
  const yearlyTotal = Math.round(base * 10);
  return { amount: yearlyTotal, per: "/yr", note: base === 0 ? "Free forever" : `Billed yearly — save ${sym}${(base * 2).toLocaleString()}` };
}
