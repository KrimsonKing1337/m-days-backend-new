import type { ObjectId } from 'mongodb';

export type PresetOptionsWidth = number | 'windowWidth' | 'all';

export type PresetOptionsType = {
  width: PresetOptionsWidth[];
};

export type PresetValue = {
  collection: string;
  topic: string;
};

export type Preset = {
  id: string;
  options?: {
    skin?: string;
    dynamic?: PresetOptionsType;
    static?: PresetOptionsType;
  };
  values: {
    dynamic: PresetValue[];
    static: PresetValue[];
  };
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

export type Orientation = 'h' | 'v' | 's';

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

export type ImageFilterSafe = Partial<ImageFilter> | undefined;

export type Media = {
  _id: ObjectId;
  id: string;
  type: 'static' | 'dynamic';
  collection: string;
  topic: string;
  orientation: Orientation;
  width: number;
  filename: string;
  path: string;
  size: number;
};

export type SliderDoc = {
  _id: ObjectId;
  id: string;
  key: string;
  preset: string;
  filter: ImageFilterSafe;
  intervalMs: number;
  startedAt: Date;
  step: number;
  mediaPath: string;
  nextMediaPath: string;
  mediaId: string;
  nextMediaId: string;
  lastTickAt: Date;
  lastAccessAt: Date;
  active: boolean;
};
