// Generate transparent versions of the research illustrations during the site build.
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';

const imagesDirectory = fileURLToPath(new URL('../public/images/', import.meta.url));

export async function prepareResearchImages() {
  for (const language of ['en', 'es']) {
    const sourceName = 'spaguetti-' + language + '.png';
    const sourcePath = join(imagesDirectory, sourceName);
    const targetPath = join(imagesDirectory, 'spaguetti-' + language + '-cutout.png');
    const { data, info } = await sharp(sourcePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    if (channels !== 4) throw new Error('Unexpected image format: ' + sourceName);

    const corners = [0, width - 1, (height - 1) * width, width * height - 1];
    const corner = corners.reduce((best, i) => {
      const score = data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2];
      const previous = data[best * 4] + data[best * 4 + 1] + data[best * 4 + 2];
      return score > previous ? i : best;
    });
    const background = [...data.subarray(corner * 4, corner * 4 + 3)];
    if (Math.min(...background) < 210) {
      throw new Error('Expected a light-colored background in ' + sourceName);
    }

    // Remove the light background connected to the image border, preserving
    // enclosed white details and softly blending antialiased edges.
    const marked = new Uint8Array(width * height);
    const queue = new Uint32Array(width * height);
    let start = 0;
    let end = 0;
    const diff = (i) => {
      const off = i * 4;
      return Math.max(
        Math.abs(data[off] - background[0]),
        Math.abs(data[off + 1] - background[1]),
        Math.abs(data[off + 2] - background[2])
      );
    };
    const enqueue = (i) => {
      if (marked[i]) return;
      marked[i] = 1;
      const off = i * 4;
      const minimum = Math.min(data[off], data[off + 1], data[off + 2]);
      if (minimum < 180 || diff(i) > 78) return;
      queue[end++] = i;
    };

    for (let x = 0; x < width; x++) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }
    while (start < end) {
      const i = queue[start++];
      const offset = i * 4;
      const distance = diff(i);
      const alpha = Math.min(1, Math.max(0, (distance - 15) / 63));
      data[offset + 3] = Math.round(data[offset + 3] * alpha);
      const x = i % width;
      const y = Math.floor(i / width);
      if (x > 0) enqueue(i - 1);
      if (x + 1 < width) enqueue(i + 1);
      if (y > 0) enqueue(i - width);
      if (y + 1 < height) enqueue(i + width);
    }
    if (end === 0) throw new Error('Could not identify the white background: ' + sourceName);
    await sharp(data, { raw: { width, height, channels } })
      .png()
      .toFile(targetPath);
    console.info('Generated ' + targetPath + ' (' + end + ' background pixels processed)');
  }
}
