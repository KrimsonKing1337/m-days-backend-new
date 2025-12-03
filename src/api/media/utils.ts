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

/*
  * Получаем ширину для фильтра.
  * Здесь приоритеты такие:
  * ширина, переданная в адресной строке -> ширина из пресета -> ширина окна -> дефолтное значение (1920).
  * Ширина окна всегда передаётся, так что последнее - это перестраховка.
  *
  * Далее получаем ширину из пресета - она находится в options.static.width или options.dynamic.width.
  * У неё может быть [number, number] или 'windowWidth' или 'all' вместо одного из number.
  * Если ширина в пресете указана - преобразуем строку 'windowWidth' в значение переданной ширины окна,
  * если требуется. Иначе записываем как есть.
  * Если вдруг какое-то значение в массиве не указано - ставим дефолтное значение (1920).
  * Но это перестраховка. При импорте пресета в бд, zod по схеме проверяет - там такого быть не может.
  * Если ширина в пресете не указана - используем дефолтное значение (1920).
  * Далее - если в фильтре есть ширина (указанная в адресной строке) - используем её,
  * иначе подготовленное значение ширины из пресета.
  * Если нет ни того, ни другого - берём значение из ширины окна из фильтра.
  * Если и его нет - то используем дефолтное значение. Но это перестраховка.
  *
  * 'all' пока не используется. Подразумевается, что это вообще все ширины (любая ширина).
*/

export function getWidth({ presetInfo, filter, randomType }: GetWidthParams) {
  const widthFromPreset = _get(presetInfo, `options.${randomType}.width`) || [];

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

  let width = filter.width ? filter.width : widthFromPresetSafeRightType;

  if (!width.length) {
    width = filter.windowWidth ? [filter.windowWidth, filter.windowWidth] : [1920, 1920];
  }

  return width;
}
