const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Blue gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#1e40af');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // White "SC" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SC', size / 2, size / 2);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(__dirname, 'public', 'icons', `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Created ${filename}`);
});

console.log('\n🎉 All icons generated successfully!');
