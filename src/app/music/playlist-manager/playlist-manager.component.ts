import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import {
  PlaylistService,
  Playlist,
  Track,
} from '../../services/playlist.service';

interface PlaylistTableData extends Playlist {
  trackCount: number;
  formattedDuration: string;
  lastUpdated: string;
}

type SortKey =
  | 'name'
  | 'trackCount'
  | 'totalDuration'
  | 'updatedAt'
  | 'createdAt';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-playlist-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzFormModule,
    NzPopconfirmModule,
    NzTagModule,
    NzAvatarModule,
    NzDividerModule,
    NzSwitchModule,
    NzSelectModule,
    NzSpaceModule,
    NzToolTipModule,
  ],
  templateUrl: './playlist-manager.component.html',
  styleUrl: './playlist-manager.component.scss',
})
export class PlaylistManagerComponent {
  readonly playlistService = inject(PlaylistService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // Input/Output for parent-child communication
  @Input() showOnlyPublic = false;
  @Output() playlistSelected = new EventEmitter<Playlist>();
  @Output() playlistDeleted = new EventEmitter<string>();

  // Signals for reactive state
  readonly searchTerm = signal('');
  readonly sortKey = signal<SortKey>('updatedAt');
  readonly sortOrder = signal<SortOrder>('desc');
  readonly isModalVisible = signal(false);
  readonly isEditing = signal(false);
  readonly selectedPlaylist = signal<Playlist | null>(null);

  // Form for playlist creation/editing
  readonly playlistForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    isPublic: [false],
  });

  // Computed signals for filtered and sorted data
  readonly filteredPlaylists = computed(() => {
    const playlists = this.playlistService.playlists();
    const search = this.searchTerm().toLowerCase();

    let filtered = playlists.filter(playlist => {
      const matchesSearch =
        playlist.name.toLowerCase().includes(search) ||
        playlist.description.toLowerCase().includes(search);

      const matchesVisibility = this.showOnlyPublic ? playlist.isPublic : true;

      return matchesSearch && matchesVisibility;
    });

    return this.sortPlaylists(filtered);
  });

  readonly tableData = computed((): PlaylistTableData[] => {
    return this.filteredPlaylists().map(playlist => ({
      ...playlist,
      trackCount: playlist.tracks.length,
      formattedDuration: this.playlistService.formatDuration(
        playlist.totalDuration
      ),
      lastUpdated: this.formatDate(playlist.updatedAt),
    }));
  });

  readonly stats = computed(() => this.playlistService.stats());
  readonly selectedPlaylistId = computed(
    () => this.playlistService.selectedPlaylist()?.id || null
  );

  private sortPlaylists(playlists: Playlist[]): Playlist[] {
    const key = this.sortKey();
    const order = this.sortOrder();

    return [...playlists].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'trackCount':
          aValue = a.tracks.length;
          bValue = b.tracks.length;
          break;
        case 'totalDuration':
          aValue = a.totalDuration;
          bValue = b.totalDuration;
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Table sorting
  onSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortOrder.set('asc');
    }
  }

  getSortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return 'swap';
    return this.sortOrder() === 'asc' ? 'caret-up' : 'caret-down';
  }

  // Search functionality
  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  // Modal operations
  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedPlaylist.set(null);
    this.playlistForm.reset({ isPublic: false });
    this.isModalVisible.set(true);
  }

  openEditModal(playlist: Playlist): void {
    this.isEditing.set(true);
    this.selectedPlaylist.set(playlist);
    this.playlistForm.patchValue({
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.isPublic,
    });
    this.isModalVisible.set(true);
  }

  closeModal(): void {
    this.isModalVisible.set(false);
    this.playlistForm.reset();
    this.selectedPlaylist.set(null);
  }

  // CRUD operations
  onSubmit(): void {
    if (this.playlistForm.valid) {
      const formValue = this.playlistForm.value;

      if (this.isEditing()) {
        const playlist = this.selectedPlaylist();
        if (playlist) {
          const updated = this.playlistService.updatePlaylist(playlist.id, {
            name: formValue.name!,
            description: formValue.description || '',
            isPublic: formValue.isPublic || false,
          });

          if (updated) {
            this.message.success('Playlist updated successfully');
            this.closeModal();
          } else {
            this.message.error('Failed to update playlist');
          }
        }
      } else {
        const newPlaylist = this.playlistService.createPlaylist(
          formValue.name!,
          formValue.description || '',
          formValue.isPublic || false
        );

        this.message.success('Playlist created successfully');
        this.closeModal();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onDelete(playlist: Playlist): void {
    const success = this.playlistService.deletePlaylist(playlist.id);
    if (success) {
      this.message.success('Playlist deleted successfully');
      this.playlistDeleted.emit(playlist.id);
    } else {
      this.message.error('Failed to delete playlist');
    }
  }

  onSelect(playlist: Playlist): void {
    this.playlistService.selectPlaylist(playlist.id);
    this.playlistSelected.emit(playlist);
  }

  // Helper methods
  formatDuration(seconds: number): string {
    return this.playlistService.formatDuration(seconds);
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  private markFormGroupTouched(): void {
    Object.values(this.playlistForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.playlistForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.playlistForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return '';
  }
}
