import { isRecordableOnPaper } from './paper-ballot-eligibility';

describe('isRecordableOnPaper', () => {
  it('lets the board record an eligible unit, whether or not the representative has an account', () => {
    expect(isRecordableOnPaper({ eligibilityStatus: 'ELIGIBLE' })).toBe(true);
  });

  it('refuses a unit whose co-owners never settled on a representative: per rollam that is agreed before the vote opens', () => {
    expect(isRecordableOnPaper({ eligibilityStatus: 'INELIGIBLE' })).toBe(
      false,
    );
  });
});
