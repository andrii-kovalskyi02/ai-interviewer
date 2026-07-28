import type { Difficulty } from '@interviewer/shared';
import type { InterviewRepository, InterviewerGateway } from '../domain/interview/ports.js';
import { InterviewSession } from '../domain/interview/InterviewSession.js';
import { findPersona } from '../domain/interview/Persona.js';
import { NotFoundError } from '../domain/errors.js';
import { InterviewConfig } from '../domain/interview/InterviewConfig.js';
import { randomUUID } from 'node:crypto';

export interface StartInterviewInput {
    readonly role: string;
    readonly difficulty: Difficulty;
    readonly personaId: string;
    readonly questionCount: number;
}

export class StartInterviewUseCase {
    constructor(
        private readonly repository: InterviewRepository,
        private readonly interviewer: InterviewerGateway,
    ) {}

    async execute(input: StartInterviewInput): Promise<InterviewSession> {
        const persona = findPersona(input.personaId);

        if (persona === undefined) {
            throw new NotFoundError('not_found', `unknown persona: ${input.personaId}`);
        }

        const config = InterviewConfig.create({
            role: input.role,
            difficulty: input.difficulty,
            questionCount: input.questionCount,
            persona,
        });

        const session = InterviewSession.start(randomUUID(), config);
        const question = await this.interviewer.askNextQuestion(session);

        session.askQuestion(question.text, question.topic);
        await this.repository.save(session);

        return session;
    }
}
