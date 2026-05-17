import { Types } from 'mongoose';
import { requestRepository } from '../repositories/request.repository.js';
import { driverRepository } from '../repositories/driver.repository.js';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import {
  toRequestDto,
  toFeedRequestDto,
  type RequestDto,
  type FeedRequestDto,
} from '../dtos/request.dto.js';
import { notificationService } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, type PaginationOptions } from '../utils/pagination.js';
import type { PaginationMeta } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';
import {
  NotificationType,
  RequestStatus,
  ServiceType,
  UserRole,
  type VehicleType,
} from '../types/enums.js';
import type { Place, GeoPoint } from '../models/geo.schema.js';
import type { IRequest } from '../models/index.js';

export interface CreateRequestInput {
  pickup: Place;
  destination: Place;
  serviceType: ServiceType;
  vehicleType?: VehicleType;
  scheduledAt: Date;
  description?: string;
}

export interface FeedQuery {
  lng: number;
  lat: number;
  radius?: number;
  vehicleType?: VehicleType;
}

/** Which service types a provider role can fulfil (drives the feed filter). */
const SERVICE_TYPES_FOR_ROLE: Record<string, ServiceType[]> = {
  [UserRole.VEHICLE_OWNER]: [ServiceType.VEHICLE_ONLY, ServiceType.VEHICLE_AND_DRIVER],
  [UserRole.DRIVER]: [ServiceType.DRIVER_ONLY],
};

// How long after the scheduled time an unmatched request stays open.
const EXPIRY_GRACE_MS = 6 * 60 * 60 * 1000;

class RequestService {
  async create(customerId: string, input: CreateRequestInput): Promise<RequestDto> {
    if (input.serviceType !== ServiceType.DRIVER_ONLY && !input.vehicleType) {
      throw ApiError.badRequest('A vehicle type is required for this service');
    }
    const scheduledAt = new Date(input.scheduledAt);
    const request = await requestRepository.create({
      customer: new Types.ObjectId(customerId),
      pickup: input.pickup,
      destination: input.destination,
      serviceType: input.serviceType,
      vehicleType: input.vehicleType,
      scheduledAt,
      description: input.description,
      status: RequestStatus.OPEN,
      expiresAt: new Date(scheduledAt.getTime() + EXPIRY_GRACE_MS),
    });

    // Fire-and-forget: alert nearby providers who can fulfil this request.
    void this.fanOutNewRequest(request);
    return toRequestDto(request);
  }

  /**
   * Notify nearby, available providers that can fulfil a new request. Vehicle
   * requests reach vehicle owners with a matching available vehicle; driver-only
   * requests reach drivers who can drive the requested category. Capped so a
   * dense area doesn't produce an unbounded fan-out.
   */
  private async fanOutNewRequest(request: IRequest): Promise<void> {
    const point: GeoPoint = request.pickup.location;
    const radius = env.DEFAULT_NEARBY_RADIUS_METERS;
    const CAP = 25;
    const recipientIds = new Set<string>();

    if (request.serviceType === ServiceType.DRIVER_ONLY) {
      const drivers = await driverRepository.findNearbyAvailable(
        point,
        radius,
        request.vehicleType,
        CAP,
      );
      drivers.forEach((d) => recipientIds.add(d.driverUser._id.toString()));
    } else {
      const vehicles = await vehicleRepository.findNearbyAvailable(
        point,
        radius,
        request.vehicleType,
        CAP,
      );
      vehicles.forEach((v) => recipientIds.add(v.ownerUser._id.toString()));
    }

    if (recipientIds.size === 0) return;
    await notificationService.notifyMany([...recipientIds], {
      type: NotificationType.NEW_NEARBY_REQUEST,
      title: 'New request near you',
      body: `${request.pickup.address} → ${request.destination.address}`,
      data: { requestId: request._id.toString(), kind: NotificationType.NEW_NEARBY_REQUEST },
    });
  }

  async getById(requesterId: string, role: string, requestId: string): Promise<RequestDto> {
    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');

    const isOwner = request.customer.toString() === requesterId;
    const isSelectedProvider = request.selectedProvider?.toString() === requesterId;
    const isProvider = role === UserRole.VEHICLE_OWNER || role === UserRole.DRIVER;

    // Owner and the matched provider always; other providers only while it's open.
    if (!isOwner && !isSelectedProvider && !(isProvider && request.status === RequestStatus.OPEN)) {
      throw ApiError.forbidden('You cannot view this request');
    }
    return toRequestDto(request);
  }

  async listMine(
    customerId: string,
    status: string | undefined,
    page: PaginationOptions,
  ): Promise<{ items: RequestDto[]; meta: PaginationMeta }> {
    const { items, total } = await requestRepository.listByCustomer(customerId, status, page);
    return {
      items: items.map(toRequestDto),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }

  async cancel(customerId: string, requestId: string, reason?: string): Promise<RequestDto> {
    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.customer.toString() !== customerId) {
      throw ApiError.forbidden('You cannot cancel this request');
    }
    const cancellable: RequestStatus[] = [RequestStatus.OPEN, RequestStatus.MATCHED];
    if (!cancellable.includes(request.status)) {
      throw ApiError.conflict(`A ${request.status} request cannot be cancelled`);
    }
    const wasMatched = request.status === RequestStatus.MATCHED;
    const provider = request.selectedProvider?.toString();

    const updated = await requestRepository.updateById(requestId, {
      status: RequestStatus.CANCELLED,
      cancelledBy: new Types.ObjectId(customerId),
      cancelReason: reason,
    });

    // If a provider was already matched, tell them the booking is off.
    if (wasMatched && provider) {
      await notificationService.notify(provider, {
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Booking cancelled',
        body: 'The customer cancelled the matched request.',
        data: { requestId, kind: NotificationType.BOOKING_CANCELLED },
      });
    }
    return toRequestDto(updated!);
  }

  /** The nearby-request feed for a provider, scoped to what their role can fulfil. */
  async feedForProvider(
    providerId: string,
    role: string,
    q: FeedQuery,
  ): Promise<FeedRequestDto[]> {
    const serviceTypes = SERVICE_TYPES_FOR_ROLE[role];
    if (!serviceTypes) throw ApiError.forbidden('Only providers can browse requests');

    // Drivers only see requests for vehicle types they can actually drive.
    let vehicleTypes: string[] | undefined;
    if (q.vehicleType) {
      vehicleTypes = [q.vehicleType];
    } else if (role === UserRole.DRIVER) {
      const profile = await driverRepository.findByUser(providerId);
      vehicleTypes = profile?.vehicleCategories ?? [];
      if (vehicleTypes.length === 0) return []; // no categories set → nothing to show
    }

    const rows = await requestRepository.findNearbyOpen({
      point: { type: 'Point', coordinates: [q.lng, q.lat] },
      radiusMeters: Math.min(q.radius ?? env.DEFAULT_NEARBY_RADIUS_METERS, 100_000),
      serviceTypes,
      vehicleTypes,
      limit: 50,
    });
    return rows.map(toFeedRequestDto);
  }
}

export const requestService = new RequestService();
