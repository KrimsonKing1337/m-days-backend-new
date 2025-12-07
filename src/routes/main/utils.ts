import type { Request } from 'express';

import type { ImageFilter } from 'types';

import { getClosestWidth } from 'utils/getClosestWidth.js';

/*
  * Берём из запроса ширину, высоту из адресной строки и ширину с высотой окна.
  *
  * Если ширина окна не была передана - то считаем, что она равна 1920.
  * Если высота окна не была передана - то считаем, что она равна 1080.
  * Они с фронта всегда передаются, это перестраховка.
  *
  * Если высота из адресной строки не была передана - то берём значение из высоты окна.
  * Если ширина из адресной строки не была передана - то берём значение из ширины окна.
  *
  * Далее, получаем из ширины для обоих случаев ближайшую стандартизированную ширину (720, 1280, 1920, etc).
  * В фильтр записываем стандартизированные высоту и ширину окна.
  * В фильтр записываем стандартизированные высоту и ширину из адресной строки, только если они были переданы.
  *
  * Высоту я не обрабатываю, пока не знаю нужна ли она вообще. Но на всякий случай заложил
*/

export function getFilterFromQuery(query: Request['query']) {
  const width = query.width as string | null | undefined;
  const height = query.height as string | null | undefined;
  const windowWidth = query.windowWidth as string;
  const windowHeight = query.windowHeight as string;

  const windowWidthSafe = windowWidth ? Number(windowWidth): 1920;
  const windowHeightSafe = windowHeight ? Number(windowHeight): 1080;
  const dimensionForClosestWidth = windowWidthSafe > windowHeightSafe ? windowWidthSafe : windowHeightSafe;

  const closestWindowWidth = getClosestWidth(dimensionForClosestWidth);

  const filter: Partial<ImageFilter> = {
    windowWidth: closestWindowWidth,
    windowHeight: windowHeightSafe,
  };

  if (width) {
    const widthSafe = Number(width);
    // Если ширина в адресной строке больше, чем ширина окна - closestWidth делаем из ширины окна
    const widthLimited = widthSafe > windowWidthSafe ? windowHeightSafe : widthSafe;
    const closestWidth = getClosestWidth(widthLimited);

    filter.width = [closestWidth, closestWidth];
  }

  if (height) {
    const heightSafe = Number(height);

    filter.height = [heightSafe, heightSafe];
  }

  return filter;
}
