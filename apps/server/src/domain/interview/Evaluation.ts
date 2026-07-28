export interface Evaluation {
    readonly score: number;
    readonly strengths: string[];
    readonly weaknesses: string[];
    readonly followUpHint: string | null; // note for the next question prompt; never shown to the candidate
}
