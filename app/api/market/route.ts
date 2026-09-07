import { NextRequest, NextResponse } from 'next/server';

export async function GET(request:NextRequest){
 const query=request.nextUrl.searchParams.get('q');
 if(query){
  try{const response=await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=16&newsCount=0`,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)throw new Error();const json:any=await response.json();const candidates=(json.quotes??[]).filter((q:any)=>['EQUITY','ETF','CRYPTOCURRENCY'].includes(q.quoteType)&&q.symbol&&!q.symbol.includes('=')).slice(0,12);const quotes=await Promise.all(candidates.map(async(q:any)=>{try{const priceResponse=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(q.symbol)}?interval=1d&range=5d`,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!priceResponse.ok)return null;const priceJson:any=await priceResponse.json();const meta=priceJson.chart?.result?.[0]?.meta;if(!meta?.regularMarketPrice)return null;const previous=meta.chartPreviousClose||meta.previousClose||meta.regularMarketPrice;return{symbol:q.symbol,yahoo:q.symbol,name:q.longname||q.shortname||q.symbol,type:q.quoteType==='CRYPTOCURRENCY'?'Cripto':'Acción',price:meta.regularMarketPrice,change:((meta.regularMarketPrice-previous)/previous)*100,currency:meta.currency==='EUR'?'EUR':'USD'}}catch{return null}}));return NextResponse.json(quotes.filter(Boolean),{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})}catch{return NextResponse.json([])}
 }
 const symbols=(request.nextUrl.searchParams.get('symbols')??'').split(',').filter(Boolean).slice(0,25);
 const entries=await Promise.all(symbols.map(async symbol=>{
  try{const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)return null;const json:any=await response.json();const meta=json.chart?.result?.[0]?.meta;if(!meta?.regularMarketPrice)return null;const previous=meta.chartPreviousClose||meta.previousClose||meta.regularMarketPrice;return [symbol,{price:meta.regularMarketPrice,change:((meta.regularMarketPrice-previous)/previous)*100}] as const}catch{return null}
 }));
 return NextResponse.json(Object.fromEntries(entries.filter(Boolean) as [string,{price:number;change:number}][]),{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})
}

