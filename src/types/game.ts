export interface GameOption {
  id: string;
  title: string;
}

export interface GameRound {
  roundId: string;
  sessionId: string;

  questionNumber: number;

  audioUrl: string | null;

  options: GameOption[];
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;

  points: number;
  score: number;
  streak: number;

  nextRound: GameRound | null;
}