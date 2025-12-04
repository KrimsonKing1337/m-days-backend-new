import { MongoClient, ObjectId } from 'mongodb';

import { get as mediaGet } from 'api/media/get.js';
import { Media, SliderDoc } from 'types';

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

let nextMedia: Media;

export async function get(preset: string): Promise<Result | null> {
  const key = preset;
  const now = Date.now();

  const db = client.db('sliders');
  const collection = db.collection('sliders');

  let slider = await collection.findOne({ key });

  // 1) если слайдер ещё не создан – создаём
  if (!slider) {
    const media = await mediaGet(preset, {});
    nextMedia = await mediaGet(preset, {});

    const startedAt = new Date(now);

    const doc: SliderDoc = {
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

    await collection.insertOne(doc);

    slider = doc;
  } else {
    // 2) слайдер есть – проверяем, не пора ли шагнуть вперёд
    const startedAtMs = slider.startedAt.getTime();
    const expectedStep = Math.floor((now - startedAtMs) / slider.intervalMs);

    if (expectedStep > slider.step) {
      // шаг изменился -> берём новое рандомное изображение
      const newMedia = await mediaGet(preset, {});
      nextMedia = nextMedia ?? await mediaGet(preset, {});

      if (nextMedia && newMedia) {
        await collection.updateOne(
          { _id: slider._id },
          {
            $set: {
              mediaId: nextMedia.id,
              nextMediaId: newMedia.id,
              mediaPath: nextMedia.path,
              nextMediaPath: newMedia.path,
              step: expectedStep,
              lastTickAt: new Date(now),
            },
          },
        );

        slider.mediaId = nextMedia.id;
        slider.nextMediaId = newMedia.id;
        slider.mediaPath = nextMedia.path;
        slider.nextMediaPath = newMedia.path;
        slider.step = expectedStep;
        slider.lastTickAt = new Date(now);

        nextMedia = { ...newMedia };
      }
    }
  }

  if (slider) {
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

  return null;
}
