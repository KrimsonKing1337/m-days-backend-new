import type { Collection, Document, WithId } from 'mongodb';
import { MongoClient } from 'mongodb';

import { get as _get } from 'lodash-es';

import type { ImageFilter } from 'types';

import { getRandomInt } from 'utils/getRandomInt.js';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

export type Orientation = 'h' | 'v' | 's';

type ImageFilterSafe = Partial<ImageFilter> | undefined;

async function getPreparedFilterFromPreset(preset: string, filter: ImageFilterSafe = {}): Promise<ImageFilterSafe> {
  const db = client.db('presets');
  const collection = db.collection('presets');

  const presetInfo = await collection.findOne({ id: preset }) as WithId<Document>;

  let randomType = 'static' as ImageFilter['type'];

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

  const collections: string[] = [];
  const topics: string[] = [];

  type Value = {
    collection: string;
    topic: string;
  };

  const values: Value[] = presetInfo.values[randomType];

  values.forEach((valueCur) => {
    const { collection, topic } = valueCur;

    collections.push(collection);
    topics.push(topic);
  });

  type WidthFromPreset = [number | string, number | string];

  const widthFromPreset: WidthFromPreset = _get(presetInfo, `options.${randomType}.width`) || [1920, 1920];

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

  // width -> preset width -> windowWidth
  let width = filter.width ? filter.width : widthFromPresetSafeRightType;

  if (!width) {
    width = filter.windowWidth ? [filter.windowWidth, filter.windowWidth] : [1920, 1920];
  }

  return {
    type: randomType,
    width,
    collection: collections,
    topic: topics,
  };
}

async function getRandomImage(collection: Collection, filter: ImageFilterSafe = {}): Promise<any | null> {
  const match: Record<string, any> = {};

  if (filter.type) {
    match.type = Array.isArray(filter.type)
      ? { $in: filter.type }
      : filter.type;
  }

  if (filter.topic) {
    match.topic = Array.isArray(filter.topic)
      ? { $in: filter.topic }
      : filter.topic;
  }

  if (filter.collection) {
    match.collection = Array.isArray(filter.collection)
      ? { $in: filter.collection }
      : filter.collection;
  }

  if (filter.topic) {
    match.topic = Array.isArray(filter.topic)
      ? { $in: filter.topic }
      : filter.topic;
  }

  if (filter.orientation && filter.orientation.length > 0) {
    match.orientation = { $in: filter.orientation };
  }

  if (filter.width) {
    const [min, max] = filter.width;

    match.width = {
      $gte: min,
      $lte: max,
    };
  }

  if (filter.size) {
    const [min, max] = filter.size;

    match.size = {
      $gte: min,
      $lte: max,
    };
  }

  const pipeline = {
    $match: match,
  };

  const options = {
    $sample: {
      size: 1
    },
  };

  const result = await collection.aggregate([pipeline, options]).toArray();

  return result[0] ?? null;
}

export async function get(preset: string, filter: ImageFilterSafe = {}) {
  const db = client.db('cache');
  const collection = db.collection('images');

  const preparedFilterFromPreset = await getPreparedFilterFromPreset(preset, filter);

  let randomImage = await getRandomImage(collection, {
    ...preparedFilterFromPreset,
    ...filter,
  });

  // если ничего не нашлось - берём рандом из дефолта
  if (!randomImage) {
    const preparedFilterFromPreset = await getPreparedFilterFromPreset('default');

    randomImage = await getRandomImage(collection, {
      ...preparedFilterFromPreset,
      ...filter,
    });
  }

  return randomImage;
}
