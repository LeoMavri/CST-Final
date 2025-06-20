export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserResponse {
  user: User;
}

export interface Friend {
  id: string;
  name: string;
  surname: string;
  phone: string;
  city: string;
  birthday: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFriendRequest {
  name: string;
  surname: string;
  phone: string;
  city: string;
  birthday: string; // Format: YYYY-MM-DD
}

export interface UpdateFriendRequest {
  name?: string;
  surname?: string;
  phone?: string;
  city?: string;
  birthday?: string;
}

export interface BirthdayReminder {
  id: string;
  friendId: string;
  friend: Friend;
  daysUntil: number;
  isToday: boolean;
  age: number;
}

export interface ApiError {
  error: string;
  details?: any[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
