import { planOptionPersistence } from './option-persistence';

describe('planOptionPersistence', () => {
  it('plans no deletes or inserts when the option set is unchanged, only updates', () => {
    const existingIds = ['opt-1', 'opt-2'];
    const aggregateOptions = [{ id: 'opt-1' }, { id: 'opt-2' }];

    expect(planOptionPersistence(existingIds, aggregateOptions)).toEqual({
      toDelete: [],
      toUpdate: ['opt-1', 'opt-2'],
      toInsert: [],
    });
  });

  it('plans an insert for an option added to the aggregate', () => {
    const existingIds = ['opt-1'];
    const aggregateOptions = [{ id: 'opt-1' }, { id: 'opt-2' }];

    expect(planOptionPersistence(existingIds, aggregateOptions)).toEqual({
      toDelete: [],
      toUpdate: ['opt-1'],
      toInsert: ['opt-2'],
    });
  });

  it('plans a delete for an option removed from the aggregate', () => {
    const existingIds = ['opt-1', 'opt-2'];
    const aggregateOptions = [{ id: 'opt-1' }];

    expect(planOptionPersistence(existingIds, aggregateOptions)).toEqual({
      toDelete: ['opt-2'],
      toUpdate: ['opt-1'],
      toInsert: [],
    });
  });

  it('plans deletes and inserts for fully disjoint sets, with no updates', () => {
    const existingIds = ['opt-1', 'opt-2'];
    const aggregateOptions = [{ id: 'opt-3' }, { id: 'opt-4' }];

    expect(planOptionPersistence(existingIds, aggregateOptions)).toEqual({
      toDelete: ['opt-1', 'opt-2'],
      toUpdate: [],
      toInsert: ['opt-3', 'opt-4'],
    });
  });

  it('plans only inserts when there are no existing options', () => {
    const existingIds: string[] = [];
    const aggregateOptions = [{ id: 'opt-1' }, { id: 'opt-2' }];

    expect(planOptionPersistence(existingIds, aggregateOptions)).toEqual({
      toDelete: [],
      toUpdate: [],
      toInsert: ['opt-1', 'opt-2'],
    });
  });

  it('plans only deletes when the aggregate has no options left', () => {
    const existingIds = ['opt-1', 'opt-2'];
    const aggregateOptions: { id: string }[] = [];

    expect(planOptionPersistence(existingIds, aggregateOptions)).toEqual({
      toDelete: ['opt-1', 'opt-2'],
      toUpdate: [],
      toInsert: [],
    });
  });

  it('plans nothing when both sets are empty', () => {
    expect(planOptionPersistence([], [])).toEqual({
      toDelete: [],
      toUpdate: [],
      toInsert: [],
    });
  });
});
