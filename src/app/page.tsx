import { ArrowRight, Instagram, Facebook, Zap, MessageCircle, ShieldCheck, BarChart3, Users, Sparkles, Check, Play, Send, MousePointerClick } from "lucide-react";
import { Pricing } from "@/components/pricing";
import { Demo } from "@/components/demo";
const features = [
 [Zap,"Smart keyword triggers","Trigger on exact or phrase matches, with flexible keyword rules."],
 [Send,"Automatic DMs","Send a helpful private reply with your product, booking or offer link."],
 [MessageCircle,"Public replies","Optionally reply beneath comments to let people know to check their inbox."],
 [ShieldCheck,"Duplicate protection","One-time-per-user safeguards and delivery logs help prevent repeated sends."],
 [Users,"Lead collection","Keep a record of engaged commenters and campaign activity."],
 [BarChart3,"Campaign analytics","See sent messages, delivery status and engagement in one dashboard."]
] as const;
export default function Home() {
 return <main className="overflow-hidden">
  <header className="container flex items-center justify-between py-5">
   <a href="#" className="flex items-center gap-2 text-2xl font-black"><span className="gradient-text">➤</span> Reply<span className="text-orange-400">Link</span></a>
   <nav className="hidden gap-8 text-sm text-slate-300 md:flex"><a href="#features">Features</a><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>
   <div className="flex gap-3"><a className="btn btn-secondary text-sm" href="/login">Login</a><a className="btn btn-primary text-sm" href="/signup">Start free <ArrowRight size={16}/></a></div>
  </header>
  <section className="grid-bg relative">
   <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-fuchsia-700/20 blur-[110px]"/>
   <div className="container grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
    <div className="relative z-10">
     <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200"><Zap size={15}/> Turn comments into customers</div>
     <h1 className="max-w-3xl text-5xl font-black leading-[1.08] tracking-tight md:text-7xl">Turn every comment into a <span className="gradient-text">sale.</span></h1>
     <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Automatically send Instagram and Facebook commenters a DM with the link they asked for. Set it up once. Let ReplyLink do the follow-up.</p>
     <div className="mt-8 flex flex-wrap gap-3"><a className="btn btn-primary" href="/signup">Start free <ArrowRight size={17}/></a><a className="btn btn-secondary" href="#demo"><Play size={16}/> Try live demo</a></div>
     <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-400"><span className="flex items-center gap-2"><Check size={15} className="text-emerald-400"/> No credit card required</span><span className="flex items-center gap-2"><Check size={15} className="text-emerald-400"/> Setup in minutes</span></div>
    </div>
    <div id="demo" className="relative"><div className="absolute inset-8 rounded-full bg-violet-600/25 blur-3xl"/><Demo/></div>
   </div>
  </section>
  <section className="border-y border-white/5 bg-white/[.02]"><div className="container flex flex-wrap items-center justify-center gap-10 py-6 text-sm text-slate-400"><span className="font-semibold text-slate-300">BUILT FOR SOCIAL SELLERS</span><span className="flex items-center gap-2"><Instagram/> Instagram</span><span className="flex items-center gap-2"><Facebook/> Facebook</span><span className="flex items-center gap-2"><ShieldCheck/> Meta platform policies</span></div></section>
  <section id="features" className="container py-24"><div className="mx-auto max-w-2xl text-center"><span className="text-sm font-bold uppercase tracking-[.2em] text-violet-300">Powerful features</span><h2 className="mt-4 text-4xl font-black md:text-5xl">Everything you need to <span className="gradient-text">grow faster.</span></h2><p className="mt-4 text-slate-400">Simple automation for creators, stores and growing teams.</p></div>
   <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon,title,desc])=><div className="card p-7 transition hover:-translate-y-1 hover:border-violet-400/50" key={title}><div className="mb-5 inline-flex rounded-xl bg-violet-500/15 p-3 text-violet-300"><Icon size={23}/></div><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-400">{desc}</p></div>)}</div>
  </section>
  <section id="how" className="bg-white/[.02] py-24"><div className="container"><div className="text-center"><span className="text-sm font-bold uppercase tracking-[.2em] text-violet-300">How it works</span><h2 className="mt-4 text-4xl font-black">Three steps. <span className="gradient-text">More conversations.</span></h2></div><div className="mt-14 grid gap-5 md:grid-cols-3">{[["01","Connect your account","Authorize your Instagram professional or Facebook Page."],["02","Choose a keyword","Set the comment keyword and write the DM with your link."],["03","Publish and grow","Turn on the automation and monitor activity from your dashboard."]].map(([n,t,d])=><div className="card p-8" key={n}><div className="gradient-text text-4xl font-black">{n}</div><h3 className="mt-5 text-xl font-bold">{t}</h3><p className="mt-3 leading-7 text-slate-400">{d}</p></div>)}</div></div></section>
  <section id="pricing" className="container py-24"><Pricing/></section>
  <section id="faq" className="bg-white/[.02] py-20"><div className="container max-w-3xl"><h2 className="text-center text-4xl font-black">Frequently asked <span className="gradient-text">questions</span></h2><div className="mt-10 space-y-4">{[["Does ReplyLink send real Instagram DMs?","The production integration requires a Meta app, approved permissions, connected professional accounts and webhook setup. The included demo is a UI preview only."],["Can I use it with a personal Instagram account?","Meta messaging automation generally requires an eligible Instagram professional account connected to a Facebook Page. Check Meta's current eligibility rules before launch."],["Can I cancel anytime?","Yes. Subscription cancellation and billing-provider integration must be configured before accepting live payments."],["Is there a free plan?","Yes. The starter configuration includes a free tier with usage limits. Limits are enforced server-side in the production billing phase."]].map(([q,a])=><details className="card p-5" key={q}><summary className="cursor-pointer font-bold">{q}</summary><p className="mt-3 leading-7 text-slate-400">{a}</p></details>)}</div></div></section>
  <footer className="container flex flex-col justify-between gap-5 py-10 text-sm text-slate-500 md:flex-row"><div className="font-black text-lg text-white">➤ Reply<span className="text-orange-400">Link</span><p className="mt-2 font-normal text-slate-500">Turn conversations into customers.</p></div><div className="flex gap-6"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@replylink.app">Contact</a></div><span>© {new Date().getFullYear()} ReplyLink</span></footer>
 </main>;
}
