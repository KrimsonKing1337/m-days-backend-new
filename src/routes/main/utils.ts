import type { Request } from 'express';

import type { ImageFilter } from 'types';

import { getClosestWidth } from 'utils/getClosestWidth.js';

export function getFilterFromQuery(query: Request['query']) {
  const preset = query.preset as string | null | undefined;
  const width = query.width as string | null | undefined;
  const height = query.height as string | null | undefined;
  const windowWidth = query.windowWidth as string;
  const windowHeight = query.windowHeight as string;

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

  return filter;
}
