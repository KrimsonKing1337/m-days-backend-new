import fs from 'fs/promises';
import express from 'express';
import path from 'path';

import type { ImageJson } from 'm-days-core/@types.js';
import { getRandomImageInfo } from 'm-days-core/utils/getRandomImageInfo/getRandomImageInfo.js';

import type { GetImagesWithLabelsAttrs, Preset } from 'types/@types.js';

import { apiGet } from 'api/preset/apiGet.js';

import {
  getAttrsForRender,
  getImageWithLabels,

  pathToImages,
  pathToJson,
} from './utils/index.js';

export const uRouter = express.Router();

/*
* генерируем страницу, которая в себе имеет <img /> с нужным url.
* браузер видит <img /> и делает get-запрос на u-bg,
* который в свою очередь возвращает новое сгенерированное изображение.
* оно в себе имеет сразу и дату / время, вотермарку и бэкграунд
*/

// l = legacy
uRouter.get('/l', async (req, res) => {
  const { bgImgSrc, metaRefresh } = getAttrsForRender(req.query);

  res.render('legacy', {
    bgImgSrc,
    metaRefresh,
  });
});

uRouter.get(/\/l-bg?.+/, async (req, res) => {
  const query = req.query;

  const {
    tz = '3',
    o = 'h', // o = orientation
    r, // r = resolution
    preset = 'default',
    af = false, // af = as file
  } = query;

  const imgJsonData = await fs.readFile(pathToJson);
  const imgJsonDataAsObj = JSON.parse(imgJsonData.toString());

  const presetInfo: Preset = await apiGet(preset as string);

  presetInfo.orientation = o as string;

  const randomImageInfo = getRandomImageInfo(presetInfo, imgJsonDataAsObj) as ImageJson;
  const imagePath = path.join(pathToImages, randomImageInfo.path);

  const resolution = r ? r : presetInfo.resolution;

  const optionsForImageWithLabels: GetImagesWithLabelsAttrs = {
    tz: tz as string,
    resolution: resolution as string,
    orientation: o as string,
    imagePath,
  };

  const imageWithLabels = await getImageWithLabels(optionsForImageWithLabels);

  // забыл для чего нужна опция as file
  if (af) {
    res.send(`/${randomImageInfo}`);

    return;
  }

  res.send(imageWithLabels);
});
