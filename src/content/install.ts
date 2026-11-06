import type { Lang } from '../domain/types';

/* The words for installing, in a chunk of their own: the home screen's budget
   has no room for them, and most people never open them. */
const en = {
  installIos:
    'Open this page in a web browser such as Safari or Chrome (not inside LINE or Instagram), then follow these steps. The pictures show Safari.',
  installAndroid: 'Open this page in Chrome, then:',
  installAndroidStep: [
    'Tap ⋮ at the top right',
    'Tap Add to Home screen or Install app',
    'Tap Install',
  ],
  installSamsung:
    'Android can block apps installed from Samsung Internet. Open this page in Chrome and tap Install app there.',
  installInApp:
    'YUNABI cannot be installed inside another app. Open the menu (⋯ or ⋮) and choose to open this page in your browser.',
  installOpenBrowser: 'Open in browser',
  installEnd: 'Play again any time: keep YUNABI on your home screen.',
  installStep: [
    'Tap ··· at the bottom right',
    'Tap Share',
    'Tap View More, then scroll down',
    'Tap Add to Home Screen',
    'Tap Add',
    'YUNABI is on your Home Screen',
  ],
};

export const INSTALL_TEXT: Record<Lang, typeof en> = {
  en,
  ja: {
    installIos:
      'このページを Safari や Chrome などのブラウザで開いて（LINE や Instagram の中ではなく）、次の手順へ。画像は Safari のものです。',
    installAndroid: 'このページを Chrome で開いてから：',
    installAndroidStep: [
      '右上の「⋮」をタップ',
      '「ホーム画面に追加」または「アプリをインストール」をタップ',
      '「インストール」をタップ',
    ],
    installSamsung:
      'Samsung Internet からのアプリは Android にブロックされることがあります。このページを Chrome で開いて「アプリを追加」をタップしてください。',
    installInApp:
      'ほかのアプリの中では YUNABI を追加できません。メニュー（⋯ や ⋮）から、このページをブラウザで開いてください。',
    installOpenBrowser: 'ブラウザで開く',
    installEnd: 'いつでも遊べるように、YUNABI をホーム画面に追加しましょう。',
    installStep: [
      '右下の「···」をタップ',
      '「共有」をタップ',
      '「さらに表示」をタップして下へスクロール',
      '「ホーム画面に追加」をタップ',
      '「追加」をタップ',
      'ホーム画面に YUNABI ができます',
    ],
  },
  ko: {
    installIos:
      '이 페이지를 Safari나 Chrome 같은 웹 브라우저에서 연 다음(LINE·인스타그램 안이 아니라) 아래 순서대로 하세요. 사진은 Safari 기준이에요.',
    installAndroid: '이 페이지를 Chrome에서 연 다음:',
    installAndroidStep: [
      '오른쪽 위 ⋮ 누르기',
      '"홈 화면에 추가" 또는 "앱 설치" 누르기',
      '"설치" 누르기',
    ],
    installSamsung:
      '삼성 인터넷으로 설치한 앱은 Android가 차단할 수 있어요. 이 페이지를 Chrome에서 열고 "앱 설치"를 누르세요.',
    installInApp:
      '다른 앱 안에서는 YUNABI를 설치할 수 없어요. 메뉴(⋯ 또는 ⋮)에서 이 페이지를 브라우저로 여세요.',
    installOpenBrowser: '브라우저에서 열기',
    installEnd: '언제든 다시 플레이할 수 있게 YUNABI를 홈 화면에 추가하세요.',
    installStep: [
      '오른쪽 아래 ··· 누르기',
      '"공유" 누르기',
      '"더 보기"를 누르고 아래로 스크롤',
      '"홈 화면에 추가" 누르기',
      '"추가" 누르기',
      '홈 화면에 YUNABI가 생겨요',
    ],
  },
};
