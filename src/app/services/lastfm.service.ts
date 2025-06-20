import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  LastFmTrack,
  LastFmArtist,
  LastFmAlbum,
  LastFmSearchResponse,
  LastFmTrackResponse,
  LastFmArtistResponse,
  LastFmAlbumResponse,
  LastFmTopTracksResponse,
  LastFmTopArtistsResponse,
  LastFmError,
  Track,
  Artist,
  Album,
  SearchParams,
  ChartParams,
} from './lastfm.types';

@Injectable({
  providedIn: 'root',
})
export class LastfmService {
  private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';
  private readonly apiKey = 'f1ebc61111de38045daa79c4e2c7630a';

  constructor(private http: HttpClient) {}

  /**
   * Search for tracks
   */
  searchTracks(params: SearchParams): Observable<Track[]> {
    const httpParams = this.buildSearchParams('track.search', {
      track: params.query,
      page: params.page,
      limit: params.limit,
    });

    return this.http
      .get<
        LastFmSearchResponse<LastFmTrack>
      >(this.baseUrl, { params: httpParams })
      .pipe(
        map(response =>
          this.mapLastFmTracksToTracks(
            response.results.trackmatches?.track || []
          )
        ),
        catchError(this.handleError)
      );
  }

  /**
   * Search for artists
   */
  searchArtists(params: SearchParams): Observable<Artist[]> {
    const httpParams = this.buildSearchParams('artist.search', {
      artist: params.query,
      page: params.page,
      limit: params.limit,
    });

    return this.http
      .get<
        LastFmSearchResponse<LastFmArtist>
      >(this.baseUrl, { params: httpParams })
      .pipe(
        map(response =>
          this.mapLastFmArtistsToArtists(
            response.results.artistmatches?.artist || []
          )
        ),
        catchError(this.handleError)
      );
  }

  /**
   * Search for albums
   */
  searchAlbums(params: SearchParams): Observable<Album[]> {
    const httpParams = this.buildSearchParams('album.search', {
      album: params.query,
      page: params.page,
      limit: params.limit,
    });

    return this.http
      .get<
        LastFmSearchResponse<LastFmAlbum>
      >(this.baseUrl, { params: httpParams })
      .pipe(
        map(response =>
          this.mapLastFmAlbumsToAlbums(
            response.results.albummatches?.album || []
          )
        ),
        catchError(this.handleError)
      );
  }

