import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// SVG 템플릿 (브랜드 색상 사용)
const createIconSvg = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0; // maskable은 10% 패딩
  const innerSize = size - (padding * 2);
  const fontSize = Math.round(innerSize * 0.15);
  const centerX = size / 2;
  const centerY = size / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#4F46E5"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#gradient)"/>
  <text x="${centerX}" y="${centerY - fontSize * 0.8}" font-family="Arial, sans-serif" font-size="${fontSize * 1.2}" font-weight="bold" fill="white" text-anchor="middle">My</text>
  <text x="${centerX}" y="${centerY + fontSize * 0.3}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">Study</text>
  <text x="${centerX}" y="${centerY + fontSize * 1.3}" font-family="Arial, sans-serif" font-size="${fontSize * 0.8}" font-weight="bold" fill="white" text-anchor="middle">SNS</text>
</svg>`;
};

async function generateIcons() {
  console.log('Generating PWA icons...');

  // 아이콘 설정
  const icons = [
    { name: 'icon-192x192.png', size: 192, maskable: false },
    { name: 'icon-512x512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192x192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];

  for (const icon of icons) {
    const svg = createIconSvg(icon.size, icon.maskable);
    const outputPath = join(iconsDir, icon.name);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`Created: ${icon.name}`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
