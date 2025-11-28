import path from 'path';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

sqlite3.verbose();

export async function apiDelete(id: string) {
  const db = await open({
    filename: path.resolve('src/db/md.sqlite'),
    driver: sqlite3.Database,
  });

  async function deleteSql(tableName: string, id: string) {
    const sql = `DELETE FROM ${tableName} WHERE id = '${id}'`;

    return await db.run(sql);
  }

  const getTableSQL = `SELECT name FROM sqlite_master WHERE type='table';`

  const tables = await db.all(getTableSQL);

  const tablesAsArr = tables.map((cur) => cur.name);

  for (let i = 0; i < tablesAsArr.length; i++) {
    const tableCur = tablesAsArr[i];

    await deleteSql(tableCur, id);
  }

  await db.close();
}
