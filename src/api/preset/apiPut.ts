import path from 'path';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import type { Preset } from 'types/@types.js';

sqlite3.verbose();

export async function apiPut(reqBody: Preset) {
  const {
    id,
    staticTopics,
    dynamicTopics,
    resolution,
    skin,
    formats,
    fileSize,
  } = reqBody;

  const db = await open({
    filename: path.resolve('src/db/md.sqlite'),
    driver: sqlite3.Database,
  });

  const sqlIdExists = await db.get(`SELECT * from id WHERE id = "${id}"`);

  if (sqlIdExists) {
    return false;
  }

  await db.run(`INSERT INTO id (id) VALUES ("${id}")`);

  const staticTopicsValue = staticTopics || '';
  await db.run(`INSERT INTO static_topics (id, value) VALUES ("${id}", "${staticTopicsValue}")`);

  const dynamicTopicsValue = dynamicTopics || '';
  await db.run(`INSERT INTO dynamic_topics (id, value) VALUES ("${id}", "${dynamicTopicsValue}")`);

  const resolutionValue = resolution || '';
  await db.run(`INSERT INTO resolution (id, value) VALUES ("${id}", "${resolutionValue}")`);

  const skinValue = skin || '';
  await db.run(`INSERT INTO skin (id, value) VALUES ("${id}", "${skinValue}")`);

  const formatsValue = formats || '';
  await db.run(`INSERT INTO formats (id, value) VALUES ("${id}", "${formatsValue}")`);

  const fileSizeValue = fileSize || '';
  await db.run(`INSERT INTO file_size (id, value) VALUES ("${id}", "${fileSizeValue}")`);

  await db.close();

  return true;
}
