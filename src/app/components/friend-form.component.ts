import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import {
  Friend,
  CreateFriendRequest,
  UpdateFriendRequest,
} from '../services/birthdays.interface';
import {
  phoneValidator,
  birthdateValidator,
} from '../validators/custom-validators';

@Component({
  selector: 'app-friend-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzDatePickerModule,
    NzGridModule,
  ],
  templateUrl: './friend-form.component.html',
  styleUrl: './friend-form.component.scss',
})
export class FriendFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() friend: Friend | null = null;
  @Input() loading = false;

  @Output() save = new EventEmitter<
    CreateFriendRequest | UpdateFriendRequest
  >();
  @Output() formCancel = new EventEmitter<void>();

  friendForm!: FormGroup;
  isEditMode = signal(false);

  ngOnInit() {
    this.isEditMode.set(!!this.friend);
    this.initializeForm();
  }

  private initializeForm() {
    this.friendForm = this.fb.group({
      name: [
        this.friend?.name || '',
        [Validators.required, Validators.minLength(2)],
      ],
      surname: [
        this.friend?.surname || '',
        [Validators.required, Validators.minLength(2)],
      ],
      phone: [this.friend?.phone || '', [Validators.required, phoneValidator]],
      city: [
        this.friend?.city || '',
        [Validators.required, Validators.minLength(2)],
      ],
      birthday: [
        this.friend?.birthday ? new Date(this.friend.birthday) : null,
        [Validators.required, birthdateValidator],
      ],
    });
  }

  onSubmit() {
    if (this.friendForm.valid) {
      const formValue = this.friendForm.value;
      const friendData = {
        ...formValue,
        birthday: formValue.birthday.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      };

      this.save.emit(friendData);
    }
  }

  onCancel() {
    this.formCancel.emit();
  }

  disabledDate = (current: Date): boolean => {
    return current > new Date();
  };
}
