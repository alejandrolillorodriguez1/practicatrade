import { NextRequest, NextResponse } from 'next/server';

export async function GET(request:NextRequest){
 const symbols=(request.nextUrl.searchParams.get('symbols')??'').split(',').filter(Boolean).slice(0,25);
 const entries=await Promise.all(symbols.map(async symbol=>{
  try{const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},next:{revalidate:60}});if(!response.ok)return null;const json:any=await response.json();const meta=json.chart?.result?.[0]?.meta;if(!meta?.regularMarketPrice)return null;const previous=meta.chartPreviousClose||meta.previousClose||meta.regularMarketPrice;return [symbol,{price:meta.regularMarketPrice,change:((meta.regularMarketPrice-previous)/previous)*100}] as const}catch{return null}
 }));
 return NextResponse.json(Object.fromEntries(entries.filter(Boolean) as [string,{price:number;change:number}][]),{headers:{'Cache-Control':'public, max-age=30, s-maxage=60'}})
}

