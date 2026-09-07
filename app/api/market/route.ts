import { NextRequest, NextResponse } from 'next/server';

export async function GET(request:NextRequest){
 const query=request.nextUrl.searchParams.get('q');
 if(query){
  try{const response=await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0`,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)throw new Error();const json:any=await response.json();const quotes=(json.quotes??[]).filter((q:any)=>['EQUITY','ETF','CRYPTOCURRENCY'].includes(q.quoteType)&&q.symbol&&!q.symbol.includes('=')&&q.regularMarketPrice>0).map((q:any)=>({symbol:q.symbol,yahoo:q.symbol,name:q.longname||q.shortname||q.symbol,type:q.quoteType==='CRYPTOCURRENCY'?'Cripto':'Acción',price:q.regularMarketPrice,change:q.regularMarketChangePercent||0,currency:q.currency==='EUR'?'EUR':'USD'}));return NextResponse.json(quotes,{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})}catch{return NextResponse.json([])}
 }
 const symbols=(request.nextUrl.searchParams.get('symbols')??'').split(',').filter(Boolean).slice(0,25);
 const entries=await Promise.all(symbols.map(async symbol=>{
  try{const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)return null;const json:any=await response.json();const meta=json.chart?.result?.[0]?.meta;if(!meta?.regularMarketPrice)return null;const previous=meta.chartPreviousClose||meta.previousClose||meta.regularMarketPrice;return [symbol,{price:meta.regularMarketPrice,change:((meta.regularMarketPrice-previous)/previous)*100}] as const}catch{return null}
 }));
 return NextResponse.json(Object.fromEntries(entries.filter(Boolean) as [string,{price:number;change:number}][]),{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})
}

