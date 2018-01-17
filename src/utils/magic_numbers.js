import { MAX_NUM_SUITS as GAME_TYPE_MAX_NUM_SUITS } from './card';

export const MAX_NUM_PLAYERS = 10;
// base index for hands
export const RECENTLY_PLAYED_INDEX = MAX_NUM_PLAYERS;
export const DECK_INDEX = 2 * MAX_NUM_PLAYERS;

export const MAX_ABS_CARD_RANK = 100;  // non-inclusive
export const MAX_NUM_SUITS = GAME_TYPE_MAX_NUM_SUITS;