import express from 'express';

import { get } from 'api/media/get.js';

export const router = express.Router();

router.get('/api/media', async (_req, res) => {
  const image = await get();

  res.send(image);
});
