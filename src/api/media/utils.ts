import { get as _get } from 'lodash-es';

import type { ImageFilter, Preset } from 'types';

import { getRandomInt } from 'utils/getRandomInt.js';

export function getRandomType(presetInfo: Preset) {
  let randomType: ImageFilter['type'] = 'static';

  const valuesStaticLength = presetInfo.values.static.length;
  const valuesDynamicLength = presetInfo.values.dynamic.length;

  if (valuesStaticLength && valuesDynamicLength) {
    const typeRandomInt = getRandomInt(0, 1);

    randomType = typeRandomInt === 0 ? 'dynamic' : 'static';
  } else if (valuesStaticLength) {
    randomType = 'static';
  } else if (valuesDynamicLength) {
    randomType = 'dynamic';
  }

  return randomType;
}

export type GetWidthParams = {
  presetInfo: Preset;
  filter: Partial<ImageFilter>;
  randomType: ImageFilter['type'];
};

export function getWidth({ presetInfo, filter, randomType }: GetWidthParams) {
  const widthFromPreset = _get(presetInfo, `options.${randomType}.width`) || [1920, 1920];

  let widthFromPresetSafe = widthFromPreset;

  if (widthFromPreset.length) {
    const [min, max] = widthFromPreset;

    let minSafe = min === 'windowWidth' ? filter.windowWidth : min;
    let maxSafe = max === 'windowWidth' ? filter.windowWidth : max;

    minSafe = minSafe ?? 1920;
    maxSafe = maxSafe ?? 1920;

    widthFromPresetSafe = [minSafe as number, maxSafe as number];
  }

  const widthFromPresetSafeRightType = widthFromPresetSafe as [number, number];

  // query width -> preset width -> windowWidth
  let width = filter.width ? filter.width : widthFromPresetSafeRightType;

  if (!width) {
    width = filter.windowWidth ? [filter.windowWidth, filter.windowWidth] : [1920, 1920];
  }

  return width;
}
