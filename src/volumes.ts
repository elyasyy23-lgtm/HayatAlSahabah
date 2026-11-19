/**
 * Static volume catalog.
 *
 * One database file per volume keeps the validated volume 1 byte-for-byte
 * untouched and gives every volume its own progress, bookmarks and settings.
 * Adding volume N later = drop `hayat-vN.db` into assets/db, add one entry
 * below, rebuild the app. No screen changes are required.
 */

export type VolumeDef = {
  id: number;
  titleFa: string;
  titleEn: string;
  dbName: string;
  /** Bundled asset id (number from require) or null while the volume is not shipped. */
  assetId: number | null;
  ready: boolean;
};

export const VOLUMES: VolumeDef[] = [
  {
    id: 1,
    titleFa: 'جلد اول',
    titleEn: 'Volume 1',
    dbName: 'hayat-v1.db',
    assetId: require('../assets/db/hayat-v1.db'),
    ready: true,
  },
  { id: 2, titleFa: 'جلد دوم', titleEn: 'Volume 2', dbName: 'hayat-v2.db', assetId: null, ready: false },
  { id: 3, titleFa: 'جلد سوم', titleEn: 'Volume 3', dbName: 'hayat-v3.db', assetId: null, ready: false },
  { id: 4, titleFa: 'جلد چهارم', titleEn: 'Volume 4', dbName: 'hayat-v4.db', assetId: null, ready: false },
  { id: 5, titleFa: 'جلد پنجم', titleEn: 'Volume 5', dbName: 'hayat-v5.db', assetId: null, ready: false },
  { id: 6, titleFa: 'جلد ششم', titleEn: 'Volume 6', dbName: 'hayat-v6.db', assetId: null, ready: false },
];

export const DEFAULT_VOLUME_ID = 1;

export function volumeById(id: number): VolumeDef {
  return VOLUMES.find((v) => v.id === id) ?? VOLUMES[0];
}

export function volumeAssetSource(v: VolumeDef): { assetId: number } | undefined {
  return v.assetId === null ? undefined : { assetId: v.assetId };
}
