import type { InterviewRepository } from '../domain/interview/ports.js';
import type { InterviewSession } from '../domain/interview/InterviewSession.js';
import { NotFoundError } from '../domain/errors.js';

export async function loadSessionOrThrow(
    repository: InterviewRepository,
    interviewId: string,
): Promise<InterviewSession> {
    const session = await repository.findById(interviewId);

    if (session === null) {
        throw new NotFoundError('not_found', `interview ${interviewId} was not found`);
    }

    return session;
}
