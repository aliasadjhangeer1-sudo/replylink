"use client";
import { useState } from "react";
import { Instagram, Send, Sparkles } from "lucide-react";
export function Demo(){
 const [keyword,setKeyword]=useState("LINK"); const [sent,setSent]=useState(false);
 return <div className="glass relative mx-auto max-w-md rounded-[28px] p-5 shadow-glow">
  <div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-2"><Instagram className="text-pink-400"/><b>Instagram preview</b></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Interactive demo</span></div>
  <div className="mt-5 rounded-2xl bg-white/[.06] p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-600"/><div><b className="text-sm">your_brand</b><p className="text-xs text-slate-400">New product drop ✨</p></div></div><div className="mt-4 rounded-xl bg-gradient-to-br from-violet-900 to-fuchsia-900 p-8 text-center"><Sparkles className="mx-auto mb-2" size={26}/><b className="text-xl">Your next bestseller</b><p className="mt-2 text-sm text-violet-200">Comment below to get the link</p></div><div className="mt-4 text-sm text-slate-300"><b>@sara_123</b> Please send me the details! <span className="text-pink-300"># {keyword}</span></div></div>
  <div className="mt-4"><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Try a keyword</label><div className="flex gap-2"><input value={keyword} onChange={e=>{setKeyword(e.target.value.toUpperCase());setSent(false)}} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-violet-400" placeholder="e.g. LINK"/><button onClick={()=>setSent(true)} className="btn btn-primary"><Send size={16}/> Send</button></div></div>
  {sent&&<div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm"><b className="text-emerald-300">Demo DM preview</b><p className="mt-1 text-slate-200">Hey! Thanks for commenting. Here's your link: yourbrand.com/offer</p><p className="mt-2 text-xs text-slate-400">Preview only — no real message was sent.</p></div>}
 </div>;
}
