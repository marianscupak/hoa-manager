import {
  memberRef,
  ownerRef,
  type RepresentativeRef,
} from '@/modules/voting/domain/vote/representative-ref';
import { ConsentTargetInvalidException } from '@/shared/application/exceptions/vote.exceptions';

/** The consent target as the API receives it: exactly one id must be set. */
export interface ConsentTargetInput {
  toOwnerId?: string;
  toMembershipId?: string;
}

/**
 * Turns the API shape into a person ref, refusing "both" and "neither".
 * Whether the person may be named (exists, is not the association, is an
 * active member, is not the grantor) is the handler's job.
 */
export function toRepresentativeRef(
  target: ConsentTargetInput,
): RepresentativeRef {
  const { toOwnerId, toMembershipId } = target;
  if ((toOwnerId === undefined) === (toMembershipId === undefined)) {
    throw new ConsentTargetInvalidException();
  }
  return toOwnerId !== undefined
    ? ownerRef(toOwnerId)
    : memberRef(toMembershipId as string);
}
