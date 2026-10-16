import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/d4821323-b742-40cc-9525-ffce08066851';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const IMAGES = [
  {
    src: 'luna_front_1791797664521.jpg',
    out: 'luna_front.png',
    bg: 'white',
    tolerance: 30
  },
  {
    src: 'luna_run_1791797687428.jpg',
    out: 'luna_run.png',
    bg: 'black',
    tolerance: 20
  },
  {
    src: 'luna_guardian_1791797709207.jpg',
    out: 'luna_guardian.png',
    bg: 'white',
    tolerance: 30
  },
  {
    src: 'luna_dawn_1791797730046.jpg',
    out: 'luna_dawn.png',
    bg: 'white',
    tolerance: 30
  },
  {
    src: 'obs_pillar_1791797662492.jpg',
    out: 'obs_pillar.png',
    bg: 'black',
    tolerance: 20
  },
  {
    src: 'obs_arch_black_1791797702840.jpg',
    out: 'obs_arch.png',
    bg: 'black',
    tolerance: 20
  },
  {
    src: 'obs_sentinel_1791797727862.jpg',
    out: 'obs_sentinel.png',
    bg: 'black',
    tolerance: 20
  },
  {
    src: 'moon_shard_1791797749083.jpg',
    out: 'moon_shard.png',
    bg: 'black',
    tolerance: 20
  }
];

async function main() {
  console.log('Launching Chrome to process transparent PNG sprites...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const item of IMAGES) {
    const srcPath = path.join(ARTIFACT_DIR, item.src);
    const outPath = path.join(OUTPUT_DIR, item.out);

    if (!fs.existsSync(srcPath)) {
      console.warn(`File not found: ${srcPath}`);
      continue;
    }

    const base64Data = fs.readFileSync(srcPath).toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64Data}`;

    const pngBase64 = await page.evaluate(
      async (uri, bgType, tol) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            if (bgType === 'black') {
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const maxVal = Math.max(r, g, b);

                if (maxVal < tol) {
                  data[i + 3] = 0;
                } else if (maxVal < tol + 25) {
                  // Smooth alpha feathering
                  data[i + 3] = Math.round(((maxVal - tol) / 25) * 255);
                }
              }
            } else if (bgType === 'white') {
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const minVal = Math.min(r, g, b);

                if (minVal > 255 - tol) {
                  data[i + 3] = 0;
                } else if (minVal > 255 - tol - 25) {
                  data[i + 3] = Math.round(((255 - tol - minVal) / 25) * 255);
                }
              }
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png').split(',')[1]);
          };
          img.src = uri;
        });
      },
      dataUri,
      item.bg,
      item.tolerance
    );

    fs.writeFileSync(outPath, Buffer.from(pngBase64, 'base64'));
    console.log(`Processed & saved: ${outPath}`);
  }

  await browser.close();
  console.log('--- All Transparent PNG Sprites Created Successfully! ---');
}

main().catch(console.error);
