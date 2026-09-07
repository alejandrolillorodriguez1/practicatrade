import { NextRequest, NextResponse } from 'next/server';

const normalize=(value:string)=>value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(incorporated|inc|corporation|corp|company|co|plc|limited|ltd|sa|se|ag|nv|spa|group|holdings?)\b/g,'').replace(/[^a-z0-9]/g,'');
const preferredExchanges=['NMS','NGM','NYQ','NYS','MCE','GER','LSE','PAR','AMS','MIL','SWX'];

function searchScore(quote:any,query:string,index:number){
 const wanted=normalize(query);const symbol=normalize(quote.symbol??'');const name=normalize(quote.longname||quote.shortname||'');
 const rawSymbol=String(quote.symbol??'');
 return (symbol===wanted?500:0)+(name===wanted?450:0)+(name.startsWith(wanted)?250:0)+(symbol.startsWith(wanted)?180:0)+(quote.quoteType==='EQUITY'?80:quote.quoteType==='ETF'?30:50)+(preferredExchanges.includes(quote.exchange)?100:0)+(!rawSymbol.includes('.')?80:-40)+Math.max(0,12-rawSymbol.length)*5-index;
}

export async function GET(request:NextRequest){
 const historySymbol=request.nextUrl.searchParams.get('history');
 if(historySymbol){
  const selected=request.nextUrl.searchParams.get('range')??'1d';const config:Record<string,{range:string;interval:string}>={"1D":{range:'1d',interval:'5m'},"1S":{range:'5d',interval:'30m'},"1M":{range:'1mo',interval:'1d'},"1A":{range:'1y',interval:'1wk'}};const option=config[selected]??config['1D'];
  try{const response=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(historySymbol)}?interval=${option.interval}&range=${option.range}`,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)throw new Error();const result=(await response.json() as any).chart?.result?.[0];const timestamps=result?.timestamp??[];const closes=result?.indicators?.quote?.[0]?.close??[];const points=timestamps.map((time:number,index:number)=>({time:time*1000,price:closes[index]})).filter((point:any)=>Number.isFinite(point.price));return NextResponse.json(points,{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})}catch{return NextResponse.json([])}
 }
 const query=request.nextUrl.searchParams.get('q');
 if(query){
  try{const response=await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=30&newsCount=0`,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)throw new Error();const json:any=await response.json();const unwanted=/warrant|certificate|memexpr|turbo|knock-out|note|bear |bull |rights?|units?/i;const ranked=(json.quotes??[]).map((q:any,index:number)=>({...q,_score:searchScore(q,query,index)})).filter((q:any)=>['EQUITY','ETF','CRYPTOCURRENCY'].includes(q.quoteType)&&q.symbol&&!q.symbol.includes('=')&&!/^\d/.test(q.symbol)&&(q.quoteType==='CRYPTOCURRENCY'||!/\d/.test(q.symbol))&&!unwanted.test(q.longname||q.shortname||'')).sort((a:any,b:any)=>b._score-a._score);const seen=new Set<string>();const candidates=ranked.filter((q:any)=>{const company=normalize(q.longname||q.shortname||q.symbol)||normalize(q.symbol.split('.')[0]);if(seen.has(company))return false;seen.add(company);return true}).slice(0,6);const quotes=await Promise.all(candidates.map(async(q:any)=>{try{const priceResponse=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(q.symbol)}?interval=1d&range=5d`,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!priceResponse.ok)return null;const priceJson:any=await priceResponse.json();const meta=priceJson.chart?.result?.[0]?.meta;if(!meta?.regularMarketPrice)return null;const previous=meta.chartPreviousClose||meta.previousClose||meta.regularMarketPrice;return{symbol:q.symbol,yahoo:q.symbol,name:q.longname||q.shortname||q.symbol,type:q.quoteType==='CRYPTOCURRENCY'?'Cripto':'Acción',price:meta.regularMarketPrice,change:((meta.regularMarketPrice-previous)/previous)*100,currency:meta.currency==='EUR'?'EUR':'USD',exchange:q.exchDisp||meta.exchangeName}}catch{return null}}));return NextResponse.json(quotes.filter(Boolean),{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})}catch{return NextResponse.json([])}
 }
 const symbols=(request.nextUrl.searchParams.get('symbols')??'').split(',').filter(Boolean).slice(0,25);
 const entries=await Promise.all(symbols.map(async symbol=>{
  try{const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)return null;const json:any=await response.json();const meta=json.chart?.result?.[0]?.meta;if(!meta?.regularMarketPrice)return null;const previous=meta.chartPreviousClose||meta.previousClose||meta.regularMarketPrice;return [symbol,{price:meta.regularMarketPrice,change:((meta.regularMarketPrice-previous)/previous)*100}] as const}catch{return null}
 }));
 return NextResponse.json(Object.fromEntries(entries.filter(Boolean) as [string,{price:number;change:number}][]),{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})
}

