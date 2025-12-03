import express from 'express';

import { get as mediaGet } from 'api/media/get.js';
import { get as presetGet } from 'api/preset/get.js';

import { getFilterFromQuery } from './utils.js';

export const router = express.Router();

router.get('/api/media', async (req, res) => {
  const preset = req.query.preset as string | null | undefined;
  const presetSafe = preset ?? 'default';

  const filter = getFilterFromQuery(req.query);

  const result = await mediaGet(presetSafe, filter);

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
