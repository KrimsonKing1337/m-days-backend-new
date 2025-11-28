import fs from 'fs/promises';
import path from 'path';

export type LogType = 'log' | 'error' | 'warning';

export type WriteLogArgs = {
  type: LogType;
  message: string;
  filePath?: string;
};

export async function writeLog({
  type,
  message,
  filePath = './logs/app.log',
}: WriteLogArgs) {
  const typeUpperCase = type.toUpperCase();
  const date = new Date().toISOString();

  // YYYY-MM-DDThh:mm:ss
  const timestamp = date.split('.')[0];

  const prefix = `[${typeUpperCase}] ${timestamp}`;
  const line = `${prefix}:\n${message}\n__________________\n`;

  // Создаём директорию, если её нет
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  await fs.appendFile(filePath, line, 'utf8');
}
