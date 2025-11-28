import fs from 'fs/promises';
import sharp from 'sharp';

import type { GetImagesWithLabelsAttrs } from 'types/@types.js';

import { getDate } from 'utils/getDate.js';

export async function getImageWithLabels({
  resolution,
  orientation,
  tz = '3',
  imagePath,
  justImage = false,
  noProcessing = false,
  gif = false,
}: GetImagesWithLabelsAttrs) {
  const {
    day,
    month,
    year,
    hours,
    minutes,
  } = getDate(tz);

  const timeLabel = `${hours}:${minutes}`;
  const dateLabel = `${day}.${month}.${year}`;

  let [w, h] = resolution.split('*');

  // если вертикально - меняем ширину и высоту местами
  if (orientation === 'v') {
    const tempW = w;

    w = h;
    h = tempW;
  }

  const width = Number(w);
  const height = h ? Number(h) : undefined;

  if (noProcessing) {
    return await fs.readFile(imagePath);
  }

  const image = sharp(imagePath, { animated: gif });

  const resizedImage = image
    .resize({
      width,
      height,
    })
    .png();

  const resizedImageObject = await resizedImage.toBuffer({ resolveWithObject: true });
  const metaHeight = resizedImageObject.info.height;
  const metaWidth = resizedImageObject.info.width;

  if (justImage) {
    return await resizedImage.toBuffer();
  }

  const shadow = Buffer.from(`
    <svg height="${metaHeight}" width="${metaWidth}">
      <rect x="0" y="0" width="100%" height="100%" fill="#000" fill-opacity="0.3" />
    </svg>
  `);

  const timeHeight = metaHeight / 2;

  const time = Buffer.from(`
    <svg height="${timeHeight}" width="${metaWidth}">
      <text 
        x="50%" 
        y="50%" 
        text-anchor="middle" 
        dy="0.4em" 
        font-size="${timeHeight / 2.5}" 
        fill="#fff" 
      >
        ${timeLabel}
      </text> 
    </svg>
  `);

  const dateHeight = metaHeight / 1.6;

  const date = Buffer.from(`
    <svg height="${dateHeight}" width="${metaWidth}">
      <text 
        x="50%" 
        y="50%" 
        text-anchor="middle" 
        dy="0.4em" 
        font-size="${dateHeight / 6}"
        font-stretch="ultra-condensed"
        fill="#fff" 
        >
        ${dateLabel}
      </text> 
    </svg>
  `);

  const watermarkHeight = metaHeight / 1.6;

  const watermark = Buffer.from(`
    <svg height="${watermarkHeight}" width="${metaWidth}">
      <text 
        x="90%" 
        y="90%" 
        text-anchor="middle" 
        dy="0.4em" 
        font-size="${watermarkHeight / 16}"
        font-stretch="ultra-condensed"
        fill="#fff" 
        >
        m-days.ru
      </text> 
    </svg>
  `);

  const compositeImages = [
    {
      input: shadow,
      gravity: 'center'
    },
    {
      input: time,
      gravity: 'center'
    },
    {
      input: date,
      gravity: 'south'
    },
    {
      input: watermark,
      gravity: 'southwest'
    }
  ];

  return await resizedImage.composite(compositeImages).toBuffer();
}
