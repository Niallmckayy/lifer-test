import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function injectTracking(html: string, slug: string, appUrl: string): string {
  const script = `<script>
(function(){
  var slug="${slug}",api="${appUrl}/api/track";
  var sid=sessionStorage.getItem("_lf_sid");
  if(!sid){sid=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);sessionStorage.setItem("_lf_sid",sid);}
  var start=Date.now();
  fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({websiteSlug:slug,type:"pageview",page:location.pathname,sessionId:sid,referrer:document.referrer||null})}).catch(function(){});
  function dur(){navigator.sendBeacon(api,JSON.stringify({websiteSlug:slug,type:"duration",page:location.pathname,sessionId:sid,duration:Math.round((Date.now()-start)/1000)}));}
  window.addEventListener("beforeunload",dur);
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")dur();});
})();
</script>`
  return html.includes('</body>') ? html.replace('</body>', script + '</body>') : html + script
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const draft = request.nextUrl.searchParams.get('draft') === '1'

  const website = await prisma.website.findUnique({
    where: { slug },
    include: { client: { include: { user: true } } },
  })

  if (!website) return new NextResponse('Not found', { status: 404 })

  if (draft) {
    // Auth-gated: must be the site owner or an admin
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    const isAdmin = role === 'ADMIN'
    const isOwner = role === 'CUSTOMER' && session?.user?.email === website.client?.user?.email

    if (!isAdmin && !isOwner) {
      return new NextResponse('Unauthorised', { status: 401 })
    }

    if (!website.draftHtmlContent) {
      return new NextResponse('No draft available', { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const draftHtml = injectTracking(website.draftHtmlContent, slug, appUrl)

    return new NextResponse(draftHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!website.htmlContent) {
    return new NextResponse('Not found', { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const html = injectTracking(website.htmlContent, slug, appUrl)

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
