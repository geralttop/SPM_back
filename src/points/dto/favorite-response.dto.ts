import * as GeoJSON from 'geojson';

export class FavoritePointDto {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  coords: GeoJSON.Point;
  category: any;
  container: any;
  addedAt: Date;
}

export class FavoriteStatsDto {
  favoritesCount: number;
}
