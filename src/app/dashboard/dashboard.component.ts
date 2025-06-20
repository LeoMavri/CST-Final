import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { PlaylistService, Playlist } from '../services/playlist.service';
import { MusicSearchComponent } from '../music/music-search/music-search.component';
import { PlaylistManagerComponent } from '../music/playlist-manager/playlist-manager.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzAvatarModule,
    NzDropDownModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzTabsModule,
    MusicSearchComponent,
    PlaylistManagerComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  readonly authService = inject(AuthService);
  readonly playlistService = inject(PlaylistService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // Auth service signals
  readonly user = this.authService.user;

  // Playlist service signals
  readonly stats = this.playlistService.stats;

  // Component signals
  readonly showCreatePlaylistModal = signal(false);
  readonly showMusicSearch = signal(false);
  readonly activeTab = signal(0);

  // Create playlist form
  readonly createPlaylistForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    isPublic: [false],
  });

  /**
   * Handle logout
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Navigate to profile
   */
  goToProfile(): void {
    // TODO: Implement profile page
    console.log('Navigate to profile');
  }

  /**
   * Show create playlist modal
   */
  openCreatePlaylistModal(): void {
    this.showCreatePlaylistModal.set(true);
    this.createPlaylistForm.reset({
      name: '',
      description: '',
      isPublic: false,
    });
  }

  /**
   * Hide create playlist modal
   */
  closeCreatePlaylistModal(): void {
    this.showCreatePlaylistModal.set(false);
  }

  /**
   * Create new playlist
   */
  createPlaylist(): void {
    if (this.createPlaylistForm.valid) {
      const formValue = this.createPlaylistForm.value;

      const playlist = this.playlistService.createPlaylist(
        formValue.name,
        formValue.description || '',
        formValue.isPublic || false
      );

      console.log('Created playlist:', playlist);
      this.closeCreatePlaylistModal();
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.createPlaylistForm.controls).forEach(key => {
        this.createPlaylistForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Toggle music search panel
   */
  toggleMusicSearch(): void {
    this.showMusicSearch.update(show => !show);
  }

  /**
   * Handle playlist selection from playlist manager
   */
  onPlaylistSelected(playlist: Playlist): void {
    this.message.success(`Selected playlist: ${playlist.name}`);
    // You can add navigation or other actions here
  }

  /**
   * Handle playlist deletion from playlist manager
   */
  onPlaylistDeleted(playlistId: string): void {
    this.message.info('Playlist deleted successfully');
  }

  /**
   * Navigate to specific tab
   */
  switchToTab(index: number): void {
    this.activeTab.set(index);
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    return this.playlistService.formatDuration(seconds);
  }

  /**
   * Get validation error message
   */
  getErrorMessage(controlName: string): string {
    const control = this.createPlaylistForm.get(controlName);

    if (!control || !control.errors) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return `${this.capitalizeFirst(controlName)} is required`;
    }

    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `${this.capitalizeFirst(controlName)} must be at least ${minLength} characters`;
    }

    return 'Invalid input';
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string): boolean {
    const control = this.createPlaylistForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
