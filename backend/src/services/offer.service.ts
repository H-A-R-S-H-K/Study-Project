import { Types } from 'mongoose';
import { offerRepository } from '../repositories/offer.repository.js';
import { requestRepository } from '../repositories/request.repository.js';
import { vehicleRepository } from '../repositories/vehicle.repository.js';
import { chatRepository } from '../repositories/chat.repository.js';
import {
  toOfferDto,
  toOfferDetailDto,
  type OfferDto,
  type OfferDetailDto,
} from '../dtos/offer.dto.js';
import { toRequestDto, type RequestDto } from '../dtos/request.dto.js';
import { notificationService } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, type PaginationOptions } from '../utils/pagination.js';
import type { PaginationMeta } from '../utils/ApiResponse.js';
import {
  NotificationType,
  OfferStatus,
  ProviderType,
  RequestStatus,
  ServiceType,
  UserRole,
} from '../types/enums.js';

export interface CreateOfferInput {
  price: number;
  message?: string;
  vehicleId?: string;
}

export interface AcceptResult {
  request: RequestDto;
  chatId: string;
}

/** Provider roles → the offer's providerType. */
const PROVIDER_TYPE_FOR_ROLE: Record<string, ProviderType> = {
  [UserRole.VEHICLE_OWNER]: ProviderType.VEHICLE_OWNER,
  [UserRole.DRIVER]: ProviderType.DRIVER,
};

class OfferService {
  /**
   * A provider offers on a request. PRICE IS ENTERED BY THE PROVIDER — the
   * platform never computes, suggests, or validates it beyond sanity bounds
   * (handled by the schema). This method is the whole of "pricing".
   */
  async create(
    providerId: string,
    role: string,
    requestId: string,
    input: CreateOfferInput,
  ): Promise<OfferDto> {
    const providerType = PROVIDER_TYPE_FOR_ROLE[role];
    if (!providerType) throw ApiError.forbidden('Only providers can send offers');

    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.status !== RequestStatus.OPEN) {
      throw ApiError.conflict('This request is no longer accepting offers');
    }
    if (request.customer.toString() === providerId) {
      throw ApiError.badRequest('You cannot offer on your own request');
    }

    this.assertRoleCanFulfil(providerType, request.serviceType);

    // Vehicle owners must attach one of their available vehicles.
    let vehicleObjectId: Types.ObjectId | undefined;
    if (providerType === ProviderType.VEHICLE_OWNER) {
      if (!input.vehicleId) throw ApiError.badRequest('Select a vehicle for this offer');
      const vehicle = await vehicleRepository.findOwnedById(input.vehicleId, providerId);
      if (!vehicle) throw ApiError.badRequest('Vehicle not found');
      if (!vehicle.isAvailable) throw ApiError.badRequest('That vehicle is marked unavailable');
      if (request.vehicleType && vehicle.type !== request.vehicleType) {
        throw ApiError.badRequest(
          `This request needs a ${request.vehicleType}, not a ${vehicle.type}`,
        );
      }
      vehicleObjectId = vehicle._id;
    }

    // One active offer per provider per request (also enforced by a DB index).
    const existing = await offerRepository.findActive(requestId, providerId);
    if (existing) throw ApiError.conflict('You already have an active offer on this request');

    const offer = await offerRepository.create({
      request: new Types.ObjectId(requestId),
      provider: new Types.ObjectId(providerId),
      providerType,
      vehicle: vehicleObjectId,
      price: input.price,
      message: input.message,
      status: OfferStatus.PENDING,
    });
    await requestRepository.incrementOffers(requestId, 1);

