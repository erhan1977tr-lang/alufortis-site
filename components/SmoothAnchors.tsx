'use client';
import { useEffect } from 'react';

// Sayfa içi bağlantılara (#uretim gibi) tıklanınca yumuşak kaydırır.
// CSS scroll-behavior: smooth kullanılmıyor; o ayar adresle doğrudan açılan
// bölümlerde (alufortis.gkh.ro/#uretim) sayfanın tepeden yavaşça kaymasına yol açıyordu.
export default function SmoothAnchors() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href')!;
      const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (!target) return;
      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (location.hash !== hash) history.pushState(null, '', hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
