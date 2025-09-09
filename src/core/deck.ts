import { type Card, SUITS, RANKS, type Suit } from './types';

// 표준 52장 카드 덱 생성
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of Object.values(SUITS)) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// Fisher-Yates 알고리즘을 사용한 덱 셔플
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
