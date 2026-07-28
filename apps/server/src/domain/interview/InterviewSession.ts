import { InterviewStatus } from '@interviewer/shared';
import { InvalidStateError } from '../errors.js';
import type { Evaluation } from './Evaluation.js';
import type { InterviewConfig } from './InterviewConfig.js';
import type { InterviewReport } from './InterviewReport.js';
import { InterviewTurn } from './InterviewTurn.js';
import type { Question } from './Question.js';

export class InterviewSession {
    private constructor(
        readonly id: string,
        readonly config: InterviewConfig,
        private readonly _turns: InterviewTurn[],
        private _status: InterviewStatus,
        private _report: InterviewReport | null,
    ) {}

    static start(id: string, config: InterviewConfig): InterviewSession {
        return new InterviewSession(id, config, [], InterviewStatus.InProgress, null);
    }

    get status(): InterviewStatus {
        return this._status;
    }

    get report(): InterviewReport | null {
        return this._report;
    }

    get turns(): readonly InterviewTurn[] {
        return this._turns;
    }

    get currentTurn(): InterviewTurn | null {
        const lastTurn = this._turns.at(-1);

        return lastTurn !== undefined && !lastTurn.isAnswered ? lastTurn : null;
    }

    get answeredCount(): number {
        return this._turns.filter((turn) => turn.isAnswered).length;
    }

    get isAwaitingQuestion(): boolean {
        return this._status === InterviewStatus.InProgress && this.currentTurn === null;
    }

    askQuestion(text: string, topic: string): Question {
        this.assertInProgress();

        if (this.currentTurn !== null) {
            throw new InvalidStateError(
                'invalid_state',
                'the current question must be answered before asking the next one',
            );
        }

        if (this._turns.length >= this.config.questionCount) {
            throw new InvalidStateError(
                'invalid_state',
                `interview already has all ${this.config.questionCount} questions`,
            );
        }

        const question: Question = { index: this._turns.length + 1, text, topic };
        this._turns.push(new InterviewTurn(question));

        return question;
    }

    submitAnswer(text: string): InterviewTurn {
        this.assertInProgress();

        const turn = this.currentTurn;

        if (turn === null) {
            throw new InvalidStateError('invalid_state', 'there is no pending question to answer');
        }

        turn.answerWith(text);

        return turn;
    }

    attachEvaluation(turn: InterviewTurn, evaluation: Evaluation): void {
        if (!this._turns.includes(turn)) {
            throw new InvalidStateError('invalid_state', 'turn does not belong to this interview');
        }

        turn.evaluateWith(evaluation);
    }

    complete(report: InterviewReport): void {
        this.assertInProgress();

        if (this._turns.length < this.config.questionCount) {
            throw new InvalidStateError(
                'invalid_state',
                `interview needs ${this.config.questionCount} questions before it can be completed`,
            );
        }

        if (!this._turns.every((turn) => turn.isAnswered && turn.isEvaluated)) {
            throw new InvalidStateError(
                'invalid_state',
                'every question must be answered and evaluated before completing',
            );
        }

        this._status = InterviewStatus.Completed;
        this._report = report;
    }

    private assertInProgress(): void {
        if (this._status !== InterviewStatus.InProgress) {
            throw new InvalidStateError('invalid_state', 'the interview is already completed');
        }
    }
}
