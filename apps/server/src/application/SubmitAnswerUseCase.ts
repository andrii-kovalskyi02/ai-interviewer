import type { InterviewRepository, InterviewerGateway } from '../domain/interview/ports.js';
import type { InterviewSession } from '../domain/interview/InterviewSession.js';
import { loadSessionOrThrow } from './loadSessionOrThrow.js';

export interface SubmitAnswerInput {
    readonly interviewId: string;
    readonly text: string;
}

export class SubmitAnswerUseCase {
    constructor(
        private readonly repository: InterviewRepository,
        private readonly interviewer: InterviewerGateway,
    ) {}

    async execute(input: SubmitAnswerInput): Promise<InterviewSession> {
        const session = await loadSessionOrThrow(this.repository, input.interviewId);
        const turn = session.submitAnswer(input.text);

        const evaluation = await this.interviewer.evaluateAnswer(session, turn);
        session.attachEvaluation(turn, evaluation);

        if (session.answeredCount < session.config.questionCount) {
            const question = await this.interviewer.askNextQuestion(session);
            session.askQuestion(question.text, question.topic);
        } else {
            const report = await this.interviewer.writeReport(session);
            session.complete(report);
        }

        await this.repository.save(session);

        return session;
    }
}
