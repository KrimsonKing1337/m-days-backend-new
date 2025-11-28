import express from 'express';

import { apiGet } from 'api/preset/apiGet.js';

export const router = express.Router();

router.get('/api/media', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    res.sendStatus(500);

    return;
  }

  const sqlResult = await apiGet(id as string);

  res.send(sqlResult);
});
