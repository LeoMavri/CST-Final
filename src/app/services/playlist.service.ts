import { Injectable, computed, signal } from '@angular/core';

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  image: string;
  url: string;
  playcount: number;
  listeners: number;
  addedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  totalDuration: number; // computed from tracks
}

export interface PlaylistStats {
  totalPlaylists: number;
  totalTracks: number;
  totalDuration: number; // in seconds
  favoriteCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  private readonly PLAYLISTS_STORAGE_KEY = 'music-playlists';

  // Signals for reactive state
  private readonly _playlists = signal<Playlist[]>([]);
  private readonly _selectedPlaylist = signal<Playlist | null>(null);
  private readonly _favorites = signal<Track[]>([]);

  // Public computed signals
  readonly playlists = computed(() => this._playlists());
  readonly selectedPlaylist = computed(() => this._selectedPlaylist());
  readonly favorites = computed(() => this._favorites());

  readonly stats = computed((): PlaylistStats => {
    const playlists = this._playlists();
    const totalTracks = playlists.reduce(
      (sum, playlist) => sum + playlist.tracks.length,
      0
    );
    const totalDuration = playlists.reduce(
      (sum, playlist) => sum + playlist.totalDuration,
      0
    );

    return {
      totalPlaylists: playlists.length,
      totalTracks,
      totalDuration,
      favoriteCount: this._favorites().length,
    };
  });

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Create a new playlist
   */
  createPlaylist(
    name: string,
    description: string = '',
    isPublic: boolean = false
  ): Playlist {
    const newPlaylist: Playlist = {
      id: this.generateId(),
      name,
      description,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic,
      totalDuration: 0,
    };

    this._playlists.update(playlists => [...playlists, newPlaylist]);
    this.saveToStorage();

    return newPlaylist;
  }

  /**
   * Update an existing playlist
   */
  updatePlaylist(
    id: string,
    updates: Partial<Omit<Playlist, 'id' | 'createdAt' | 'totalDuration'>>
  ): Playlist | null {
    let updatedPlaylist: Playlist | null = null;

    this._playlists.update(playlists =>
      playlists.map(playlist => {
        if (playlist.id === id) {
          updatedPlaylist = {
            ...playlist,
            ...updates,
            updatedAt: new Date(),
            totalDuration: this.calculateTotalDuration(
              updates.tracks || playlist.tracks
            ),
          };
          return updatedPlaylist;
        }
        return playlist;
      })
    );

    if (updatedPlaylist) {
      this.saveToStorage();

      // Update selected playlist if it's the one being updated
      if (this._selectedPlaylist()?.id === id) {
        this._selectedPlaylist.set(updatedPlaylist);
      }
    }

    return updatedPlaylist;
  }

  /**
   * Delete a playlist
   */
  deletePlaylist(id: string): boolean {
    const initialLength = this._playlists().length;

    this._playlists.update(playlists => playlists.filter(p => p.id !== id));

    // Clear selected playlist if it was deleted
    if (this._selectedPlaylist()?.id === id) {
      this._selectedPlaylist.set(null);
    }

    const wasDeleted = this._playlists().length < initialLength;
    if (wasDeleted) {
      this.saveToStorage();
    }

    return wasDeleted;
  }

  /**
   * Get playlist by ID
   */
  getPlaylistById(id: string): Playlist | null {
    return this._playlists().find(p => p.id === id) || null;
  }

  /**
   * Select a playlist
   */
  selectPlaylist(id: string): void {
    const playlist = this.getPlaylistById(id);
    this._selectedPlaylist.set(playlist);
  }

