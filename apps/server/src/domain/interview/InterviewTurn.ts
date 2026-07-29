import { InvalidStateError } from '../errors.js';
import type { Answer } from './Answer.js';
import type { Evaluation } from './Evaluation.js';
import type { Question } from './Question.js';
import { InterviewMessages } from './messages.js';

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
            throw new InvalidStateError(InterviewMessages.alreadyAnswered(this.question.index));
        }

        this._answer = { text, answeredAt: new Date() };
    }

    evaluateWith(evaluation: Evaluation): void {
        if (this._answer === null) {
            throw new InvalidStateError(InterviewMessages.notAnsweredYet(this.question.index));
        }

        if (this._evaluation !== null) {
            throw new InvalidStateError(InterviewMessages.alreadyEvaluated(this.question.index));
        }

        this._evaluation = evaluation;
    }
}
