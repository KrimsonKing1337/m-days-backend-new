import type { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { Orientation } from 'api/media/get.js';

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
  timezone: string;
  resolution: string;
  imagePath: string;
  orientation: string;
  justImage?: boolean;
  noProcessing?: boolean;
  gif?: boolean;
};

export type ImageFilter = {
  type: 'static' | 'dynamic';
  collection: string | string[];
  topic: string | string[];
  orientation: Orientation[];
  width: [number, number];
  height: [number, number];
  size: [number, number];
  windowWidth: number;
  windowHeight: number;
};
