import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const script = `(function(){
  var slug=${JSON.stringify(slug)},api=${JSON.stringify(appUrl + '/api/track')};
  if(!slug)return;
  var sid=sessionStorage.getItem("_lf_sid");
  if(!sid){sid=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);sessionStorage.setItem("_lf_sid",sid);}
  var start=Date.now();
  fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({websiteSlug:slug,type:"pageview",page:location.pathname,sessionId:sid,referrer:document.referrer||null})}).catch(function(){});
  function dur(){navigator.sendBeacon(api,JSON.stringify({websiteSlug:slug,type:"duration",page:location.pathname,sessionId:sid,duration:Math.round((Date.now()-start)/1000)}));}
  window.addEventListener("beforeunload",dur);
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")dur();});
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
