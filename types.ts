export enum Topic {
  ALGEBRA = 'Algebra',
  COMBINATORICS = 'Combinatorics',
  GEOMETRY = 'Geometry',
  NUMBER_THEORY = 'Number Theory'
}

export enum Difficulty {
  EASY = 'IMO SL C1/G1', // Easy for IMO, roughly early shortlist
  MEDIUM = 'IMO SL C3/G3', // Mid Shortlist
  HARD = 'IMO Q3/Q6', // The hardest problems
}

export enum ProblemStatus {
  DRAFT = 'Draft',
  REFINING = 'Refining',
  VERIFIED = 'Verified',
  SHORTLIST = 'Shortlist Ready'
}

export interface Problem {
  id: string;
  title: string;
  statement: string;
  topic: Topic;
  difficulty: Difficulty;
  status: ProblemStatus;
  solution?: string;
  leanCode?: string;
  notes?: string;
  created: number;
  tags: string[];
  // Geometry specifics
  jsxGraphCode?: string;
  asymptoteCode?: string;
  // Verification data
  similars?: string; // Analysis of similar known problems
  stressTest?: string; // Logical edge case analysis
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GenerationConfig {
  topic: Topic;
  difficulty: Difficulty;
  customPrompt?: string;
  focusArea?: string; // e.g. "Polynomials", "Graph Theory"
}

export interface StyleGuide {
  notation: string; // e.g., "Cyclic sums"
  geometryConvention: string; // e.g., "Triangle ABC not T"
}