import type { Keyword } from '../domain/keywords';
import type { Lang } from '../domain/types';

/* The words for place keywords, in the map's and the forms' chunks rather
   than the home screen's (its budget has no room), as with install.ts. The
   admin console uses them too. */
interface KeywordText {
  kw: Record<Keyword, string>;
  /** the place form */
  field: string;
  hint: string;
  /** the map's filter row */
  aFilter: string;
}

export const KEYWORD_TEXT: Record<Lang, KeywordText> = {
  en: {
    kw: {
      cheap: 'Cheap',
      late: 'Open late',
      english: 'English OK',
      card: 'Card OK',
      cash_only: 'Cash only',
      solo: 'Good alone',
      groups: 'Good for groups',
      vegetarian: 'Vegetarian',
      halal: 'Halal',
      study: 'Study · Wi-Fi',
      takeout: 'Takeout',
      photo: 'Photo spot',
      free: 'Free entry',
      bike: 'Bike parking',
    },
    field: 'Keywords',
    hint: 'Up to 3 that fit.',
    aFilter: 'Filter by keyword',
  },
  ja: {
    kw: {
      cheap: '安い',
      late: '夜遅くまで',
      english: '英語OK',
      card: 'カードOK',
      cash_only: '現金のみ',
      solo: '一人でも',
      groups: 'グループ向き',
      vegetarian: 'ベジタリアン',
      halal: 'ハラール',
      study: '勉強・Wi-Fi',
      takeout: '持ち帰り',
      photo: '写真スポット',
      free: '入場無料',
      bike: '駐輪場',
    },
    field: 'キーワード',
    hint: '当てはまるものを3つまで。',
    aFilter: 'キーワードで絞り込む',
  },
  ko: {
    kw: {
      cheap: '저렴함',
      late: '늦게까지 영업',
      english: '영어 가능',
      card: '카드 가능',
      cash_only: '현금만',
      solo: '혼자 가기 좋음',
      groups: '단체 가능',
      vegetarian: '채식 가능',
      halal: '할랄',
      study: '공부·와이파이',
      takeout: '포장 가능',
      photo: '사진 명소',
      free: '입장 무료',
      bike: '자전거 주차',
    },
    field: '키워드',
    hint: '해당하는 것을 3개까지.',
    aFilter: '키워드로 거르기',
  },
};
