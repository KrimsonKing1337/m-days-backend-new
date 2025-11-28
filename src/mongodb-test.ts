import fs from 'fs/promises';
import path from 'path';

import { Collection, MongoClient } from 'mongodb';
import { z, ZodError, ZodObject } from 'zod/v4';

import { writeLog } from './logger.js';

const uri = 'mongodb://localhost:27017';

const dbName = 'cache';

const collectionName = 'images';
const tempCollectionName = 'images_temp';
const oldCollectionName = 'images_old';

const ImageSchema = z.object({
  id: z.string().nonempty(),
  type: z.enum(['dynamic', 'static']),
  collection: z.string().nonempty(),
  topic: z.string().nonempty(),
  orientation: z.enum(['h', 'v', 's']),
  width: z.number().positive(),
  filename: z.string().nonempty(),
  path: z.string().nonempty(),
  size: z.number().positive(),
});

type Image = z.infer<typeof ImageSchema>;

type ImageInvalidField = {
  item: Image,
  errors: ZodError,
};

const PresetValuesSchema = z.object({
  dynamic: z.array(z.string()),
  static: z.array(z.string()),
});

const PresetSchema = z.object({
  id: z.string().nonempty(),
  values: PresetValuesSchema,
});

type Preset = z.infer<typeof PresetSchema>;

type PresetInvalidField = {
  item: Preset,
  errors: ZodError,
};

const chunksDir = 'D:/Projects/m-days/01. digital/m-days-core/scripts/prepareImages/test';
const presetJson = 'D:/Projects/m-days/01. digital/m-days-backend/src/presets.json';

const client = new MongoClient(uri);

type ValidateArgs = {
  Schema: ZodObject<any>;
  data: any[];
  fileName?: string;
  withLog?: boolean;
};

type InvalidField = ImageInvalidField | PresetInvalidField;

async function validate({ Schema, data, fileName = '', withLog = false }: ValidateArgs) {
  const invalidFields: InvalidField[] = [];

  for (const dataField of data) {
    const result = Schema.safeParse(dataField);

    if (!result.success) {
      invalidFields.push({
        item: dataField,
        errors: result.error,
      });
    }
  }

  const isInvalid = invalidFields.length > 0;

  if (isInvalid && withLog) {
    for (const fieldCur of invalidFields) {
      console.log(`There is an error in a field: ${fieldCur.item.id}, skipping...`);

      const prettyError = z.prettifyError(fieldCur.errors);

      await writeLog({
        type: 'error',
        message: `file: ${fileName},\nfield id: ${fieldCur.item.id},\nerrors:\n${prettyError}`,
      });
    }
  }

  return isInvalid;
}

async function updatePresets() {
  try {
    await client.connect();

    const db = client.db('presets');
    const collection = db.collection('presets');

    const content = await fs.readFile(presetJson, 'utf8');

    const data = JSON.parse(content);

    const isInvalid = await validate({
      Schema: PresetSchema,
      data,
      fileName: presetJson,
      withLog: true,
    });

    if (isInvalid) {
      return;
    }

    await db.collection('presets').drop();
    await collection.insertMany(data);
  } catch (err) {
    console.error('There is an error while importing:', err);

    process.exit(1);
  }

  await client.close();
}

async function updateRecords() {
  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(tempCollectionName);

    const filesAsync = await fs.readdir(chunksDir);

    const files = filesAsync
      .filter(file => file.endsWith('.json'))
      .sort(); // по алфавиту - чтобы загружались по порядку

    for (const file of files) {
      const fullPath = path.join(chunksDir, file);

      const content = await fs.readFile(fullPath, 'utf8');

      const data: Image[] = JSON.parse(content);

      const isInvalid = await validate({
        Schema: ImageSchema,
        data,
        fileName: file,
        withLog: true,
      });

      if (isInvalid) {
        continue;
      }

      console.log(`Importing ${file} (${data.length} records)...`);

      if (data.length > 0) {
        await collection.insertMany(data);
      }
    }

    await db.collection(collectionName).rename(oldCollectionName, { dropTarget: true }); // удалить, если уже есть
    await db.collection(tempCollectionName).rename(collectionName);
    await db.collection(oldCollectionName).drop();

    console.log('Done!');
  } catch (err) {
    console.error('There is an error while importing:', err);

    process.exit(1);
  }

  await client.close();
}

// updateRecords();

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

async function getTestRandomImages() {
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const image1 = await getRandomImage(collection, {
    type: 'static',
    collection: 'anime',
    width: [1920, 1920],
    orientation: ['h']
  });

  const image2 = await getRandomImage(collection, {
    type: 'static',
    width: [1280, 1920],
  });

  const image3 = await getRandomImage(collection, {
    size: [0, 5000],
  });

  const image4 = await getRandomImage(collection);

  const image5 = await getRandomImage(collection, {
    type: 'dynamic',
  });

  await client.close();

  console.log('___image 1', image1);
  console.log('___image 2', image2);
  console.log('___image 3', image3);
  console.log('___image 4', image4);
  console.log('___image 5', image5);
}

// getTestRandomImages();

updatePresets();
