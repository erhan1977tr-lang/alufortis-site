// Tüm metinler eski alufortis.com sitesinden alınmıştır; yeni iddia eklenmemiştir.

export const contact = {
  address: 'Batı Mah. Hatboyu Cad. No:42/100, Pendik / İstanbul, Türkiye',
  phone: '+90 (533) 418 42 45',
  phoneHref: 'tel:+905334184245',
  email: 'info@alufortis.com',
  twitter: 'https://x.com/Alufortis',
};

export const nav = [
  { href: '#kurumsal', label: 'Kurumsal' },
  { href: '#uretim', label: 'Üretim' },
  { href: '#kataloglar', label: 'Kataloglar' },
  { href: '#iletisim', label: 'İletişim' },
];

export const languages = ['TR', 'EN', 'DE', 'HE', 'RU'];

export type Finish = { name: string; color: string; metalness: number; roughness: number };

export const finishes: Record<string, Finish> = {
  dogal: { name: 'Doğal eloksal', color: '#c9ced3', metalness: 1, roughness: 0.32 },
  siyah: { name: 'Siyah eloksal', color: '#2b2d31', metalness: 0.9, roughness: 0.38 },
  bronz: { name: 'Bronz eloksal', color: '#8c5a2b', metalness: 0.95, roughness: 0.3 },
  kahve: { name: 'Kahverengi eloksal', color: '#563a26', metalness: 0.9, roughness: 0.34 },
  sari: { name: 'Sarı eloksal', color: '#b8954a', metalness: 0.95, roughness: 0.3 },
  ral: { name: 'RAL 7016 toz boya', color: '#383e42', metalness: 0.15, roughness: 0.62 },
  ham: { name: 'Ham profil', color: '#b4b9be', metalness: 1, roughness: 0.42 },
};

// Gerçek üretim sırası: kalıp → ekstrüzyon → yüzey işlemleri → mekanik işlem
export const production = [
  {
    id: 'kaliphane',
    title: 'Kalıphane',
    finish: 'ham',
    text:
      'Yüksek hassasiyet gerektiren özel kalıplar; modern CNC işleme merkezleri, tel ve dalma erezyon, CNC torna ve freze tezgâhları ve CAD/CAM sistemleriyle üretilir.',
    specs: [
      ['Kalıp ölçüsü', '120 – 450 mm'],
      ['Yıllık kapasite', '2.500 kalıp'],
      ['Aktif kalıp arşivi', '≈ 23.000 kalıp'],
    ],
  },
  {
    id: 'ekstruzyon',
    title: 'Ekstrüzyon',
    finish: 'ham',
    text:
      'Tam otomatik hatlarda 6063, 6082, 6005 ve 6463 alaşımlı billet kullanılır. Üretim DIN EN 755-9 tolerans standartlarına uygundur.',
    specs: [
      ['Pres gücü', '700 – 4.500 ton'],
      ['Çap aralığı', '4" – 10"'],
      ['Profil ağırlığı', '0,070 – 20.000 gr/mt'],
      ['Maks. profil boyu', '13,5 m'],
      ['Yıllık kapasite', '20.000 ton'],
    ],
  },
  {
    id: 'eloksal',
    title: 'Eloksal',
    finish: 'bronz',
    text:
      'İki eloksal hattında polisaj, satinaj ve kumlama işlemlerine ek olarak doğal, siyah, bronz, kahverengi ve sarı tonlarda kaplama yapılır.',
    specs: [
      ['Hat sayısı', '2'],
      ['Maks. profil boyu', '7 m'],
      ['Yıllık kapasite', '22.000 ton'],
      ['Sertifika', 'Qualanod'],
    ],
    swatches: ['dogal', 'siyah', 'bronz', 'kahve', 'sari'],
  },
  {
    id: 'toz-boya',
    title: 'Elektrostatik toz boya',
    finish: 'ral',
    text:
      'Son teknoloji toz boya hatlarında standart RAL renk kodlarının yanında özel renk talepleri için de çözüm sunulur.',
    specs: [
      ['Hatlar', '2 dikey, 1 yatay'],
      ['Maks. profil boyu', '7 m'],
      ['Yıllık kapasite', '25.000 ton'],
      ['Sertifika', 'Qualicoat'],
    ],
  },
  {
    id: 'mekanik-islem',
    title: 'Mekanik işlem',
    finish: 'siyah',
    text:
      'Profiller, son kullanıcının doğrudan kullanabileceği nihai ürünlere dönüştürülür. 5 eksenli CNC sistemleriyle punch, delme, kesme, bükme ve şekillendirme yüksek hassasiyetle yapılır.',
    list: [
      'Solar çerçeve üretim makineleri',
      'CNC işleme merkezleri',
      'Lazer kesim tezgâhları',
      'Eksantrik presler',
      'Çift kafa testereler',
      'Dilimleme makineleri',
      'Bükme ve kaynak hatları',
    ],
  },
] as const;

export const catalogs = [
  { title: 'Kapı-pencere sistemi', note: 'Menteşeli kapı ve pencere profilleri' },
  { title: 'Sürme kapı-pencere sistemi', note: 'Sürme doğrama profilleri' },
  { title: 'Cephe sistemleri', note: 'Giydirme cephe profilleri' },
  { title: 'Küpeşte aksesuarları', note: 'Korkuluk ve küpeşte parçaları' },
  { title: 'Doğrama ve cam balkon aksesuarları', note: 'Tamamlayıcı aksesuarlar' },
  { title: 'EPDM fitil', note: 'Sızdırmazlık fitilleri' },
];

export const partners = [
  'Almanya',
  'Romanya',
  'Hollanda',
  'Yunanistan',
  'Ürdün',
  'Bulgaristan',
  'Fransa',
  'Çekya',
  'Litvanya',
  'Estonya',
  'Şili',
];

export const values = [
  'Etik ve sorumlu hizmet anlayışı',
  'Dürüstlük ve güvene dayalı iletişim',
  'Söz verdiğimiz zamanda teslim',
  'Maliyet-etkin çözümler',
  'Üretimde yüksek kalite standardı',
  'Hem müşteri hem çalışan memnuniyetine odaklanma',
  'Çalışan sağlığı ve iş güvenliğine öncelik',
  'Müşteri bilgilerinin ve varlıklarının gizliliğine saygı',
];

export const vision =
  'Alüminyum alanında kalite, sürdürülebilirlik ve mühendislik gücüyle tanınan öncü bir marka olmak; sektöre yön veren çözümlerle yurt içinde ve küresel pazarlarda kalıcı değer yaratmak.';

export const mission =
  'Teknolojik yenilikleri yakından izleyerek kalite, müşteri memnuniyeti ve mühendislik becerisini bir araya getiren üretim yaklaşımıyla müşterilerimize katma değer sağlamak.';
