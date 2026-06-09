import { userRepository } from '../repositories/user.repository.js';
import { requestRepository } from '../repositories/request.repository.js';
import { offerRepository } from '../repositories/offer.repository.js';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import { documentRepository } from '../repositories/document.repository.js';
import { driverRepository } from '../repositories/driver.repository.js';
import { notificationService } from './notification.service.js';
import { toUserDto, type UserDto } from '../dtos/user.dto.js';
import { toVehicleDto, type VehicleDto } from '../dtos/vehicle.dto.js';
import { toRequestDto, type RequestDto } from '../dtos/request.dto.js';
import { toAdminDocumentDto, type AdminStatsDto, type AdminDocumentDto } from '../dtos/admin.dto.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, type PaginationOptions } from '../utils/pagination.js';
import type { PaginationMeta } from '../utils/ApiResponse.js';
import {
  DocumentType,
  RequestStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../types/enums.js';

interface Paged<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Admin operations backing the web dashboard. Read-mostly, with two mutations:
 * suspend/activate a user, and verify/reject a document (which cascades to the
 * owning driver/vehicle and notifies the owner).
 */
class AdminService {
  async stats(): Promise<AdminStatsDto> {
    const [
      users,
      customers,
      vehicleOwners,
      drivers,
      suspended,
      reqTotal,
      open,
      matched,
      completed,
      cancelled,
      offers,
      vehicles,
      pendingDocs,
    ] = await Promise.all([
      userRepository.count({ role: { $ne: UserRole.ADMIN } }),
      userRepository.count({ role: UserRole.CUSTOMER }),
      userRepository.count({ role: UserRole.VEHICLE_OWNER }),
      userRepository.count({ role: UserRole.DRIVER }),
      userRepository.count({ status: UserStatus.SUSPENDED }),
      requestRepository.count({}),
      requestRepository.count({ status: RequestStatus.OPEN }),
      requestRepository.count({ status: RequestStatus.MATCHED }),
      requestRepository.count({ status: RequestStatus.COMPLETED }),
      requestRepository.count({ status: RequestStatus.CANCELLED }),
      offerRepository.count({}),
      vehicleRepository.count({}),
      documentRepository.count({ status: VerificationStatus.PENDING }),
    ]);

    return {
      users: { total: users, customers, vehicleOwners, drivers, suspended },
      requests: { total: reqTotal, open, matched, completed, cancelled },
      offers: { total: offers },
      vehicles: { total: vehicles },
      documents: { pending: pendingDocs },
    };
  }

  async listUsers(
    filters: { search?: string; role?: string; status?: string },
    page: PaginationOptions,
  ): Promise<Paged<UserDto>> {
    const query: Record<string, unknown> = { role: { $ne: UserRole.ADMIN } };
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      const rx = new RegExp(escapeRegex(filters.search), 'i');
      query.$or = [{ name: rx }, { phone: rx }, { email: rx }];
    }
    const { items, total } = await userRepository.paginate(query, page);
    return { items: items.map(toUserDto), meta: buildPaginationMeta(total, page.page, page.limit) };
  }

  async setUserStatus(userId: string, status: UserStatus): Promise<UserDto> {
    const user = await userRepository.updateById(userId, { status });
    if (!user) throw ApiError.notFound('User not found');
    return toUserDto(user);
  }

  async documentQueue(status: string | undefined, page: PaginationOptions): Promise<Paged<AdminDocumentDto>> {
    const { items, total } = await documentRepository.queue(status, page);
    const owners = await userRepository.find(
      { _id: { $in: items.map((d) => d.owner) } },
      undefined,
      { _id: 1, name: 1, phone: 1, role: 1 },
    );
    const byId = new Map(owners.map((o) => [o._id.toString(), o]));
    return {
      items: items.map((d) => toAdminDocumentDto(d, byId.get(d.owner.toString()))),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }

  /** Approve/reject a document and cascade the decision to the owning entity. */
  async verifyDocument(
    documentId: string,
    reviewerId: string,
    decision: VerificationStatus,
    reason?: string,
  ): Promise<AdminDocumentDto> {
    const doc = await documentRepository.findById(documentId);
    if (!doc) throw ApiError.notFound('Document not found');

    const updated = await documentRepository.updateById(documentId, {
      status: decision,
      reviewedBy: reviewerId as never,
      reviewedAt: new Date(),
      rejectionReason: decision === VerificationStatus.REJECTED ? reason : undefined,
    });

    const verified = decision === VerificationStatus.VERIFIED;
    if (doc.type === DocumentType.DRIVING_LICENSE) {
      await driverRepository.setLicenseVerifiedByDoc(documentId, verified);
    } else if (doc.type === DocumentType.VEHICLE_REGISTRATION) {
      await vehicleRepository.setRegistrationVerifiedByDoc(documentId, verified);
    }

    await notificationService.notify(doc.owner.toString(), {
      type: 'document_verified',
      title: verified ? 'Document verified' : 'Document rejected',
      body: verified
        ? 'Your document was verified.'
        : `Your document was rejected${reason ? `: ${reason}` : '.'}`,
      data: { documentId, kind: 'document_verified' },
    });

    const owner = await userRepository.findById(doc.owner, { name: 1, phone: 1, role: 1 });
    return toAdminDocumentDto(updated!, owner ?? undefined);
  }

  async listVehicles(page: PaginationOptions): Promise<Paged<VehicleDto>> {
    const { items, total } = await vehicleRepository.paginate({}, page);
    return {
      items: items.map(toVehicleDto),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }

  async listRequests(status: string | undefined, page: PaginationOptions): Promise<Paged<RequestDto>> {
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    const { items, total } = await requestRepository.paginate(query, page);
    return {
      items: items.map(toRequestDto),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const adminService = new AdminService();
