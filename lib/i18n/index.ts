import tr, { type Dict } from './tr';
import en from './en';
import de from './de';

export type { Dict };
export const allLangs = ['tr', 'en', 'de'] as const;
export type Lang = (typeof allLangs)[number];

export const dicts: Record<Lang, Dict> = { tr, en, de };
export const langNames: Record<Lang, string> = { tr: 'Türkçe', en: 'English', de: 'Deutsch' };

// Yayında hangi dillerin üretileceği derleme anında seçilir: SITE_LANGS=tr,en,de
// Değer verilmezse yalnızca Türkçe üretilir; canlıya diller kademeli olarak eklenir.
export function siteLangs(): Lang[] {
  const raw = (process.env.SITE_LANGS || 'tr').split(',').map((s) => s.trim().toLowerCase());
  const langs = allLangs.filter((l) => raw.includes(l));
  return langs.length ? langs : ['tr'];
}