  /**
   * Add track to playlist
   */
  addTrackToPlaylist(
    playlistId: string,
    track: Omit<Track, 'addedAt'>
  ): boolean {
    const trackWithDate: Track = {
      ...track,
      addedAt: new Date(),
    };

    let wasAdded = false;

    this._playlists.update(playlists =>
      playlists.map(playlist => {
        if (playlist.id === playlistId) {
          // Check if track already exists in playlist
          const trackExists = playlist.tracks.some(t => t.id === track.id);
          if (!trackExists) {
            const updatedTracks = [...playlist.tracks, trackWithDate];
            wasAdded = true;
            return {
              ...playlist,
              tracks: updatedTracks,
              updatedAt: new Date(),
              totalDuration: this.calculateTotalDuration(updatedTracks),
            };
          }
        }
        return playlist;
      })
    );

    if (wasAdded) {
      this.saveToStorage();
    }

    return wasAdded;
  }

  /**
   * Remove track from playlist
   */
  removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
    let wasRemoved = false;

    this._playlists.update(playlists =>
      playlists.map(playlist => {
        if (playlist.id === playlistId) {
          const updatedTracks = playlist.tracks.filter(t => t.id !== trackId);
          if (updatedTracks.length !== playlist.tracks.length) {
            wasRemoved = true;
            return {
              ...playlist,
              tracks: updatedTracks,
              updatedAt: new Date(),
              totalDuration: this.calculateTotalDuration(updatedTracks),
            };
          }
        }
        return playlist;
      })
    );

    if (wasRemoved) {
      this.saveToStorage();
    }

    return wasRemoved;
  }

  /**
   * Add/remove track from favorites
   */
  toggleFavorite(track: Omit<Track, 'addedAt'>): boolean {
    const favorites = this._favorites();
    const existingIndex = favorites.findIndex(t => t.id === track.id);

    if (existingIndex >= 0) {
      // Remove from favorites
      this._favorites.update(favs =>
        favs.filter((_, index) => index !== existingIndex)
      );
      this.saveToStorage();
      return false; // Removed
    } else {
      // Add to favorites
      const trackWithDate: Track = { ...track, addedAt: new Date() };
      this._favorites.update(favs => [...favs, trackWithDate]);
      this.saveToStorage();
      return true; // Added
    }
  }

  /**
   * Check if track is in favorites
   */
  isFavorite(trackId: string): boolean {
    return this._favorites().some(track => track.id === trackId);
  }

  /**
   * Search tracks in all playlists
   */
  searchInPlaylists(query: string): Track[] {
    const searchTerm = query.toLowerCase();
    const allTracks: Track[] = [];

    this._playlists().forEach(playlist => {
      playlist.tracks.forEach(track => {
        if (
          track.name.toLowerCase().includes(searchTerm) ||
          track.artist.toLowerCase().includes(searchTerm) ||
          track.album.toLowerCase().includes(searchTerm)
        ) {
          allTracks.push(track);
        }
      });
    });

    // Remove duplicates
    return allTracks.filter(
      (track, index, self) => index === self.findIndex(t => t.id === track.id)
    );
  }

  /**
   * Get formatted duration string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate total duration of tracks
   */
  private calculateTotalDuration(tracks: Track[]): number {
    return tracks.reduce((total, track) => total + (track.duration || 0), 0);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save playlists to localStorage
   */
  private saveToStorage(): void {
    const data = {
      playlists: this._playlists(),
      favorites: this._favorites(),
    };
    localStorage.setItem(this.PLAYLISTS_STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Load playlists from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.PLAYLISTS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Restore playlists with proper date objects
        const playlists = (data.playlists || []).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          tracks: p.tracks.map((t: any) => ({
            ...t,
            addedAt: new Date(t.addedAt),
          })),
        }));

        // Restore favorites with proper date objects
        const favorites = (data.favorites || []).map((t: any) => ({
          ...t,
          addedAt: new Date(t.addedAt),
        }));

        this._playlists.set(playlists);
        this._favorites.set(favorites);
      }
    } catch (error) {
      console.error('Failed to load playlists from storage:', error);
      // Initialize with empty state on error
      this._playlists.set([]);
      this._favorites.set([]);
    }
  }
}
