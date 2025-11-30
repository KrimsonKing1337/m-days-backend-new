import express from 'express';

import { get as mediaGet } from 'api/media/get.js';
import { get as presetGet } from 'api/preset/get.js';

export const router = express.Router();

router.get('/api/media', async (req, res) => {
  const preset = req.query.preset as string | undefined;
  const width = req.query.width as string | undefined;

  const presetSafe = preset ?? 'default';
  const widthSafe = width ? Number(width) : 1920;

  const result = await mediaGet(presetSafe, { width: [widthSafe, widthSafe] });

  res.send(result);
});

router.get('/api/preset', async (req, res) => {
  const preset = req.query.preset as string | undefined;

  const presetSafe = preset ?? 'default';

  const result = await presetGet(presetSafe);

  res.send(result);
});
