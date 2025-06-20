import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  of,
  map,
  tap,
  Observable,
} from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { LastfmService } from '../../services/lastfm.service';
import { PlaylistService, Track } from '../../services/playlist.service';
import {
  Track as LastFmAppTrack,
  Artist as LastFmAppArtist,
  Album as LastFmAppAlbum,
} from '../../services/lastfm.types';

export interface SearchResult extends Track {
  type: 'track' | 'artist' | 'album';
}

@Component({
  selector: 'app-music-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzListModule,
    NzIconModule,
    NzImageModule,
    NzTagModule,
    NzSelectModule,
    NzSpinModule,
    NzEmptyModule,
    NzAlertModule,
    NzDropDownModule,
    NzMenuModule,
  ],
  templateUrl: './music-search.component.html',
  styleUrls: ['./music-search.component.scss'],
})
export class MusicSearchComponent {
  private readonly fb = inject(FormBuilder);
  private readonly lastfmService = inject(LastfmService);
  private readonly playlistService = inject(PlaylistService);

  @Output() trackSelected = new EventEmitter<SearchResult>();

  // Signals for component state
  readonly searchResults = signal<SearchResult[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasSearched = signal(false);

  // Playlist signals
  readonly playlists = this.playlistService.playlists;

  // Search form
  readonly searchForm: FormGroup = this.fb.group({
    query: ['', [Validators.required, Validators.minLength(2)]],
    searchType: ['track', Validators.required],
  });

  // Computed values
  readonly hasResults = computed(() => this.searchResults().length > 0);
  readonly canSearch = computed(() => {
    const query = this.searchForm.get('query')?.value;
    return query && query.trim().length >= 2;
  });

  constructor() {
    this.setupSearchSubscription();
  }

  /**
   * Setup reactive search with debouncing
   */
  private setupSearchSubscription(): void {
    this.searchForm
      .get('query')
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.trim().length < 2) {
            return of([]);
          }
          return this.performSearch(query.trim());
        })
      )
      .subscribe({
        next: (results: SearchResult[]) => {
          this.searchResults.set(results);
          this.hasSearched.set(true);
        },
        error: (error: any) => {
          console.error('Search error:', error);
          this.error.set('Failed to search. Please try again.');
          this.isLoading.set(false);
        },
      });

    // Reset results when search type changes
    this.searchForm.get('searchType')?.valueChanges.subscribe(() => {
      const query = this.searchForm.get('query')?.value;
      if (query && query.trim().length >= 2) {
        this.performSearch(query.trim()).subscribe({
          next: (results: SearchResult[]) => this.searchResults.set(results),
          error: (error: any) => {
            console.error('Search error:', error);
            this.error.set('Failed to search. Please try again.');
          },
        });
      }
    });
  }

  /**
   * Perform search based on type
   */
  private performSearch(query: string): Observable<SearchResult[]> {
    this.isLoading.set(true);
    this.error.set(null);

    const searchType = this.searchForm.get('searchType')?.value || 'track';
    const searchParams = { query, page: 1, limit: 20 };

    switch (searchType) {
      case 'track':
        return this.lastfmService.searchTracks(searchParams).pipe(
          map(tracks =>
            tracks.map(track => ({
              ...this.convertAppTrackToPlaylistTrack(track),
              type: 'track' as const,
            }))
          ),
          catchError(error => {
            this.error.set('Failed to search tracks');
            return of([] as SearchResult[]);
          }),
          tap(() => this.isLoading.set(false))
        );

      case 'artist':
        return this.lastfmService.searchArtists(searchParams).pipe(
          map(artists =>
            artists.map(artist => ({
              ...this.convertAppArtistToPlaylistTrack(artist),
              type: 'artist' as const,
            }))
          ),
          catchError(error => {
            this.error.set('Failed to search artists');
            return of([] as SearchResult[]);
          }),
          tap(() => this.isLoading.set(false))
        );

      case 'album':
        return this.lastfmService.searchAlbums(searchParams).pipe(
          map(albums =>
            albums.map(album => ({
              ...this.convertAppAlbumToPlaylistTrack(album),
              type: 'album' as const,
            }))
          ),
          catchError(error => {
            this.error.set('Failed to search albums');
            return of([] as SearchResult[]);
          }),
          tap(() => this.isLoading.set(false))
        );

      default:
        this.isLoading.set(false);
        return of([] as SearchResult[]);
    }
  }

  /**
   * Convert LastFM app Track to playlist Track format
   */
  private convertAppTrackToPlaylistTrack(track: LastFmAppTrack): Track {
    return {
      id: track.id,
      name: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      image: track.imageUrl,
      url: track.lastFmUrl,
      playcount: track.playcount || 0,
      listeners: track.listeners || 0,
      addedAt: new Date(),
    };
  }

  /**
   * Convert LastFM app Artist to playlist Track format
   */
  private convertAppArtistToPlaylistTrack(artist: LastFmAppArtist): Track {
    return {
      id: `artist-${artist.id}`,
      name: `${artist.name} (Artist)`,
      artist: artist.name,
      album: 'Artist Profile',
      duration: 0,
      image: artist.imageUrl,
      url: artist.lastFmUrl,
      playcount: artist.playcount || 0,
      listeners: artist.listeners || 0,
      addedAt: new Date(),
    };
  }

  /**
   * Convert LastFM app Album to playlist Track format
   */
  private convertAppAlbumToPlaylistTrack(album: LastFmAppAlbum): Track {
    return {
      id: `album-${album.id}`,
      name: `${album.title} (Album)`,
      artist: album.artist,
      album: album.title,
      duration: 0,
      image: album.imageUrl,
      url: album.lastFmUrl,
      playcount: 0,
      listeners: 0,
      addedAt: new Date(),
    };
  }

  /**
   * Manual search trigger
   */
  onSearch(): void {
    if (this.canSearch()) {
      const query = this.searchForm.get('query')?.value.trim();
      this.performSearch(query).subscribe({
        next: (results: SearchResult[]) => {
          this.searchResults.set(results);
          this.hasSearched.set(true);
        },
        error: (error: any) => {
          console.error('Search error:', error);
          this.error.set('Failed to search. Please try again.');
        },
      });
    }
  }

  /**
   * Clear search results
   */
  clearSearch(): void {
    this.searchForm.get('query')?.setValue('');
    this.searchResults.set([]);
    this.hasSearched.set(false);
    this.error.set(null);
  }

  /**
   * Select a track result
   */
  selectTrack(result: SearchResult): void {
    this.trackSelected.emit(result);
  }

  /**
   * Add track to playlist
   */
  addToPlaylist(playlistId: string, track: SearchResult): void {
    const success = this.playlistService.addTrackToPlaylist(playlistId, track);
    if (success) {
      console.log(`Added "${track.name}" to playlist`);
    } else {
      console.log(`Track "${track.name}" already exists in playlist`);
    }
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(track: SearchResult): void {
    const wasAdded = this.playlistService.toggleFavorite(track);
    console.log(wasAdded ? 'Added to favorites' : 'Removed from favorites');
  }

  /**
   * Check if track is favorite
   */
  isFavorite(trackId: string): boolean {
    return this.playlistService.isFavorite(trackId);
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    if (seconds === 0) return '--:--';
    return this.playlistService.formatDuration(seconds);
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  /**
   * Get type icon
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'track':
        return 'sound';
      case 'artist':
        return 'user';
      case 'album':
        return 'folder';
      default:
        return 'music';
    }
  }

  /**
   * Get type color
   */
  getTypeColor(type: string): string {
    switch (type) {
      case 'track':
        return 'blue';
      case 'artist':
        return 'green';
      case 'album':
        return 'orange';
      default:
        return 'default';
    }
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByFn(index: number, item: SearchResult): string {
    return item.id;
  }

  /**
   * Handle image load errors
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src =
        'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
    }
  }
}
