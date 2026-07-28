import { Difficulty, InterviewStatus, Verdict } from '@interviewer/shared';
import { describe, expect, it } from 'vitest';
import { InvalidStateError } from '../errors.js';
import type { Evaluation } from './Evaluation.js';
import { InterviewConfig } from './InterviewConfig.js';
import type { InterviewReport } from './InterviewReport.js';
import { InterviewSession } from './InterviewSession.js';
import { PERSONAS } from './Persona.js';

const EVALUATION: Evaluation = {
    score: 7,
    strengths: ['clear structure'],
    weaknesses: ['light on error handling'],
    followUpHint: null,
};

const REPORT: InterviewReport = {
    overallScore: 7,
    verdict: Verdict.Hire,
    summary: 'Solid, pragmatic answers with room to grow on edge cases.',
    strengths: ['clear communication'],
    improvements: ['deeper error handling'],
};

function createSession(questionCount = 3): InterviewSession {
    const persona = PERSONAS[0];

    if (persona === undefined) {
        throw new Error('persona catalog is empty');
    }

    const config = InterviewConfig.create({
        role: 'Senior TypeScript Developer',
        difficulty: Difficulty.Senior,
        questionCount,
        persona,
    });

    return InterviewSession.start('interview-1', config);
}

function answerAndEvaluate(session: InterviewSession, text = 'a reasonable answer'): void {
    const turn = session.submitAnswer(text);
    session.attachEvaluation(turn, EVALUATION);
}

describe('InterviewSession', () => {
    it('starts in progress, awaiting its first question', () => {
        const session = createSession();

        expect(session.status).toBe(InterviewStatus.InProgress);
        expect(session.turns).toHaveLength(0);
        expect(session.currentTurn).toBeNull();
        expect(session.isAwaitingQuestion).toBe(true);
        expect(session.report).toBeNull();
    });

    it('records a question and then its answer', () => {
        const session = createSession();

        const question = session.askQuestion('How does structural typing work?', 'typescript');

        expect(question.index).toBe(1);
        expect(session.isAwaitingQuestion).toBe(false);
        expect(session.currentTurn?.question).toEqual(question);

        const turn = session.submitAnswer('It compares shapes, not names.');

        expect(turn.answer?.text).toBe('It compares shapes, not names.');
        expect(session.answeredCount).toBe(1);
        expect(session.currentTurn).toBeNull();
        expect(session.isAwaitingQuestion).toBe(true);
    });

    it('rejects an answer when no question is pending', () => {
        const session = createSession();

        expect(() => session.submitAnswer('too early')).toThrow(InvalidStateError);
    });

    it('rejects a new question while the current one is unanswered', () => {
        const session = createSession();
        session.askQuestion('First question?', 'typescript');

        expect(() => session.askQuestion('Second question?', 'node')).toThrow(InvalidStateError);
    });

    it('rejects more questions than the configured count', () => {
        const session = createSession(3);

        for (let index = 0; index < 3; index += 1) {
            session.askQuestion(`Question ${index + 1}?`, 'typescript');
            answerAndEvaluate(session);
        }

        expect(() => session.askQuestion('One too many?', 'typescript')).toThrow(InvalidStateError);
    });

    it('rejects an evaluation for a turn from another interview', () => {
        const session = createSession();
        const otherSession = createSession();

        session.askQuestion('Ours?', 'typescript');
        otherSession.askQuestion('Theirs?', 'typescript');
        const foreignTurn = otherSession.submitAnswer('an answer');

        expect(() => session.attachEvaluation(foreignTurn, EVALUATION)).toThrow(InvalidStateError);
    });

    it('refuses to complete before every question has been asked', () => {
        const session = createSession(3);
        session.askQuestion('Only question?', 'typescript');
        answerAndEvaluate(session);

        expect(() => session.complete(REPORT)).toThrow(InvalidStateError);
    });

    it('refuses to complete while an answer is still unevaluated', () => {
        const session = createSession(3);

        session.askQuestion('First?', 'typescript');
        answerAndEvaluate(session);
        session.askQuestion('Second?', 'node');
        answerAndEvaluate(session);
        session.askQuestion('Third?', 'testing');
        session.submitAnswer('unevaluated answer');

        expect(() => session.complete(REPORT)).toThrow(InvalidStateError);
    });

    it('completes once every question is answered and evaluated', () => {
        const session = createSession(3);

        for (let index = 0; index < 3; index += 1) {
            session.askQuestion(`Question ${index + 1}?`, 'typescript');
            answerAndEvaluate(session);
        }

        session.complete(REPORT);

        expect(session.status).toBe(InterviewStatus.Completed);
        expect(session.report).toEqual(REPORT);
    });

    it('refuses any further activity once completed', () => {
        const session = createSession(3);

        for (let index = 0; index < 3; index += 1) {
            session.askQuestion(`Question ${index + 1}?`, 'typescript');
            answerAndEvaluate(session);
        }

        session.complete(REPORT);

        expect(() => session.askQuestion('After the end?', 'typescript')).toThrow(
            InvalidStateError,
        );
        expect(() => session.submitAnswer('after the end')).toThrow(InvalidStateError);
        expect(() => session.complete(REPORT)).toThrow(InvalidStateError);
    });
});
