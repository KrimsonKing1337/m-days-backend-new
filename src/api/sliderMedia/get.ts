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

let media2: Media;

export async function get(preset: string): Promise<Result | null> {
  const key = preset;
  const now = Date.now();

  const db = client.db('sliders');
  const collection = db.collection('sliders');

  let slider = await collection.findOne({ key });

  // 1) если слайдер ещё не создан – создаём
  if (!slider) {
    const media = await mediaGet(preset, {});
    media2 = await mediaGet(preset, {});

    const startedAt = new Date(now);

    const doc: SliderDoc = {
      _id: new ObjectId(),
      id: key,
      key,
      intervalMs: INTERVAL_MS,
      startedAt,
      step: 0,
      mediaId: media.id,
      nextMediaId: media2.id,
      mediaPath: media.path,
      nextMediaPath: media2.path,
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
      const media = await mediaGet(preset, {});
      media2 = media2 ?? await mediaGet(preset, {});

      if (media2 && media) {
        await collection.updateOne(
          { _id: slider._id },
          {
            $set: {
              mediaId: media2.id,
              nextMediaId: media.id,
              mediaPath: media2.path,
              nextMediaPath: media.path,
              step: expectedStep,
              lastTickAt: new Date(now),
            },
          },
        );

        slider.mediaId = media2.id;
        slider.nextMediaId = media.id;
        slider.mediaPath = media2.path;
        slider.nextMediaPath = media.path;
        slider.step = expectedStep;
        slider.lastTickAt = new Date(now);

        media2 = { ...media };
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
