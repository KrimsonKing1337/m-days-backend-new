import path from 'path';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import type { Db } from 'types/@types.js';

sqlite3.verbose();

export async function getContentGifOptions() {
  const db = await open({
    filename: path.resolve('src/db/content-gif.sqlite'),
    driver: sqlite3.Database,
  });

  async function getSqlRowsOfTable(db: Db, tableName: string) {
    const sql = `SELECT * FROM '${tableName}'`;

    const rows = await db.all(sql);

    return rows.map((cur: any) => cur.id);
  }

  const getTableSQL = `SELECT name FROM sqlite_master WHERE type='table';`

  const tables = await db.all(getTableSQL);

  const tablesAsArr = tables.map((cur) => cur.name);

  const result: any = {};

  for (let i = 0; i < tablesAsArr.length; i++) {
    const tableCur = tablesAsArr[i];

    const rows = await getSqlRowsOfTable(db, tableCur);

    result[tableCur] = [...rows].sort();
  }

  await db.close();

  return result;
}
