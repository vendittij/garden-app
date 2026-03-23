import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const DB_NAME = 'plants.db';
// expo-sqlite stores databases at documentDirectory/SQLite/<name>
const DB_DIRECTORY = `${FileSystem.documentDirectory}SQLite/`;
export const PLANT_DB_PATH = `${DB_DIRECTORY}${DB_NAME}`;

/**
 * Copies the bundled plants.db asset to the SQLite directory on first launch.
 * Safe to call repeatedly — no-ops if the file already exists.
 */
export async function ensurePlantDbReady(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PLANT_DB_PATH);
  if (info.exists) return;

  await FileSystem.makeDirectoryAsync(DB_DIRECTORY, { intermediates: true });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const asset = Asset.fromModule(require('../../assets/plants.db'));
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error('plants.db asset could not be resolved — check assets/plants.db exists and is registered in app.json');
  }

  await FileSystem.copyAsync({ from: asset.localUri, to: PLANT_DB_PATH });
}
