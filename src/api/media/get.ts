import { Collection, MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

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

async function getRandomImage(collection: Collection<Document>, filter: ImageFilterSafe = {}): Promise<any | null> {
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

export async function get() {
  await client.connect();

  const db = client.db('cache');
  const collection = db.collection('images');

  return getRandomImage(collection);
}
