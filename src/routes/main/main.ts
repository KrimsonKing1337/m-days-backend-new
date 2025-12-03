import express from 'express';

import type { ImageFilter } from 'types';

import { get as mediaGet } from 'api/media/get.js';
import { get as presetGet } from 'api/preset/get.js';
import { getClosestWidth } from 'utils/getClosestWidth.js';

export const router = express.Router();

router.get('/api/media', async (req, res) => {
  const preset = req.query.preset as string | null | undefined;
  const width = req.query.width as string | null | undefined;
  const height = req.query.height as string | null | undefined;
  const windowWidth = req.query.windowWidth as string;
  const windowHeight = req.query.windowHeight as string;

  const presetSafe = preset ?? 'default';
  const windowWidthSafe = windowWidth ? Number(windowWidth): 1920;
  const windowHeightSafe = windowHeight ? Number(windowHeight): 1080;
  const heightSafe = height ? Number(height) : windowHeightSafe;
  const widthSafe = width ? Number(width) : windowWidthSafe;
  const closestWidth = getClosestWidth(widthSafe);
  const closestWindowWidth = getClosestWidth(windowWidthSafe);

  const filter: Partial<ImageFilter> = {
    windowWidth: closestWindowWidth,
    windowHeight: windowHeightSafe,
  };

  if (width) {
    filter.width = [closestWidth, closestWidth];
  }

  if (height) {
    filter.height = [heightSafe, heightSafe];
  }

  const result = await mediaGet(presetSafe, filter);

  res.send(result);
});

router.get('/api/preset', async (req, res) => {
  const preset = req.query.preset as string | undefined;

  const presetSafe = preset ?? 'default';

  const result = await presetGet(presetSafe);

  res.send(result);
});
