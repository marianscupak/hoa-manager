import {
  BallotAlreadyCastException,
  InvalidBallotAnswersException,
  NotAUnitOwnerException,
  UnitNotEligibleException,
  VoteDocumentNotFoundException,
  VoteDocumentUploadIncompleteException,
  VoteNotFoundException,
  VoteNotOpenException,
} from '@/shared/application/exceptions/vote.exceptions';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';

import { RecordPaperBallotCommand } from './record-paper-ballot.command';
import { RecordPaperBallotHandler } from './record-paper-ballot.handler';

describe('RecordPaperBallotHandler', () => {
  const readRepo = {
    findDetailById: jest.fn(),
    isActiveUnitOwner: jest.fn(),
  };
  const writeRepo = {
    findElectorateUnit: jest.fn(),
    hasExistingBallots: jest.fn(),
    saveBallots: jest.fn(),
  };
  const documentRepo = {
    findById: jest.fn(),
    isAttachmentLinked: jest.fn(),
    markUploaded: jest.fn(),
  };
  const storage = { head: jest.fn() };
  const uow = { execute: jest.fn((fn: () => Promise<unknown>) => fn()) };
  const clock = { now: () => new Date('2026-09-15T10:00:00Z') };
  const auditService = { append: jest.fn() };
  const auditContext = {
    requireActor: () => ({ type: 'USER', userId: 'user-1' }),
  };
  const labelResolver = {
    resolveActorLabel: jest.fn().mockResolvedValue('Board Member'),
    resolveUnitLabel: jest.fn().mockResolvedValue('A1'),
    resolveOwnerLabel: jest.fn().mockResolvedValue('Jana Nováková'),
  };

  let handler: RecordPaperBallotHandler;

  const command = () =>
    new RecordPaperBallotCommand(
      'tenant-1',
      'vote-1',
      'mem-admin',
      'unit-1',
      'owner-3',
      'doc-1',
      [{ questionId: 'q1', optionId: 'o1' }],
    );

  beforeEach(() => {
    jest.clearAllMocks();
    readRepo.findDetailById.mockResolvedValue({
      id: 'vote-1',
      title: 'Windows',
      status: VoteStatus.OPEN,
      questions: [
        {
          id: 'q1',
          title: 'Replace windows?',
          options: [{ id: 'o1', label: 'Yes' }],
        },
      ],
    });
    readRepo.isActiveUnitOwner.mockResolvedValue(true);
    writeRepo.findElectorateUnit.mockResolvedValue({
      unitId: 'unit-1',
      representativeMembershipId: 'mem-owner',
      eligibilityStatus: 'ELIGIBLE',
    });
    writeRepo.hasExistingBallots.mockResolvedValue(new Set());
    writeRepo.saveBallots.mockResolvedValue([
      { ballotId: 'ballot-1', unitId: 'unit-1' },
    ]);
    documentRepo.findById.mockResolvedValue({
      id: 'doc-1',
      voteId: 'vote-1',
      kind: 'BALLOT',
      status: 'PENDING',
      objectKey: 'key-1',
      sizeBytes: 1024,
      fileName: 'ballot_A1.pdf',
    });
    documentRepo.isAttachmentLinked.mockResolvedValue(false);
    storage.head.mockResolvedValue({ sizeBytes: 1024 });

    handler = new RecordPaperBallotHandler(
      readRepo as never,
      writeRepo as never,
      documentRepo as never,
      storage as never,
      uow as never,
      clock as never,
      auditService as never,
      auditContext as never,
      labelResolver as never,
    );
  });

  it('saves a BOARD_PROXY ballot attributed to the signer, with the scan linked', async () => {
    const result = await handler.execute(command());

    expect(writeRepo.saveBallots).toHaveBeenCalledWith('tenant-1', 'vote-1', [
      {
        unitId: 'unit-1',
        castByMembershipId: 'mem-admin',
        castMethod: 'BOARD_PROXY',
        attributionOwnerId: 'owner-3',
        attachmentDocumentId: 'doc-1',
        answers: [{ questionId: 'q1', optionId: 'o1' }],
      },
    ]);
    expect(documentRepo.markUploaded).toHaveBeenCalledWith('tenant-1', 'doc-1');
    expect(result.submittedAt).toEqual(new Date('2026-09-15T10:00:00Z'));
  });

  it('appends a proxy audit event naming the signer and the scan', async () => {
    await handler.execute(command());

    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'VOTING.BALLOT_CAST_PROXY',
        payload: expect.objectContaining({
          unitId: 'unit-1',
          signerOwnerId: 'owner-3',
          labels: expect.objectContaining({
            signerLabel: 'Jana Nováková',
            attachmentFileName: 'ballot_A1.pdf',
            castBy: 'Board Member',
          }),
        }),
      }),
    );
  });

  it('rejects a vote that is not open', async () => {
    readRepo.findDetailById.mockResolvedValue({
      id: 'vote-1',
      status: VoteStatus.CLOSED,
      questions: [],
    });
    await expect(handler.execute(command())).rejects.toThrow(
      VoteNotOpenException,
    );
  });

  it('rejects a missing vote', async () => {
    readRepo.findDetailById.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteNotFoundException,
    );
  });

  it('rejects a unit the snapshot froze as ineligible', async () => {
    writeRepo.findElectorateUnit.mockResolvedValue({
      unitId: 'unit-1',
      representativeMembershipId: null,
      eligibilityStatus: 'INELIGIBLE',
    });
    await expect(handler.execute(command())).rejects.toThrow(
      UnitNotEligibleException,
    );
  });

  it('rejects a unit that is not in the electorate at all', async () => {
    writeRepo.findElectorateUnit.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toThrow(
      UnitNotEligibleException,
    );
  });

  it('rejects a unit that already voted', async () => {
    writeRepo.hasExistingBallots.mockResolvedValue(new Set(['unit-1']));
    await expect(handler.execute(command())).rejects.toThrow(
      BallotAlreadyCastException,
    );
  });

  it('rejects a signer who does not own the unit', async () => {
    readRepo.isActiveUnitOwner.mockResolvedValue(false);
    await expect(handler.execute(command())).rejects.toThrow(
      NotAUnitOwnerException,
    );
  });

  it('rejects an attachment belonging to another vote', async () => {
    documentRepo.findById.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
  });

  it('rejects a public vote document used as a ballot scan', async () => {
    documentRepo.findById.mockResolvedValue({
      id: 'doc-1',
      voteId: 'vote-1',
      kind: 'VOTE',
      status: 'UPLOADED',
      objectKey: 'key-1',
      sizeBytes: 1024,
      fileName: 'rules.pdf',
    });
    await expect(handler.execute(command())).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
  });

  it('rejects an attachment already linked to another ballot', async () => {
    documentRepo.isAttachmentLinked.mockResolvedValue(true);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteDocumentNotFoundException,
    );
  });

  it('rejects an upload whose object never landed in storage', async () => {
    storage.head.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toThrow(
      VoteDocumentUploadIncompleteException,
    );
  });

  it('rejects answers that do not cover every question', async () => {
    const incomplete = new RecordPaperBallotCommand(
      'tenant-1',
      'vote-1',
      'mem-admin',
      'unit-1',
      'owner-3',
      'doc-1',
      [],
    );
    await expect(handler.execute(incomplete)).rejects.toThrow(
      InvalidBallotAnswersException,
    );
  });
});
