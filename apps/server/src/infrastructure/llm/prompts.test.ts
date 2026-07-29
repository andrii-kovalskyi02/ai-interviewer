import { InterviewSession } from '../../domain/interview/InterviewSession.js';
import { findPersona } from '../../domain/interview/Persona.js';
import { InterviewConfig } from '../../domain/interview/InterviewConfig.js';
import { Difficulty } from '@interviewer/shared';
import { describe, expect, it } from 'vitest';
import { evaluationPrompt, nextQuestionPrompt, reportPrompt } from './prompts.js';

function createSessionWithHistory(personaId = 'bar-raiser'): InterviewSession {
    const persona = findPersona(personaId);

    if (persona === undefined) {
        throw new Error(`unknown persona: ${personaId}`);
    }

    const session = InterviewSession.start(
        'interview-1',
        InterviewConfig.create({
            role: 'Senior TypeScript Developer',
            difficulty: Difficulty.Senior,
            questionCount: 3,
            persona,
        }),
    );

    session.askQuestion('How does structural typing work?', 'typescript');

    const turn = session.submitAnswer('It compares shapes rather than names.');

    session.attachEvaluation(turn, {
        score: 6,
        strengths: ['concise'],
        weaknesses: ['shallow'],
        followUpHint: 'probe deeper on error handling',
    });

    return session;
}

function contentOf(messages: { content: string }[]): string {
    return messages.map((message) => message.content).join('\n');
}

describe('nextQuestionPrompt', () => {
    it('includes the persona voice, the prior answer and the private evaluator note', () => {
        const session = createSessionWithHistory();
        const content = contentOf(nextQuestionPrompt(session));

        expect(content).toContain('The Bar Raiser');
        expect(content).toContain('It compares shapes rather than names.');
        expect(content).toContain('score 6/10');
        expect(content).toContain('probe deeper on error handling');
    });

    it('asks for the next question number in the interview', () => {
        const session = createSessionWithHistory();
        const content = contentOf(nextQuestionPrompt(session));

        expect(content).toContain('Generate question 2 of 3');
    });
});

describe('evaluationPrompt', () => {
    it('stays persona-neutral so scoring is not coloured by the interviewer voice', () => {
        const session = createSessionWithHistory();
        const turn = session.turns[0];

        if (turn === undefined) {
            throw new Error('expected a turn');
        }

        const persona = session.config.persona;
        const content = contentOf(evaluationPrompt(session, turn));

        expect(content).not.toContain(persona.styleInstructions);
        expect(content).not.toContain(persona.name);
        expect(content).toContain('neutral, objective technical evaluator');
    });

    it('includes the question and the candidate answer', () => {
        const session = createSessionWithHistory();
        const turn = session.turns[0];

        if (turn === undefined) {
            throw new Error('expected a turn');
        }

        const content = contentOf(evaluationPrompt(session, turn));

        expect(content).toContain('How does structural typing work?');
        expect(content).toContain('It compares shapes rather than names.');
    });
});

describe('reportPrompt', () => {
    it('asks for the report in the persona voice', () => {
        const session = createSessionWithHistory('pirate');
        const content = contentOf(reportPrompt(session));

        expect(content).toContain('Captain Redbeard');
        expect(content).toContain('in the voice of Captain Redbeard');
    });
});
