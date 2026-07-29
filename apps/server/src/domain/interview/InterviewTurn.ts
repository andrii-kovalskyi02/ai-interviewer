import { InvalidStateError } from '../errors.js';
import type { Answer } from './Answer.js';
import type { Evaluation } from './Evaluation.js';
import type { Question } from './Question.js';

export class InterviewTurn {
    private _answer: Answer | null = null;
    private _evaluation: Evaluation | null = null;

    constructor(readonly question: Question) {}

    get answer(): Answer | null {
        return this._answer;
    }

    get evaluation(): Evaluation | null {
        return this._evaluation;
    }

    get isAnswered(): boolean {
        return this._answer !== null;
    }

    get isEvaluated(): boolean {
        return this._evaluation !== null;
    }

    answerWith(text: string): void {
        if (this._answer !== null) {
            throw new InvalidStateError(
                `question ${this.question.index} has already been answered`,
            );
        }

        this._answer = { text, answeredAt: new Date() };
    }

    evaluateWith(evaluation: Evaluation): void {
        if (this._answer === null) {
            throw new InvalidStateError(
                `question ${this.question.index} cannot be evaluated before it is answered`,
            );
        }

        if (this._evaluation !== null) {
            throw new InvalidStateError(
                `question ${this.question.index} has already been evaluated`,
            );
        }

        this._evaluation = evaluation;
    }
}