    await notificationService.notify(request.customer.toString(), {
      type: NotificationType.NEW_OFFER,
      title: 'New offer received',
      body: `A provider offered ₹${input.price} for your request.`,
      data: { requestId, offerId: offer._id.toString(), kind: NotificationType.NEW_OFFER },
    });
    return toOfferDto(offer);
  }

  /** The request owner views all offers on their request (their inbox). */
  async listForRequest(customerId: string, requestId: string): Promise<OfferDetailDto[]> {
    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.customer.toString() !== customerId) {
      throw ApiError.forbidden('You cannot view offers on this request');
    }
    const rows = await offerRepository.listForRequest(requestId);
    return rows.map(toOfferDetailDto);
  }

  async listMine(
    providerId: string,
    page: PaginationOptions,
  ): Promise<{ items: OfferDto[]; meta: PaginationMeta }> {
    const { items, total } = await offerRepository.listByProvider(providerId, page);
    return {
      items: items.map(toOfferDto),
      meta: buildPaginationMeta(total, page.page, page.limit),
    };
  }

  async withdraw(providerId: string, offerId: string): Promise<OfferDto> {
    const offer = await offerRepository.findById(offerId);
    if (!offer) throw ApiError.notFound('Offer not found');
    if (offer.provider.toString() !== providerId) {
      throw ApiError.forbidden('You cannot withdraw this offer');
    }
    if (offer.status !== OfferStatus.PENDING) {
      throw ApiError.conflict(`A ${offer.status} offer cannot be withdrawn`);
    }
    const updated = await offerRepository.setStatus(offerId, OfferStatus.WITHDRAWN);
    await requestRepository.incrementOffers(offer.request.toString(), -1);
    return toOfferDto(updated!);
  }

  /**
   * The customer accepts one offer. Order matters and avoids transactions:
   *   1. Atomically claim the OPEN request → MATCHED (guards double-accept).
   *   2. Mark the chosen offer accepted; reject the rest.
   *   3. Open the chat and link it back to the request.
   */
  async accept(customerId: string, requestId: string, offerId: string): Promise<AcceptResult> {
    const offer = await offerRepository.findById(offerId);
    if (!offer || offer.request.toString() !== requestId) {
      throw ApiError.notFound('Offer not found for this request');
    }
    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.customer.toString() !== customerId) {
      throw ApiError.forbidden('You cannot accept offers on this request');
    }
    if (offer.status !== OfferStatus.PENDING) {
      throw ApiError.conflict('This offer is no longer available');
    }

    const providerId = offer.provider.toString();
    const matched = await requestRepository.claimMatch(requestId, offerId, providerId);
    if (!matched) throw ApiError.conflict('This request has already been matched or closed');

    await offerRepository.setStatus(offerId, OfferStatus.ACCEPTED);
    await offerRepository.rejectOthers(requestId, offerId);

    const chat = await chatRepository.openForRequest(requestId, customerId, providerId);
    const withChat = await requestRepository.updateById(requestId, { chat: chat._id });

    await notificationService.notify(providerId, {
      type: NotificationType.OFFER_ACCEPTED,
      title: 'Your offer was accepted!',
      body: 'The customer accepted your offer. A chat has opened.',
      data: { requestId, chatId: chat._id.toString(), kind: NotificationType.OFFER_ACCEPTED },
    });
    return { request: toRequestDto(withChat ?? matched), chatId: chat._id.toString() };
  }

  /** Either party marks a matched job complete (enables rating in Phase 9). */
  async complete(userId: string, requestId: string): Promise<RequestDto> {
    const request = await requestRepository.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    const isParty =
      request.customer.toString() === userId ||
      request.selectedProvider?.toString() === userId;
    if (!isParty) throw ApiError.forbidden('Only the customer or matched provider can complete');

    const completed = await requestRepository.claimComplete(requestId);
    if (!completed) throw ApiError.conflict('Only a matched job can be completed');

    // Notify the other party so both sides know it's done (and can rate).
    const otherParty =
      request.customer.toString() === userId
        ? request.selectedProvider?.toString()
        : request.customer.toString();
    if (otherParty) {
      await notificationService.notify(otherParty, {
        type: NotificationType.RIDE_COMPLETED,
        title: 'Job completed',
        body: 'The job was marked complete. You can now leave a rating.',
        data: { requestId, kind: NotificationType.RIDE_COMPLETED },
      });
    }
    return toRequestDto(completed);
  }

  private assertRoleCanFulfil(providerType: ProviderType, serviceType: ServiceType): void {
    const ok =
      providerType === ProviderType.VEHICLE_OWNER
        ? serviceType === ServiceType.VEHICLE_ONLY ||
          serviceType === ServiceType.VEHICLE_AND_DRIVER
        : serviceType === ServiceType.DRIVER_ONLY;
    if (!ok) {
      throw ApiError.forbidden('Your role cannot fulfil this type of request');
    }
  }
}

export const offerService = new OfferService();
