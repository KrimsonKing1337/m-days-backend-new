import type { Collection, Document, WithId } from 'mongodb';
import { MongoClient } from 'mongodb';

import { getRandomInt } from 'utils/getRandomInt.js';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

type Orientation = 'h' | 'v' | 's';

type ImageFilter = {
  type: 'static' | 'dynamic';
  collection: string;
  topic: string;
  orientation: Orientation[];
  width: [number, number];
  size: [number, number];
};

type ImageFilterSafe = Partial<ImageFilter> | undefined;

async function getRandomValueFromPreset(preset: string) {
  const db = client.db('presets');
  const collection = db.collection('presets');

  const document = await collection.findOne({ id: preset }) as WithId<Document>;

  let randomType = '';

   const valuesStaticLength = document.values.static.length;
   const valuesDynamicLength = document.values.dynamic.length;

  if (valuesStaticLength && valuesDynamicLength) {
    const typeRandomInt = getRandomInt(0, 1);

    randomType = typeRandomInt === 0 ? 'dynamic' : 'static';
  } else if (valuesStaticLength) {
    randomType = 'static';
  } else if (valuesDynamicLength) {
    randomType = 'dynamic';
  }

  const values = document.values[randomType];

  const valuesRandomInt = getRandomInt(0, values.length - 1);

  return values[valuesRandomInt];
}

async function getRandomImage(collection: Collection, filter: ImageFilterSafe = {}): Promise<any | null> {
  const match: Record<string, any> = {};

  if (filter.type) {
    match.type = filter.type;
  }

  if (filter.collection) {
    match.collection = filter.collection;
  }

  if (filter.topic) {
    match.topic = filter.topic;
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

  const randomValueFromPreset = await getRandomValueFromPreset(preset);

  let randomImage = await getRandomImage(collection, {
    ...randomValueFromPreset,
    ...filter,
  });

  // если ничего не нашлось - берём рандом из дефолта
  if (!randomImage) {
    const randomValueFromPreset = await getRandomValueFromPreset('default');

    randomImage = await getRandomImage(collection, {
      ...randomValueFromPreset,
      ...filter,
    });
  }

  return randomImage;
}
