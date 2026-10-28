// Dile bağlı olmayan veriler. Metinler lib/i18n altındadır.

export const contact = {
  address: 'Batı Mah. Hatboyu Cad. No:42/100, Pendik / İstanbul, Türkiye',
  phone: '+90 (533) 418 42 45',
  phoneHref: 'tel:+905334184245',
  email: 'info@alufortis.com',
  twitter: 'https://x.com/Alufortis',
};

export type FinishKey = 'dogal' | 'siyah' | 'bronz' | 'kahve' | 'sari' | 'ral' | 'ham';
export type Finish = { color: string; metalness: number; roughness: number };

export const finishes: Record<FinishKey, Finish> = {
  dogal: { color: '#c9ced3', metalness: 1, roughness: 0.32 },
  siyah: { color: '#2b2d31', metalness: 0.9, roughness: 0.38 },
  bronz: { color: '#8c5a2b', metalness: 0.95, roughness: 0.3 },
  kahve: { color: '#563a26', metalness: 0.9, roughness: 0.34 },
  sari: { color: '#b8954a', metalness: 0.95, roughness: 0.3 },
  ral: { color: '#383e42', metalness: 0.15, roughness: 0.62 },
  ham: { color: '#b4b9be', metalness: 1, roughness: 0.42 },
};

// Gerçek üretim sırası: kalıp → ekstrüzyon → yüzey işlemleri → mekanik işlem
export const stages = [
  { id: 'kaliphane', finish: 'ham' },
  { id: 'ekstruzyon', finish: 'ham' },
  { id: 'eloksal', finish: 'bronz', swatches: ['dogal', 'siyah', 'bronz', 'kahve', 'sari'] },
  { id: 'toz-boya', finish: 'ral' },
  { id: 'mekanik-islem', finish: 'siyah' },
] as const satisfies readonly { id: string; finish: FinishKey; swatches?: readonly FinishKey[] }[];
