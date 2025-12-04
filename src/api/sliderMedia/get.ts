import { MongoClient, ObjectId } from 'mongodb';
import { get as mediaGet } from 'api/media/get.js';
import { SliderDoc } from 'types';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

const INTERVAL_MS = 12000;

type Result = {
  path: string;
  nextPath: string;
  id: string;
  nextId: string;
  intervalMs: number;
  serverTime: number;
  nextChangeAt: number;
};

export async function get(preset: string): Promise<Result | null> {
  const key = preset;
  const now = Date.now();

  const db = client.db('sliders');
  const collection = db.collection<SliderDoc>('sliders');

  let slider = await collection.findOne({ key });

  if (!slider) {
    // первый запуск слайдера для этого пресета
    const media = await mediaGet(preset, {});
    const nextMedia = await mediaGet(preset, {});

    if (!media || !nextMedia) return null;

    const startedAt = new Date(now);

    slider = {
      _id: new ObjectId(),
      id: key,
      key,
      intervalMs: INTERVAL_MS,
      startedAt,
      step: 0,
      mediaId: media.id,
      nextMediaId: nextMedia.id,
      mediaPath: media.path,
      nextMediaPath: nextMedia.path,
      lastTickAt: startedAt,
      active: true,
    };

    await collection.insertOne(slider);
  } else {
    const startedAtMs = slider.startedAt.getTime();
    const expectedStep = Math.floor((now - startedAtMs) / slider.intervalMs);

    if (expectedStep > slider.step) {
      // пора перейти на следующий шаг
      const currentId = slider.nextMediaId;
      const currentPath = slider.nextMediaPath;

      const nextMedia = await mediaGet(preset, {});

      if (nextMedia) {
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

  if (!slider) return null;

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
