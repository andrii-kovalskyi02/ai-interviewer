import type { Difficulty } from '@interviewer/shared';
import type { Persona } from './Persona.js';
import { DomainError } from '../errors.js';

export interface InterviewConfigProps {
    readonly role: string;
    readonly difficulty: Difficulty;
    readonly questionCount: number;
    readonly persona: Persona;
}

export class InterviewConfig {
    private constructor(
        readonly role: string,
        readonly difficulty: Difficulty,
        readonly questionCount: number,
        readonly persona: Persona,
    ) {}

    static create(props: InterviewConfigProps): InterviewConfig {
        const role = props.role.trim();

        if (role.length < 3 || role.length > 80) {
            throw new DomainError('invalid_config', 'role must be between 3 and 80 characters');
        }

        if (
            !Number.isInteger(props.questionCount) ||
            props.questionCount < 3 ||
            props.questionCount > 8
        ) {
            throw new DomainError(
                'invalid_config',
                'questionCount must be an integer between 3 and 8',
            );
        }

        return new InterviewConfig(role, props.difficulty, props.questionCount, props.persona);
    }
}
