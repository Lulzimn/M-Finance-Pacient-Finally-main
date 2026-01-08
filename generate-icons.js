#!/usr/bin/env node

/**
 * M-Dental PWA Icon Generator
 * 
 * This script generates all required PWA icons from a source image
 * or creates simple M-Dental branded icons from scratch
 * 
 * Usage:
 *   node generate-icons.js [source-image.png]
 * 
 * If no image provided, creates simple icons with "M" and blue background
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise show instructions
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.log(`
⚠️  Sharp library not found. 

To use this script, install sharp first:
  npm install --save-dev sharp

Or manually create icons:
  1. Go to https://favicon.io/favicon-generator/
  2. Create 512x512 icon with "M" and blue background (#2563eb)
  3. Download and save as:
     - frontend/public/icon-192.png
     - frontend/public/icon-512.png
     - frontend/public/icon-192-maskable.png
     - frontend/public/icon-512-maskable.png

Then run:
  npm start
  And test in browser: https://localhost:3000
`);
  process.exit(1);
}

const publicDir = path.join(__dirname, 'frontend', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * Create a simple M-Dental icon using SVG
 */
const createSimpleIcon = async (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0;
  const bgColor = maskable ? 'transparent' : '#2563eb';
  const circleR = maskable ? size * 0.4 : size * 0.5;
  const fontSize = size * 0.6;
  
  const svg = `
    <svg 
      width="${size}" 
      height="${size}" 
      viewBox="0 0 ${size} ${size}" 
      xmlns="http://www.w3.org/2000/svg"
      style="background-color: ${bgColor}"
    >
      ${maskable ? `<circle cx="${size/2}" cy="${size/2}" r="${size * 0.45}" fill="white"/>` : ''}
      <circle 
        cx="${size/2}" 
        cy="${size/2}" 
        r="${circleR}" 
        fill="${maskable ? '#2563eb' : '#ffffff'}"
      />
      <text 
        x="${size/2}" 
        y="${size/2 + fontSize * 0.25}" 
        font-size="${fontSize}" 
        font-weight="900" 
        font-family="Arial, sans-serif" 
        fill="${maskable ? '#ffffff' : '#2563eb'}" 
        text-anchor="middle"
        dominant-baseline="central"
      >M</text>
    </svg>
  `;
  
  const filename = maskable 
    ? `icon-${size}-maskable.png`
    : `icon-${size}.png`;
  
  const filepath = path.join(publicDir, filename);
  
  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filepath);
    
    console.log(`✓ Generated ${filename} (${size}x${size}px${maskable ? ', maskable' : ''})`);
    return true;
  } catch (err) {
    console.error(`✗ Failed to generate ${filename}:`, err.message);
    return false;
  }
};

/**
 * Resize an existing image
 */
const resizeImage = async (sourcePath, size, maskable = false) => {
  const filename = maskable 
    ? `icon-${size}-maskable.png`
    : `icon-${size}.png`;
  
  const filepath = path.join(publicDir, filename);
  
  try {
    const transform = sharp(sourcePath);
    
    // Resize to square
    await transform
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toFile(filepath);
    
    console.log(`✓ Generated ${filename} from source image`);
    return true;
  } catch (err) {
    console.error(`✗ Failed to generate ${filename}:`, err.message);
    return false;
  }
};

/**
 * Main function
 */
const main = async () => {
  console.log('🎨 M-Dental PWA Icon Generator\n');
  
  const sourceImage = process.argv[2];
  
  if (sourceImage && fs.existsSync(sourceImage)) {
    console.log(`📦 Using source image: ${sourceImage}\n`);
    
    const results = [
      await resizeImage(sourceImage, 192, false),
      await resizeImage(sourceImage, 192, true),
      await resizeImage(sourceImage, 512, false),
      await resizeImage(sourceImage, 512, true),
    ];
    
    if (results.every(r => r)) {
      console.log('\n✅ All icons generated successfully!');
      console.log('\n📁 Files created in: frontend/public/');
    } else {
      console.log('\n⚠️  Some icons failed to generate');
      process.exit(1);
    }
  } else {
    console.log('📝 Creating simple M-Dental branded icons...\n');
    
    const results = [
      await createSimpleIcon(192, false),
      await createSimpleIcon(192, true),
      await createSimpleIcon(512, false),
      await createSimpleIcon(512, true),
    ];
    
    if (results.every(r => r)) {
      console.log('\n✅ All icons generated successfully!');
      console.log('\n📁 Files created in: frontend/public/');
      console.log('\n🧪 Test locally:');
      console.log('   cd frontend');
      console.log('   npm start');
      console.log('   Open http://localhost:3000');
    } else {
      console.log('\n⚠️  Some icons failed to generate');
      process.exit(1);
    }
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Start dev server: npm start');
  console.log('   2. Open DevTools > Application > Manifest');
  console.log('   3. Verify icons load without 404 errors');
  console.log('   4. Test on device (iOS Safari or Android Chrome)');
  console.log('   5. Deploy to Vercel when ready');
};

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
