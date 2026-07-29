import { InMemoryInterviewRepository } from '../infrastructure/persistence/InMemoryInterviewRepository.js';
import { MockInterviewer } from '../infrastructure/llm/MockInterviewer.js';
import { StartInterviewUseCase } from './StartInterviewUseCase.js';
import { SubmitAnswerUseCase } from './SubmitAnswerUseCase.js';
import { GetReportUseCase } from './GetReportUseCase.js';
import { Difficulty, InterviewStatus } from '@interviewer/shared';
import { describe, expect, it } from 'vitest';
import { InvalidStateError, NotFoundError } from '../domain/errors.js';
import { InterviewMessages } from '../domain/interview/messages.js';

const QUESTION_COUNT = 3;
const ANSWER =
    'I enforce strict compiler settings and split the application into workspace packages ' +
    'with explicit public APIs, so domain logic stays free of framework imports.';

function wire() {
    const repository = new InMemoryInterviewRepository();
    const interviewer = new MockInterviewer(0);

    return {
        repository,
        start: new StartInterviewUseCase(repository, interviewer),
        submitAnswer: new SubmitAnswerUseCase(repository, interviewer),
        getReport: new GetReportUseCase(repository),
    };
}

function startInput(personaId = 'mentor') {
    return {
        role: 'Senior TypeScript Developer',
        difficulty: Difficulty.Senior,
        personaId,
        questionCount: QUESTION_COUNT,
    };
}

describe('interview use cases', () => {
    it('asks the first question as soon as an interview starts', async () => {
        const { start } = wire();

        const session = await start.execute(startInput());

        expect(session.status).toBe(InterviewStatus.InProgress);
        expect(session.turns).toHaveLength(1);
        expect(session.currentTurn?.question.index).toBe(1);
    });

    it('rejects an unknown persona before any interview is created', async () => {
        const { start, repository } = wire();

        expect(start.execute(startInput('nope'))).rejects.toThrow(NotFoundError);
        await expect(repository.findById('any')).resolves.toBeNull();
    });

    it('drives a full interview to a completed report', async () => {
        const { start, submitAnswer, getReport } = wire();

        const started = await start.execute(startInput());
        let session = started;

        for (let answered = 0; answered < QUESTION_COUNT; answered += 1) {
            session = await submitAnswer.execute({ interviewId: started.id, text: ANSWER });
        }

        expect(session.status).toBe(InterviewStatus.Completed);
        expect(session.answeredCount).toBe(QUESTION_COUNT);
        expect(session.turns.every((turn) => turn.isEvaluated)).toBe(true);

        const { report } = await getReport.execute(started.id);

        expect(report.overallScore).toBe(session.averageScore);
        expect(report.summary.length).toBeGreaterThan(0);
    });

    it('asks the next question until the last answer, then writes the report', async () => {
        const { start, submitAnswer } = wire();

        const started = await start.execute(startInput());

        const afterFirst = await submitAnswer.execute({ interviewId: started.id, text: ANSWER });
        expect(afterFirst.currentTurn?.question.index).toBe(2);
        expect(afterFirst.report).toBeNull();

        await submitAnswer.execute({ interviewId: started.id, text: ANSWER });
        const afterLast = await submitAnswer.execute({ interviewId: started.id, text: ANSWER });

        expect(afterLast.currentTurn).toBeNull();
        expect(afterLast.report).not.toBeNull();
    });

    it('rejects an answer to an unknown interview', async () => {
        const { submitAnswer } = wire();

        expect(
            submitAnswer.execute({ interviewId: 'does-not-exist', text: ANSWER }),
        ).rejects.toThrow(NotFoundError);
    });

    it('rejects an answer once the interview is completed', async () => {
        const { start, submitAnswer } = wire();

        const started = await start.execute(startInput());

        for (let answered = 0; answered < QUESTION_COUNT; answered += 1) {
            await submitAnswer.execute({ interviewId: started.id, text: ANSWER });
        }

        expect(
            submitAnswer.execute({ interviewId: started.id, text: ANSWER }),
        ).rejects.toThrow(InterviewMessages.alreadyCompleted);
    });

    it('refuses to hand out a report while the interview is still running', async () => {
        const { start, getReport } = wire();

        const started = await start.execute(startInput());

        expect(getReport.execute(started.id)).rejects.toThrow(InvalidStateError);
    });
});
