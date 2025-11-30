import express from 'express';

import { get } from 'api/media/get.js';

export const router = express.Router();

router.get('/api/media', async (req, res) => {
  const preset = req.query.preset as string | undefined;

  const presetSafe = preset ?? 'default';

  const media = await get(presetSafe);

  res.send(media);
});
