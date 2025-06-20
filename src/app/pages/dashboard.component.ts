import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  format,
  differenceInDays,
  differenceInYears,
  addYears,
  isBefore,
  isToday,
} from 'date-fns';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { BirthdayApiService } from '../services/birthdays.service';
import {
  Friend,
  CreateFriendRequest,
  UpdateFriendRequest,
  BirthdayReminder,
} from '../services/birthdays.interface';
import { FriendFormComponent } from '../components/friend-form.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzButtonModule,
    NzTableModule,
    NzInputModule,
    NzModalModule,
    NzMessageModule,
    NzPopconfirmModule,
    NzCardModule,
    NzStatisticModule,
    NzAlertModule,
    NzTagModule,
    NzGridModule,
    FriendFormComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private apiService = inject(BirthdayApiService);
  private router = inject(Router);

  // Signals
  friends = signal<Friend[]>([]);
  filteredFriends = signal<Friend[]>([]);
  birthdays = signal<BirthdayReminder[]>([]);
  nextBirthday = signal<BirthdayReminder | null>(null);
  todaysBirthdays = signal<BirthdayReminder[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  // Modal states
  isAddModalVisible = signal(false);
  isEditModalVisible = signal(false);
  editingFriend = signal<Friend | null>(null);
  modalLoading = signal(false);

  // User info
  currentUser$ = this.apiService.currentUser$;

  // Computed values
  totalFriends = computed(() => this.friends().length);
  upcomingBirthdays = computed(() => {
    const friends = this.friends();
    return friends.filter(friend => {
      const daysUntil = this.getDaysUntilBirthday(friend.birthday);
      return daysUntil >= 0 && daysUntil <= 7;
    }).length;
  });

  // Compute today's birthdays from friends list
  todaysBirthdaysComputed = computed(() => {
    const friends = this.friends();
    return friends
      .filter(friend => {
        const daysUntil = this.getDaysUntilBirthday(friend.birthday);
        return daysUntil === 0;
      })
      .map(friend => ({
        friend,
        age: this.calculateAge(friend.birthday),
        daysUntil: 0,
        isToday: true,
        id: friend.id,
        friendId: friend.id,
      }));
  });

  // Compute next birthday from friends list since API might not return it
  nextBirthdayComputed = computed(() => {
    const friends = this.friends();
    if (friends.length === 0) return null;

    const friendsWithDays = friends.map(friend => ({
      friend,
      daysUntil: this.getDaysUntilBirthday(friend.birthday),
      age: this.calculateAge(friend.birthday),
    }));

    // Sort by days until birthday and get the closest one
    const sortedByDays = friendsWithDays
      .filter(f => f.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return sortedByDays.length > 0 ? sortedByDays[0] : null;
  });

  // Table sorting
  sortField = signal<string | null>(null);
  sortOrder = signal<'asc' | 'desc' | null>(null);

  constructor() {
    // Setup search effect in injection context with allowSignalWrites
    effect(
      () => {
        const query = this.searchQuery();
        const friends = this.friends();

        if (!query.trim()) {
          this.filteredFriends.set(friends);
        } else {
          const filtered = friends.filter(
            friend =>
              friend.name.toLowerCase().includes(query.toLowerCase()) ||
              friend.surname.toLowerCase().includes(query.toLowerCase()) ||
              friend.phone.includes(query) ||
              friend.city.toLowerCase().includes(query.toLowerCase())
          );
          this.filteredFriends.set(filtered);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loadFriends();
    this.loadBirthdays();
    this.loadNextBirthday();
    this.loadTodaysBirthdays();
  }

  private loadFriends() {
    this.loading.set(true);
    this.apiService.getFriends().subscribe({
      next: friends => {
        this.friends.set(friends);
        this.filteredFriends.set(friends);
        this.loading.set(false);
      },
      error: error => {
        console.error('Error loading friends:', error);
        this.loading.set(false);
      },
    });
  }

  private loadBirthdays() {
    this.apiService.getBirthdays().subscribe({
      next: birthdays => {
        this.birthdays.set(birthdays);
      },
      error: error => {
        console.error('Error loading birthdays:', error);
      },
    });
  }

  private loadNextBirthday() {
    this.apiService.getNextBirthday().subscribe({
      next: birthday => {
        this.nextBirthday.set(birthday);
      },
      error: error => {
        console.error('Error loading next birthday:', error);
      },
    });
  }

  private loadTodaysBirthdays() {
    this.apiService.getTodaysBirthdays().subscribe({
      next: birthdays => {
        this.todaysBirthdays.set(birthdays);
      },
      error: error => {
        console.error("Error loading today's birthdays:", error);
      },
    });
  }

  // Table operations
  onSort(field: string) {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }

    const sorted = [...this.filteredFriends()].sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];

      if (this.sortOrder() === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredFriends.set(sorted);
  }

  // Modal operations
  showAddModal() {
    this.isAddModalVisible.set(true);
  }

  showEditModal(friend: Friend) {
    this.editingFriend.set(friend);
    this.isEditModalVisible.set(true);
  }

  hideAddModal() {
    this.isAddModalVisible.set(false);
  }

  hideEditModal() {
    this.isEditModalVisible.set(false);
    this.editingFriend.set(null);
  }

  // CRUD operations
  onSaveFriend(friendData: CreateFriendRequest | UpdateFriendRequest) {
    this.modalLoading.set(true);
    this.apiService.createFriend(friendData as CreateFriendRequest).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.hideAddModal();
        this.loadData(); // Refresh all data
      },
      error: error => {
        console.error('Error creating friend:', error);
        this.modalLoading.set(false);
      },
    });
  }

  onUpdateFriend(friendData: UpdateFriendRequest) {
    if (!this.editingFriend()) return;

    this.modalLoading.set(true);
    this.apiService
      .updateFriend(this.editingFriend()!.id, friendData)
      .subscribe({
        next: () => {
          this.modalLoading.set(false);
          this.hideEditModal();
          this.loadData(); // Refresh all data
        },
        error: error => {
          console.error('Error updating friend:', error);
          this.modalLoading.set(false);
        },
      });
  }

  onDeleteFriend(friend: Friend) {
    this.apiService.deleteFriend(friend.id).subscribe({
      next: () => {
        this.loadData(); // Refresh all data
      },
      error: error => {
        console.error('Error deleting friend:', error);
      },
    });
  }

  // Utility methods
  formatDate(dateString: string): string {
    return format(new Date(dateString), 'MMM dd, yyyy');
  }

  calculateAge(birthday: string): number {
    return differenceInYears(new Date(), new Date(birthday));
  }

  getDaysUntilBirthday(birthday: string): number {
    try {
      const today = new Date();
      const birthDate = new Date(birthday);

      // Create this year's birthday
      let nextBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      // If birthday has passed this year, set to next year
      if (isBefore(nextBirthday, today) && !isToday(nextBirthday)) {
        nextBirthday = addYears(nextBirthday, 1);
      }

      const days = differenceInDays(nextBirthday, today);
      return Math.max(0, days);
    } catch (error) {
      console.error('Error calculating days until birthday:', error);
      return 0;
    }
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  logout() {
    this.apiService.logout();
    this.router.navigate(['/auth']);
  }
}
