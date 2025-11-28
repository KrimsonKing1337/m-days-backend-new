import path from 'path';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import type { Preset } from 'types';

sqlite3.verbose();

export async function apiGet(id: string) {
  const db = await open({
    filename: path.resolve('src/db/md.sqlite'),
    driver: sqlite3.Database,
  });

  const result: Preset = {
    staticTopics: '',
    dynamicTopics: '',
    formats: '',
    resolution: '',
    skin: '',
    fileSize: '',
  };

  const sqlIdExists = await db.get(`SELECT * from id WHERE id = "${id}"`);

  let safeId = id;

  if (!sqlIdExists) {
    safeId = 'default';
  }

  const sqlStaticTopics = `SELECT * FROM static_topics WHERE static_topics.id = "${safeId}"`;
  const staticTopics = await db.get(sqlStaticTopics);

  result.staticTopics = staticTopics.value || '';

  const sqlDynamicTopics = `SELECT * FROM dynamic_topics WHERE dynamic_topics.id = "${safeId}"`;
  const dynamicTopics = await db.get(sqlDynamicTopics);
  result.dynamicTopics = dynamicTopics.value || '';

  const sqlFormats = `SELECT * FROM formats WHERE formats.id = "${safeId}"`;
  const formats = await db.get(sqlFormats);
  result.formats = formats.value || '';

  const sqlResolution = `SELECT * FROM resolution WHERE resolution.id = "${safeId}"`;
  const resolution = await db.get(sqlResolution);
  result.resolution = resolution.value || '';

  const sqlSkin = `SELECT * FROM skin WHERE skin.id = "${safeId}"`;
  const skin = await db.get(sqlSkin);
  result.skin = skin.value || '';

  const sqlFileSize = `SELECT * FROM file_size WHERE file_size.id = "${safeId}"`;
  const fileSize = await db.get(sqlFileSize);
  result.fileSize = fileSize?.value || '';

  await db.close();

  return result;
}
