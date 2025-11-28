import path from 'path';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import type { Db } from 'types/@types.js';

sqlite3.verbose();

export async function getContentOptions() {
  const db = await open({
    filename: path.resolve('src/db/content.sqlite'),
    driver: sqlite3.Database,
  });

  const dbMulti = await open({
    filename: path.resolve('src/db/content-multi.sqlite'),
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
    let additionalRows: string[] = [];

    for (let j = 0; j < rows.length; j++) {
      const rowCur = rows[j];

      const checkTableSql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${rowCur}'`;

      const multi = await dbMulti.get(checkTableSql);

      if (multi) {
        const multiRows = await getSqlRowsOfTable(dbMulti, rowCur);

        multiRows.forEach((multiRowCur: string) => {
          const value = `${rowCur}/${multiRowCur}`;

          additionalRows.push(value);
        });

        rows[j] = `${rowCur}__multi`;
      }
    }

    result[tableCur] = [...rows, ...additionalRows].sort();
  }

  await db.close();
  await dbMulti.close();

  return result;
}
