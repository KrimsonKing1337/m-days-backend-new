import express from 'express';

import type { Media } from 'types';

import { get as mediaGet } from 'api/media/get.js';
import { get as getMediaSync } from 'api/mediaSync/get.js';
import { get as presetGet } from 'api/preset/get.js';

import { getFilterFromQuery } from './utils.js';

export const router = express.Router();

router.get('/api/media', async (req, res) => {
  const preset = req.query.preset as string | null | undefined;
  const presetSafe = preset ?? 'default';

  const filter = getFilterFromQuery(req.query);

  const result: Media = await mediaGet(presetSafe, filter);

  res.send(result);
});

router.get('/api/media-sync', async (req, res) => {
  const preset = req.query.preset as string | null | undefined;
  const syncId = req.query.sync as string | null | undefined;

  const presetSafe = preset ?? 'default';

  if (!syncId) {
    res.status(400).send('Sync id was not provided');

    return;
  }

  const filter = getFilterFromQuery(req.query);

  const result = await getMediaSync(syncId, presetSafe, filter);

  res.send(result);
});

router.get('/api/preset', async (req, res) => {
  const preset = req.query.preset as string | undefined;
  const presetSafe = preset ?? 'default';

  let result = await presetGet(presetSafe);

  // Если пресета нет - возвращаем данные по дефолтному
  if (!result) {
    await presetGet('default');
  }

  res.send(result);
});
