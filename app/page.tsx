'use client';

import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Bell, BookOpen, ChevronDown, Search, ShieldCheck, Wallet } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const chartData = [62840,63140,62720,63480,63890,63620,64430,64110,64920,65380,65110,65940,66320,66080,66842].map((price,index)=>({time:`${index+8}:00`,price}));
const assets = [
  {symbol:'BTC',name:'Bitcoin',price:66842.31,change:2.84,color:'#f59e0b'},
  {symbol:'ETH',name:'Ethereum',price:3457.92,change:1.47,color:'#8b5cf6'},
  {symbol:'SOL',name:'Solana',price:148.26,change:-0.73,color:'#14b8a6'},
];
const euros = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});

export default function Home(){
  const [side,setSide]=useState<'buy'|'sell'>('buy');
  const [amount,setAmount]=useState('250');
  const [balance,setBalance]=useState(10000);
  const [btc,setBtc]=useState(0);
  const [message,setMessage]=useState('');
  const [price,setPrice]=useState(assets[0].price);
  const [marketStatus,setMarketStatus]=useState<'connecting'|'live'|'delayed'>('connecting');
  const quantity=Number(amount||0)/price, portfolio=balance+btc*price;
  useEffect(()=>{
    const saved=window.localStorage.getItem('practicatrade-portfolio');
    if(saved){try{const data=JSON.parse(saved);setBalance(data.balance);setBtc(data.btc)}catch{}}
    async function refresh(){try{const response=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur&include_24hr_change=true');if(!response.ok)throw new Error();const data=await response.json();setPrice(data.bitcoin.eur);setMarketStatus('live')}catch{setMarketStatus('delayed')}}
    refresh();const timer=window.setInterval(refresh,30000);return()=>window.clearInterval(timer);
  },[]);
  useEffect(()=>{window.localStorage.setItem('practicatrade-portfolio',JSON.stringify({balance,btc}))},[balance,btc]);
  const canTrade=Number(amount)>0&&(side==='buy'?Number(amount)<=balance:quantity<=btc);
  function trade(){if(!canTrade)return;const value=Number(amount);setBalance(v=>v+(side==='buy'?-value:value));setBtc(v=>v+(side==='buy'?quantity:-quantity));setMessage(`${side==='buy'?'Compra':'Venta'} simulada ejecutada: ${quantity.toFixed(6)} BTC`)}
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-white/8 bg-[#0b111d]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 sm:px-7">
      <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-lime-300 text-[#091018]"><BarChart3 size={20} strokeWidth={2.5}/></div><span className="text-lg font-bold tracking-tight">PRACTICA<span className="text-lime-300">TRADE</span></span><span className="hidden rounded-full border border-lime-300/20 bg-lime-300/8 px-2 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-lime-300 sm:inline">{marketStatus==='live'?'Mercado en vivo':marketStatus==='delayed'?'Precio de respaldo':'Conectando mercado'}</span></div>
      <div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Notificaciones"><Bell/></Button><Button variant="outline" className="hidden border-white/10 bg-white/5 sm:flex"><BookOpen/> Guía rápida</Button><div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 text-xs font-bold text-slate-950">AP</div></div>
    </div></header>
    <div className="mx-auto grid max-w-[1480px] gap-5 px-4 py-5 sm:px-7 xl:grid-cols-[230px_minmax(0,1fr)_340px]">
      <aside className="hidden xl:block"><p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Mercado</p><div className="relative mb-3"><Search className="absolute left-3 top-2.5 size-4 text-slate-500"/><Input className="h-9 border-white/8 bg-white/[.035] pl-9" placeholder="Buscar activo"/></div><div className="space-y-1.5">{assets.map((a,i)=><button key={a.symbol} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${i===0?'border-lime-300/25 bg-lime-300/[.07]':'border-transparent hover:bg-white/5'}`}><span className="grid size-9 place-items-center rounded-full text-xs font-bold text-slate-950" style={{backgroundColor:a.color}}>{a.symbol[0]}</span><span className="min-w-0 flex-1"><b className="block text-sm">{a.symbol}</b><span className="text-xs text-slate-500">{a.name}</span></span><span className="text-right"><b className="block text-xs">{euros.format(a.price)}</b><span className={`text-xs ${a.change>=0?'text-lime-300':'text-rose-400'}`}>{a.change>0?'+':''}{a.change}%</span></span></button>)}</div><div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-4"><ShieldCheck className="mb-3 text-cyan-300"/><p className="text-sm font-semibold">Dinero virtual, aprendizaje real</p><p className="mt-1 text-xs leading-5 text-slate-500">Practica estrategias sin poner en riesgo tu dinero.</p></div></aside>
      <section className="min-w-0 space-y-5"><div className="grid gap-3 sm:grid-cols-3">{[['Valor de la cartera',euros.format(portfolio),'+0,00% hoy'],['Efectivo disponible',euros.format(balance),'Listo para operar'],['Posición en BTC',euros.format(btc*price),`${btc.toFixed(6)} BTC`]].map(([l,v,n])=><div key={l} className="rounded-2xl border border-white/8 bg-card p-4"><p className="text-xs text-slate-500">{l}</p><p className="mt-1 text-xl font-semibold tracking-tight">{v}</p><p className="mt-1 text-xs text-lime-300">{n}</p></div>)}</div>
        <div className="rounded-2xl border border-white/8 bg-card p-4 sm:p-6"><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-xl font-bold">Bitcoin / Euro</h1><span className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-400">BTC · EUR</span></div><div className="mt-2 flex items-end gap-3"><span className="text-3xl font-semibold tracking-tight">{euros.format(price)}</span><span className="mb-1 flex items-center text-sm font-semibold text-lime-300"><ArrowUpRight size={16}/> mercado real</span></div></div><div className="flex rounded-lg bg-white/5 p-1">{['1H','1D','1S','1M'].map(r=><button key={r} className={`rounded-md px-3 py-1.5 text-xs ${r==='1D'?'bg-white/10 text-white':'text-slate-500'}`}>{r}</button>)}</div></div>
          <div className="h-[330px] w-full"><ResponsiveContainer><AreaChart data={chartData} margin={{left:0,right:4,top:8,bottom:0}}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bef264" stopOpacity={.22}/><stop offset="100%" stopColor="#bef264" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:11}} interval={3}/><YAxis domain={['dataMin - 600','dataMax + 300']} orientation="right" axisLine={false} tickLine={false} tick={{fill:'#64748b',fontSize:11}} width={58}/><Tooltip contentStyle={{background:'#111a28',border:'1px solid #263244',borderRadius:10}} formatter={v=>euros.format(Number(v))}/><Area type="monotone" dataKey="price" stroke="#bef264" strokeWidth={2.4} fill="url(#chartFill)"/></AreaChart></ResponsiveContainer></div>
        </div></section>
      <aside className="rounded-2xl border border-white/8 bg-card p-5 xl:self-start"><div className="mb-5 flex rounded-xl bg-white/5 p-1"><button onClick={()=>setSide('buy')} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${side==='buy'?'bg-lime-300 text-slate-950':'text-slate-400'}`}>Comprar</button><button onClick={()=>setSide('sell')} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${side==='sell'?'bg-rose-400 text-slate-950':'text-slate-400'}`}>Vender</button></div>
        <label className="text-xs text-slate-400">Orden de mercado</label><button className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.035] px-3 text-sm"><span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-950">B</span> Bitcoin</span><ChevronDown size={16}/></button>
        <div className="mt-5 flex items-center justify-between"><label htmlFor="amount" className="text-xs text-slate-400">Importe</label><span className="text-xs text-slate-500">Disponible: {euros.format(balance)}</span></div><div className="relative mt-2"><Input id="amount" type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} className="h-12 border-white/10 bg-white/[.035] pr-14 text-lg font-semibold"/><span className="absolute right-4 top-3.5 text-sm text-slate-500">EUR</span></div><div className="mt-2 flex gap-2">{['100','250','500'].map(v=><button key={v} onClick={()=>setAmount(v)} className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs text-slate-400 hover:bg-white/10">{v} €</button>)}</div>
        <div className="my-5 space-y-3 border-y border-white/8 py-4 text-sm"><div className="flex justify-between text-slate-400"><span>Precio estimado</span><span className="text-white">{euros.format(price)}</span></div><div className="flex justify-between text-slate-400"><span>Recibirás</span><span className="text-white">{quantity.toFixed(6)} BTC</span></div><div className="flex justify-between text-slate-400"><span>Comisión virtual</span><span className="text-white">0,00 €</span></div></div>
        <Button onClick={trade} disabled={!canTrade} className={`h-12 w-full text-sm font-bold ${side==='buy'?'bg-lime-300 text-slate-950 hover:bg-lime-200':'bg-rose-400 text-slate-950 hover:bg-rose-300'}`}>{side==='buy'?<ArrowUpRight/>:<ArrowDownRight/>}{side==='buy'?'Comprar':'Vender'} BTC</Button><p aria-live="polite" className="mt-3 min-h-5 text-center text-xs text-lime-300">{message}</p><div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500"><Wallet size={13}/> Operación 100% simulada</div>
      </aside>
    </div>
  </main>
}

