/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_BASE_PATH || '',
  // İstemci bileşenleri (dil bağlantıları) de aynı yolu bilsin
  env: { NEXT_BASE_PATH: process.env.NEXT_BASE_PATH || '' },
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