  /**
   * Get track information
   */
  getTrack(artist: string, track: string): Observable<Track> {
    const httpParams = this.buildParams('track.getInfo', {
      artist,
      track,
    });

    return this.http
      .get<LastFmTrackResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        map(response => this.mapLastFmTrackToTrack(response.track)),
        catchError(this.handleError)
      );
  }

  /**
   * Get artist information
   */
  getArtist(artist: string): Observable<Artist> {
    const httpParams = this.buildParams('artist.getInfo', {
      artist,
    });

    return this.http
      .get<LastFmArtistResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        map(response => this.mapLastFmArtistToArtist(response.artist)),
        catchError(this.handleError)
      );
  }

  /**
   * Get album information
   */
  getAlbum(artist: string, album: string): Observable<Album> {
    const httpParams = this.buildParams('album.getInfo', {
      artist,
      album,
    });

    return this.http
      .get<LastFmAlbumResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        map(response => this.mapLastFmAlbumToAlbum(response.album)),
        catchError(this.handleError)
      );
  }

  /**
   * Get top tracks chart
   */
  getTopTracks(params: ChartParams = {}): Observable<Track[]> {
    const httpParams = this.buildParams('chart.getTopTracks', {
      page: params.page,
      limit: params.limit,
    });

    return this.http
      .get<LastFmTopTracksResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        map(response => this.mapLastFmTracksToTracks(response.tracks.track)),
        catchError(this.handleError)
      );
  }

  /**
   * Get top artists chart
   */
  getTopArtists(params: ChartParams = {}): Observable<Artist[]> {
    const httpParams = this.buildParams('chart.getTopArtists', {
      page: params.page,
      limit: params.limit,
    });

    return this.http
      .get<LastFmTopArtistsResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        map(response =>
          this.mapLastFmArtistsToArtists(response.artists.artist)
        ),
        catchError(this.handleError)
      );
  }

  /**
   * Get artist's top tracks
   */
  getArtistTopTracks(
    artist: string,
    params: ChartParams = {}
  ): Observable<Track[]> {
    const httpParams = this.buildParams('artist.getTopTracks', {
      artist,
      page: params.page,
      limit: params.limit,
    });

    return this.http
      .get<{
        toptracks: { track: LastFmTrack[] };
      }>(this.baseUrl, { params: httpParams })
      .pipe(
        map(response => this.mapLastFmTracksToTracks(response.toptracks.track)),
        catchError(this.handleError)
      );
  }

  private buildParams(
    method: string,
    additionalParams: Record<string, any> = {}
  ): HttpParams {
    let params = new HttpParams()
      .set('method', method)
      .set('api_key', this.apiKey)
      .set('format', 'json');

    Object.keys(additionalParams).forEach(key => {
      const value = additionalParams[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return params;
  }

  private buildSearchParams(
    method: string,
    searchParams: Record<string, any> = {}
  ): HttpParams {
    const defaultParams = {
      page: 1,
      limit: 30,
      ...searchParams,
    };

    return this.buildParams(method, defaultParams);
  }

  private mapLastFmTrackToTrack(lastFmTrack: LastFmTrack): Track {
    const artistName =
      typeof lastFmTrack.artist === 'string'
        ? lastFmTrack.artist
        : lastFmTrack.artist.name;

    const albumName =
      typeof lastFmTrack.album === 'string'
        ? lastFmTrack.album
        : lastFmTrack.album?.name || 'Unknown Album';

    return {
      id: `${artistName}-${lastFmTrack.name}`
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase(),
      title: lastFmTrack.name,
      artist: artistName,
      album: albumName,
      genre: this.extractGenreFromTags(lastFmTrack),
      duration: this.parseDuration(lastFmTrack.duration),
      mood: this.determineMood(lastFmTrack),
      imageUrl: this.extractImageUrl(lastFmTrack.image),
      lastFmUrl: lastFmTrack.url,
      playcount: parseInt(lastFmTrack.playcount || '0'),
      listeners: parseInt(lastFmTrack.listeners || '0'),
    };
  }

  private mapLastFmTracksToTracks(lastFmTracks: LastFmTrack[]): Track[] {
    return lastFmTracks.map(track => this.mapLastFmTrackToTrack(track));
  }

  private mapLastFmArtistToArtist(lastFmArtist: LastFmArtist): Artist {
    return {
      id: lastFmArtist.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
      name: lastFmArtist.name,
      bio: lastFmArtist.bio?.summary || '',
      imageUrl: this.extractImageUrl(lastFmArtist.image),
      genres: lastFmArtist.tags?.tag.map(tag => tag.name) || [],
      listeners: parseInt(lastFmArtist.stats?.listeners || '0'),
      playcount: parseInt(lastFmArtist.stats?.playcount || '0'),
      lastFmUrl: lastFmArtist.url,
    };
  }

  private mapLastFmArtistsToArtists(lastFmArtists: LastFmArtist[]): Artist[] {
    return lastFmArtists.map(artist => this.mapLastFmArtistToArtist(artist));
  }

  private mapLastFmAlbumToAlbum(lastFmAlbum: LastFmAlbum): Album {
    return {
      id: `${lastFmAlbum.artist}-${lastFmAlbum.name}`
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase(),
      title: lastFmAlbum.name,
      artist: lastFmAlbum.artist,
      imageUrl: this.extractImageUrl(lastFmAlbum.image),
      tracks:
        lastFmAlbum.tracks?.track.map(track =>
          this.mapLastFmTrackToTrack(track)
        ) || [],
      lastFmUrl: lastFmAlbum.url,
    };
  }

  private mapLastFmAlbumsToAlbums(lastFmAlbums: LastFmAlbum[]): Album[] {
    return lastFmAlbums.map(album => this.mapLastFmAlbumToAlbum(album));
  }

  private extractImageUrl(images?: any[]): string {
    if (!images || images.length === 0) {
      return '/assets/images/default-album.png';
    }

    const largeImage = images.find(
      img => img.size === 'extralarge' || img.size === 'large'
    );
    return (
      largeImage?.['#text'] ||
      images[images.length - 1]?.['#text'] ||
      '/assets/images/default-album.png'
    );
  }

  private parseDuration(duration?: string): number {
    if (!duration) return 0;
    return parseInt(duration) || 0;
  }

  private extractGenreFromTags(track: LastFmTrack): string {
    // this is a (permanent) placeholder
    return 'Unknown';
  }

  private determineMood(track: LastFmTrack): string {
    // this is also a (permanent) placeholder
    const moods = ['Happy', 'Sad', 'Energetic', 'Relaxed', 'Romantic', 'Angry'];
    return moods[Math.floor(Math.random() * moods.length)];
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const lastFmError: LastFmError = {
      error: error.status || 0,
      message:
        error.error?.message ||
        error.message ||
        'An error occurred with Last.fm API',
    };

    console.error('Last.fm API Error:', lastFmError);
    return throwError(() => lastFmError);
  };
}
