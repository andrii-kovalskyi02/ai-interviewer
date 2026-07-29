import type { FastifyInstance } from 'fastify';
import type { PersonaDto } from '@interviewer/shared';
import { PERSONAS } from '../../domain/interview/Persona.js';
import { toPersonaDto } from '../dto.js';

export function registerPersonaRoutes(app: FastifyInstance): void {
    app.get('/api/personas', async (): Promise<PersonaDto[]> => PERSONAS.map(toPersonaDto));
}
