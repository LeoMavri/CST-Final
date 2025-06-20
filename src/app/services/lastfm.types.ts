export interface LastFmTrack {
  name: string;
  artist: string | LastFmArtist;
  album?: string | LastFmAlbum;
  url: string;
  duration?: string;
  playcount?: string;
  listeners?: string;
  mbid?: string;
  image?: LastFmImage[];
  wiki?: {
    summary: string;
    content: string;
  };
}

export interface LastFmArtist {
  name: string;
  mbid?: string;
  url: string;
  image?: LastFmImage[];
  streamable?: string;
  bio?: {
    summary: string;
    content: string;
  };
  stats?: {
    listeners: string;
    playcount: string;
  };
  tags?: {
    tag: LastFmTag[];
  };
}

export interface LastFmAlbum {
  name: string;
  artist: string;
  mbid?: string;
  url: string;
  image?: LastFmImage[];
  listeners?: string;
  playcount?: string;
  tracks?: {
    track: LastFmTrack[];
  };
  wiki?: {
    summary: string;
    content: string;
  };
}

export interface LastFmImage {
  '#text': string;
  size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
}

export interface LastFmTag {
  name: string;
  url: string;
}

export interface LastFmSearchResponse<T> {
  results: {
    'opensearch:Query': string;
    'opensearch:totalResults': string;
    'opensearch:startIndex': string;
    'opensearch:itemsPerPage': string;
    trackmatches?: {
      track: T[];
    };
    artistmatches?: {
      artist: T[];
    };
    albummatches?: {
      album: T[];
    };
  };
}

export interface LastFmTrackResponse {
  track: LastFmTrack;
}

export interface LastFmArtistResponse {
  artist: LastFmArtist;
}

export interface LastFmAlbumResponse {
  album: LastFmAlbum;
}

export interface LastFmTopTracksResponse {
  tracks: {
    track: LastFmTrack[];
    '@attr': {
      page: string;
      perPage: string;
      totalPages: string;
      total: string;
    };
  };
}

export interface LastFmTopArtistsResponse {
  artists: {
    artist: LastFmArtist[];
    '@attr': {
      page: string;
      perPage: string;
      totalPages: string;
      total: string;
    };
  };
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  mood: string;
  imageUrl: string;
  lastFmUrl: string;
  playcount?: number;
  listeners?: number;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
  genres: string[];
  listeners: number;
  playcount: number;
  lastFmUrl: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year?: number;
  imageUrl: string;
  tracks: Track[];
  lastFmUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdBy: string;
  createdAt: Date;
  mood?: string;
  isPublic: boolean;
}

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface ChartParams {
  page?: number;
  limit?: number;
}

export interface LastFmError {
  error: number;
  message: string;
}
