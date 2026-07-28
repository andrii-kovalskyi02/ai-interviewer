export class DomainError extends Error {
    constructor(
        readonly code: string,
        message: string,
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends DomainError {}
export class InvalidStateError extends DomainError {}
