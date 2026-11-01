/* Every card the collection can hold — achievement illustrations and ending
   cards — by id only, so the home screen can count them without loading their
   text (the home bundle budget). tests/unit/domain.test.ts checks this list
   against ACHIEVEMENTS and ENDINGS. */
export const CARD_IDS = [
  'a_osaka_kushikatsu',
  'a_osaka_juice',
  'a_osaka_takoyaki',
  'a_kyoto_latte',
  'a_kyoto_ringo',
  'a_kyoto_hanabi',
  'e_osaka_best',
  'e_osaka_norm',
  'e_osaka_bad',
  'e_kyoto_best',
  'e_kyoto_norm',
  'e_kyoto_bad',
] as const;
