import { ErrorCode } from '@interviewer/shared';

export class DomainError extends Error {
    constructor(
        readonly code: ErrorCode,
        message: string,
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends DomainError {
    constructor(message: string) {
        super(ErrorCode.NotFound, message);
    }
}

export class InvalidStateError extends DomainError {
    constructor(message: string) {
        super(ErrorCode.InvalidState, message);
    }
}
