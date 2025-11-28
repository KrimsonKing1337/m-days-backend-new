import type { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

export type Preset = {
  id?: string;
  staticTopics: string;
  dynamicTopics: string;
  formats: string;
  resolution: string;
  orientation?: string;
  skin: string;
  fileSize: string;
};

export type GetImagesWithLabelsAttrs = {
  tz: string;
  resolution: string;
  imagePath: string;
  orientation: string;
  justImage?: boolean;
  noProcessing?: boolean;
  gif?: boolean;
};

export type Db = Database<sqlite3.Database, sqlite3.Statement>;
