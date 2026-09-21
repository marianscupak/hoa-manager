import { isRecordableOnPaper } from './paper-ballot-eligibility';
import { ElectorateIneligibleReason } from './vote.types';

describe('isRecordableOnPaper', () => {
  it('lets the board record a unit that is eligible in the app too', () => {
    expect(isRecordableOnPaper(null)).toBe(true);
  });

  it('lets the board record a unit with no common representative: a signed ballot from the owner needs no app account', () => {
    expect(
      isRecordableOnPaper(ElectorateIneligibleReason.NO_REPRESENTATIVE),
    ).toBe(true);
  });

  it('refuses a unit the association owns', () => {
    expect(
      isRecordableOnPaper(ElectorateIneligibleReason.ASSOCIATION_OWNED),
    ).toBe(false);
  });

  it('refuses a unit with no owner on record', () => {
    expect(
      isRecordableOnPaper(ElectorateIneligibleReason.MISSING_OWNERSHIP),
    ).toBe(false);
  });
});
