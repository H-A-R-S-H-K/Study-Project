import { userRepository } from '../repositories/user.repository.js';
import { storageService, type UploadedFile } from './storage.service.js';
import { toUserDto, type UserDto } from '../dtos/user.dto.js';
import { ApiError } from '../utils/ApiError.js';
import type { GeoPoint } from '../models/geo.schema.js';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  homeAddress?: string;
}

/** Profile self-service for any authenticated user, regardless of role. */
class UserService {
  async updateProfile(userId: string, patch: UpdateProfileInput): Promise<UserDto> {
    const user = await userRepository.updateById(userId, patch);
    if (!user) throw ApiError.notFound('User not found');
    return toUserDto(user);
  }

  /** Update last-known location — feeds "nearby" geo queries. */
  async updateLocation(userId: string, location: GeoPoint): Promise<UserDto> {
    const user = await userRepository.updateById(userId, { location });
    if (!user) throw ApiError.notFound('User not found');
    return toUserDto(user);
  }

  async updateAvatar(userId: string, file: UploadedFile): Promise<UserDto> {
    const asset = await storageService.upload(file, 'avatars');
    const user = await userRepository.updateById(userId, { avatarUrl: asset.url });
    if (!user) throw ApiError.notFound('User not found');
    return toUserDto(user);
  }

  async getPublicProfile(userId: string): Promise<UserDto> {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return toUserDto(user);
  }
}

export const userService = new UserService();
