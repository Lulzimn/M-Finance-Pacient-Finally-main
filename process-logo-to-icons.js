#!/usr/bin/env node

/**
 * Process M-Dental Logo to PWA Icons
 * Generates all 4 required icon sizes from a source image
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  try {
    console.log('🎨 Processing M-Dental logo to PWA icons...\n');

    const publicDir = path.join(__dirname, 'frontend', 'public');
    const logoPath = process.argv[2] || path.join(__dirname, 'mdental-logo.png');

    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Logo file not found: ${logoPath}`);
      process.exit(1);
    }

    console.log(`📷 Source: ${logoPath}`);
    console.log(`📁 Destination: ${publicDir}\n`);

    // Generate icon-192.png
    console.log('⏳ Generating icon-192.png...');
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ icon-192.png created');

    // Generate icon-512.png
    console.log('⏳ Generating icon-512.png...');
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ icon-512.png created');

    // Generate icon-192-maskable.png (for Android adaptive icons)
    console.log('⏳ Generating icon-192-maskable.png...');
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(publicDir, 'icon-192-maskable.png'));
    console.log('✅ icon-192-maskable.png created');

    // Generate icon-512-maskable.png
    console.log('⏳ Generating icon-512-maskable.png...');
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(publicDir, 'icon-512-maskable.png'));
    console.log('✅ icon-512-maskable.png created');

    console.log('\n========================================');
    console.log('✅ All icons generated successfully!');
    console.log('========================================\n');
    console.log('Files created:');
    console.log('  ✅ frontend/public/icon-192.png');
    console.log('  ✅ frontend/public/icon-512.png');
    console.log('  ✅ frontend/public/icon-192-maskable.png');
    console.log('  ✅ frontend/public/icon-512-maskable.png\n');
    console.log('🧪 Test locally:');
    console.log('   cd frontend && npm start\n');
    console.log('📱 Install on device:');
    console.log('   iOS: Safari → Share → "Add to Home Screen"');
    console.log('   Android: Chrome → Menu → "Install app"\n');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
