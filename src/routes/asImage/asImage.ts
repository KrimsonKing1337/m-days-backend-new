import express from 'express';

import { type Orientation, get as mediaGet } from 'api/media/get.js';
import { get as presetGet } from 'api/preset/get.js';

import { getAttrsForRender } from 'routes/asImage/utils/utils.js';
import { generateImageWithLabels } from 'routes/asImage/utils/generateImageWithLabels.js';
import { getClosestWidth } from 'routes/asImage/utils/getClosestWidth.js';

export const asImageRouter = express.Router();

asImageRouter.get('/ai', async (req, res) => {
  const { bgImgSrc, metaRefresh } = getAttrsForRender(req.query);

  res.render('asImage', {
    bgImgSrc,
    metaRefresh,
  });
});

asImageRouter.get(/\/ai-slide?.+/, async (req, res) => {
  const query = req.query;

  const {
    tz = '3',
    o, // o = orientation
    r, // r = resolution
    p = 'default',
  } = query;

  const preset = p as string;

  const presetInfo = await presetGet(preset);

  let resolution = r as string;

  if (!r) {
    resolution = presetInfo.resolution || '1920*1080';
  }

  let orientation = o as Orientation;

  if (!o) {
    orientation = presetInfo.resolution || 'h';
  }

  const timezone = tz as string;

  const width = resolution.split('*')[0];
  const widthAsNumber = Number(width);

  const closestWidth = getClosestWidth(widthAsNumber);

  const mediaGetResult = await mediaGet(preset, {
    width: [closestWidth, closestWidth],
    orientation: [orientation],
  });

  const imagePath = `D:\\Projects\\m-days\\01. digital\\m-days-public-images\\${mediaGetResult.path}`;

  const result = await generateImageWithLabels({
    resolution,
    orientation,
    timezone,
    imagePath,
  });

  res.send(result);
});
