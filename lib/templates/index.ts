import type { ContentBrief } from '../claude'
import { buildCSS } from './themes'
import { navHTML, heroHTML, servicesHTML, processHTML, aboutHTML, galleryHTML, testimonialsHTML, statsHTML, ctaHTML, footerHTML } from './sections'

export function assembleProspectSite(
  brief: ContentBrief,
  businessName: string,
  heroImageUrl: string | null,
  galleryImageUrls: string[],
): string {
  // Backward compat: old stored briefs may have singular testimonial
  if (!Array.isArray(brief.testimonials)) {
    brief.testimonials = (brief as unknown as { testimonial?: { quote: string; author: string; role: string } }).testimonial
      ? [(brief as unknown as { testimonial: { quote: string; author: string; role: string } }).testimonial]
      : []
  }

  const css          = buildCSS(brief)
  const galleryImage = galleryImageUrls[0] ?? null
  const aboutImage   = brief.aboutImageUrl ?? galleryImage
  const hasHeroImage = !!heroImageUrl

  const sections = [
    navHTML(brief, businessName, hasHeroImage),
    heroHTML(brief, businessName, heroImageUrl),
    servicesHTML(brief),
    processHTML(brief),
    aboutHTML(brief, businessName, aboutImage),
    galleryHTML(brief, galleryImageUrls),
    testimonialsHTML(brief),
    statsHTML(brief),
    ctaHTML(brief),
    footerHTML(brief, businessName),
  ].join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${businessName}</title>
  <style>
${css}
  </style>
</head>
<body>
${sections}
<script>(function(){
  // ── Scroll-triggered fade-in animations ──
  var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('in-view');io.unobserve(entry.target);}});},{threshold:0.12});
  document.querySelectorAll('[data-animate]').forEach(function(el){io.observe(el);});

  // ── Service card grid stagger ──
  var gridIo=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');gridIo.unobserve(e.target);}});},{threshold:0.1});
  document.querySelectorAll('[data-animate-grid]').forEach(function(el){gridIo.observe(el);});

  // ── Stats counter animation ──
  function easeOutCubic(t){return 1-Math.pow(1-t,3);}
  var cio=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;var el=entry.target;var target=parseInt(el.dataset.count,10);var suffix=el.dataset.suffix||'';var duration=1800;var start=performance.now();function tick(now){var elapsed=Math.min((now-start)/duration,1);el.textContent=Math.round(easeOutCubic(elapsed)*target)+suffix;if(elapsed<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);cio.unobserve(el);});},{threshold:0.5});
  document.querySelectorAll('[data-count]').forEach(function(el){cio.observe(el);});

  // ── Mobile hamburger ──
  var hamburger=document.querySelector('.nav__hamburger');
  var navLinks=document.querySelector('.nav__links');
  if(hamburger&&navLinks){hamburger.addEventListener('click',function(){var open=navLinks.classList.toggle('open');hamburger.classList.toggle('open',open);hamburger.setAttribute('aria-expanded',String(open));});}

  // ── Nav scroll state + transparent hero nav ──
  var nav=document.querySelector('.nav');
  if(nav){
    var heroTop=nav.classList.contains('nav--hero-top');
    window.addEventListener('scroll',function(){
      var scrolled=window.scrollY>20;
      nav.classList.toggle('scrolled',scrolled);
      if(heroTop)nav.classList.toggle('nav--hero-top',!scrolled);
    },{passive:true});
  }

  // ── Hero parallax ──
  var heroBg=document.querySelector('.hero__bg');
  if(heroBg){
    window.addEventListener('scroll',function(){
      if(window.scrollY<window.innerHeight)heroBg.style.transform='translateY('+(window.scrollY*0.4)+'px)';
    },{passive:true});
  }
})();</script>
</body>
</html>`
}
