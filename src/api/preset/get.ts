import type { Document, WithId } from 'mongodb';
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

export async function get(preset: string) {
  const db = client.db('presets');
  const collection = db.collection('presets');

  return await collection.findOne({ id: preset }) as WithId<Document>;
}
