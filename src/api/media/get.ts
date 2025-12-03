import type { Collection, Document, WithId } from 'mongodb';
import { MongoClient } from 'mongodb';

import type { ImageFilter, Preset } from 'types';

import { getRandomType, getWidth } from 'api/media/utils.js';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

type ImageFilterSafe = Partial<ImageFilter> | undefined;

async function getPreparedFilterFromPreset(preset: string, filter: ImageFilterSafe = {}): Promise<ImageFilterSafe> {
  const db = client.db('presets');
  const collection = db.collection('presets');

  const presetInfoDocument = await collection.findOne({ id: preset }) as WithId<Document>;
  const presetInfo = presetInfoDocument as unknown as Preset;

  const randomType = getRandomType(presetInfo);

  const collections: string[] = [];
  const topics: string[] = [];

  const values = presetInfo.values[randomType];

  values.forEach((valueCur) => {
    const { collection, topic } = valueCur;

    collections.push(collection);
    topics.push(topic);
  });

  const width = getWidth({
    presetInfo,
    filter,
    randomType,
  })

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
    match.type = filter.type;
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
