import { MongoClient, ObjectId } from 'mongodb';

import { get as mediaGet } from 'api/media/get.js';
import { Media, SliderDoc } from 'types';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

const INTERVAL_MS = 12000;

type Result = {
  path: string;
  id: string;
  intervalMs: number;
  serverTime: number;
  nextChangeAt: number;
};

export async function get(preset: string): Promise<Result | null> {
  const key = preset;
  const now = Date.now();

  const db = client.db('sliders');
  const collection = db.collection('sliders');

  let slider = await collection.findOne({ key });

  // 1) если слайдер ещё не создан – создаём
  if (!slider) {
    const startedAt = new Date(now);
    const media = await mediaGet(preset, {});

    const doc: SliderDoc = {
      _id: new ObjectId(),
      id: key,
      key,
      intervalMs: INTERVAL_MS,
      startedAt,
      step: 0,
      currentImagePath: media.path,
      currentImageId: media.id,
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
      const media: Media = await mediaGet(preset, {});

      if (media) {
        await collection.updateOne(
          { _id: slider._id },
          {
            $set: {
              currentImagePath: media.path,
              currentImageId: media.id,
              step: expectedStep,
              lastTickAt: new Date(now),
            },
          },
        );

        slider.currentImagePath = media.path;
        slider.currentImageId = media.id;
        slider.step = expectedStep;
        slider.lastTickAt = new Date(now);
      }
    }
  }

  if (slider) {
    const startedAtMs = slider.startedAt.getTime();
    const nextChangeAt = startedAtMs + (slider.step + 1) * slider.intervalMs;

    return {
      path: slider.currentImagePath,
      id: slider.currentImageId,
      intervalMs: slider.intervalMs,
      serverTime: now,
      nextChangeAt,
    };
  }

  return null;
}
