import { MongoClient, ObjectId } from 'mongodb';
import { get as mediaGet } from 'api/media/get.js';
import { SliderDoc } from 'types';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

const db = client.db('sliders');

// удаляем слайдер, если не было обращений в течение часа
db.collection('sliders').createIndex(
  { lastAccessAt: 1 },
  { expireAfterSeconds: 3600 }
);

type Result = {
  path: string;
  nextPath: string;
  id: string;
  nextId: string;
  intervalMs: number;
  serverTime: number;
  nextChangeAt: number;
};

const INTERVAL_MS = 12000; // раз в 12 секунд смена слайда
const TICK_INTERVAL_MS = 1000; // раз в секунду проверяем

async function tickSliders() {
  const db = client.db('sliders');
  const collection = db.collection<SliderDoc>('sliders');

  const now = Date.now();
  const sliders = await collection.find({ active: true }).toArray();

  for (const slider of sliders) {
    const startedAtMs = slider.startedAt.getTime();
    const expectedStep = Math.floor((now - startedAtMs) / slider.intervalMs);

    if (expectedStep > slider.step) {
      // пора перейти вперёд
      const preset = slider.key; // key = preset

      // текущим становится previous nextMedia
      const currentId = slider.nextMediaId;
      const currentPath = slider.nextMediaPath;

      const nextMedia = await mediaGet(preset, {});

      if (!nextMedia) {
        continue;
      }

      slider.mediaId = currentId;
      slider.mediaPath = currentPath;
      slider.nextMediaId = nextMedia.id;
      slider.nextMediaPath = nextMedia.path;
      slider.step = expectedStep;
      slider.lastTickAt = new Date(now);

      await collection.updateOne(
        { _id: slider._id },
        {
          $set: {
            mediaId: slider.mediaId,
            mediaPath: slider.mediaPath,
            nextMediaId: slider.nextMediaId,
            nextMediaPath: slider.nextMediaPath,
            step: slider.step,
            lastTickAt: slider.lastTickAt,
          },
        },
      );
    }
  }
}

setInterval(() => {
  tickSliders().catch(console.error);
}, TICK_INTERVAL_MS);

export async function get(preset: string): Promise<Result | null> {
  const key = preset;
  const now = Date.now();
  const nowDate = new Date(now);

  const db = client.db('sliders');
  const collection = db.collection<SliderDoc>('sliders');

  let slider = await collection.findOne({ key });

  if (!slider) {
    // первый запуск — создаём сразу media и nextMedia
    const media = await mediaGet(preset, {});
    const nextMedia = await mediaGet(preset, {});

    if (!media || !nextMedia) return null;

    const startedAt = nowDate;

    slider = {
      _id: new ObjectId(),
      id: key,
      key,
      intervalMs: INTERVAL_MS,
      startedAt,
      step: 0,
      mediaId: media.id,
      mediaPath: media.path,
      nextMediaId: nextMedia.id,
      nextMediaPath: nextMedia.path,
      lastTickAt: startedAt,
      lastAccessAt: startedAt,
      active: true,
    };

    await collection.insertOne(slider);
  } else {
    // тут просто обновляем lastAccessAt при каждом обращении
    slider.lastAccessAt = nowDate;

    await collection.updateOne(
      { _id: slider._id },
      {
        $set: {
          lastAccessAt: nowDate,
        },
      },
    );
  }

  const startedAtMs = slider.startedAt.getTime();
  const nextChangeAt = startedAtMs + (slider.step + 1) * slider.intervalMs;

  return {
    path: slider.mediaPath,
    nextPath: slider.nextMediaPath,
    id: slider.mediaId,
    nextId: slider.nextMediaId,
    intervalMs: slider.intervalMs,
    serverTime: now,
    nextChangeAt,
  };
}
