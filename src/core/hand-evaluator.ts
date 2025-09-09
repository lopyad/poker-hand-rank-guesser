import { type Card, type EvaluatedHand, HAND_RANK_VALUES, HAND_RANK_NAMES, type Rank, RANKS, type Suit, SUITS } from './types';

const RANK_VALUES: { [key in Rank]: number } = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

function sortCards(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
}

function getCombinations(cards: Card[], combinationLength: number): Card[][] {
    const results: Card[][] = [];
    function combine(currentCombination: Card[], start: number) {
        if (currentCombination.length === combinationLength) {
            results.push([...currentCombination]);
            return;
        }
        if (start >= cards.length) {
            return;
        }
        currentCombination.push(cards[start]);
        combine(currentCombination, start + 1);
        currentCombination.pop();
        combine(currentCombination, start + 1);
    }
    combine([], 0);
    return results;
}

export function evaluatePlayerHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
    const allCards = [...holeCards, ...communityCards];
    const all5CardCombinations = getCombinations(allCards, 5);

    let bestHand: EvaluatedHand | null = null;

    for (const hand of all5CardCombinations) {
        const evaluated = evaluate5CardHand(hand);
        if (!bestHand || compareEvaluatedHands(evaluated, bestHand) > 0) {
            bestHand = evaluated;
        }
    }
    
    if (!bestHand) {
        throw new Error("Could not determine best hand");
    }
    return bestHand;
}

function evaluate5CardHand(hand: Card[]): EvaluatedHand {
    const sortedHand = sortCards(hand);
    const rankCounts: { [key in Rank]?: number } = {};
    const suitCounts: { [key in Suit]?: number } = {};
    let isFlush = false;
    let isStraight = false;

    for (const card of sortedHand) {
        rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }

    if (Object.values(suitCounts).some(count => count >= 5)) {
        isFlush = true;
    }

    const uniqueSortedRanks = sortCards(Object.keys(rankCounts).map(rank => ({ rank: rank as Rank, suit: SUITS.Spades }))).map(c => c.rank);
    if (uniqueSortedRanks.length >= 5) {
        for (let i = 0; i <= uniqueSortedRanks.length - 5; i++) {
            const slice = uniqueSortedRanks.slice(i, i + 5);
            if (RANK_VALUES[slice[0]] - RANK_VALUES[slice[4]] === 4) {
                isStraight = true;
                break;
            }
        }
        // Ace-low straight (A-2-3-4-5)
        if (!isStraight) {
            const aceLowRanks = ['A', '5', '4', '3', '2'];
            if (aceLowRanks.every(r => uniqueSortedRanks.includes(r as Rank))) {
                isStraight = true;
            }
        }
    }
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const primaryRank = Object.keys(rankCounts).find(r => rankCounts[r as Rank] === counts[0]) as Rank;
    
    if (isStraight && isFlush) {
        const straightFlushHand = sortedHand.filter(c => c.suit === Object.keys(suitCounts).find(s => suitCounts[s as Suit] >= 5));
        if (RANK_VALUES[primaryRank] === 14) return { rankValue: HAND_RANK_VALUES.ROYAL_FLUSH, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.ROYAL_FLUSH], handCards: sortedHand };
        return { rankValue: HAND_RANK_VALUES.STRAIGHT_FLUSH, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.STRAIGHT_FLUSH], handCards: sortedHand };
    }
    if (counts[0] === 4) return { rankValue: HAND_RANK_VALUES.FOUR_OF_A_KIND, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.FOUR_OF_A_KIND], handCards: sortedHand };
    if (counts[0] === 3 && counts[1] === 2) return { rankValue: HAND_RANK_VALUES.FULL_HOUSE, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.FULL_HOUSE], handCards: sortedHand };
    if (isFlush) return { rankValue: HAND_RANK_VALUES.FLUSH, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.FLUSH], handCards: sortedHand };
    if (isStraight) return { rankValue: HAND_RANK_VALUES.STRAIGHT, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.STRAIGHT], handCards: sortedHand };
    if (counts[0] === 3) return { rankValue: HAND_RANK_VALUES.THREE_OF_A_KIND, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.THREE_OF_A_KIND], handCards: sortedHand };
    if (counts[0] === 2 && counts[1] === 2) return { rankValue: HAND_RANK_VALUES.TWO_PAIR, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.TWO_PAIR], handCards: sortedHand };
    if (counts[0] === 2) return { rankValue: HAND_RANK_VALUES.PAIR, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.PAIR], handCards: sortedHand };

    return { rankValue: HAND_RANK_VALUES.HIGH_CARD, rankName: HAND_RANK_NAMES[HAND_RANK_VALUES.HIGH_CARD], handCards: sortedHand };
}

export function compareEvaluatedHands(a: EvaluatedHand, b: EvaluatedHand): number {
    if (a.rankValue !== b.rankValue) {
        return a.rankValue - b.rankValue;
    }
    for (let i = 0; i < a.handCards.length; i++) {
        const diff = RANK_VALUES[a.handCards[i].rank] - RANK_VALUES[b.handCards[i].rank];
        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}