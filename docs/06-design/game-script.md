# 대화 게임 대본 (레벨 8)

> **생성 문서 — 고치지 말 것.** `src/content/vn.ts`·`endings.ts` 에서 `node scripts/gen-comic-scripts.mjs` 로 만든다. 대사를 바꾸려면 그 파일을 고치고 다시 생성한다.

## 그림 규칙 (Y-J3)

- 장면: `src/art/vn/<친구>/<nn>` — **가로 4:3**. 엔딩 카드: `src/art/endings/<id>` — **가로 3:2**. `.webp`·`.png`·`.jpg`, 한 장 400KB 이하 권장.
- 그림에는 글자를 넣지 않는다. 대사와 선택지는 앱이 그림 아래에 보여 준다.
- ○ = 자연스러운 답(점수), × = 어색한 답. 피드백은 고른 뒤에 보인다.
- 한자 뒤 괄호 = 앱이 다는 후리가나.
- osaka 엔딩: 놓친 선택 0개 이하면 좋은 엔딩, 맞힌 선택 1개 이하면 나쁜 엔딩, 그 사이는 보통 엔딩.
- kyoto 엔딩: 놓친 선택 1개 이하면 좋은 엔딩, 그 밖은 보통 엔딩.
- 두 친구의 엔딩을 하나씩 모으면 `e_both`.

## 유우키 (오사카) — `osaka`

목소리가 크다. 조용히 있으면 걱정받는다

### 장면 1 — `src/art/vn/osaka/01`

- 장면 메모: Shinsekai street by day, crowded, Yuki waving hard
- 대사: **おー、こっちこっち！めっちゃ待(ま)ったで〜。何(なに)しとってん！**

| 선택지 | | 피드백(ko) |
|---|---|---|
| ちゃうねん、ちゃうねん！聞(き)いて、踏切(ふみきり)にひっかかってん！ | ○ | 오사카에서는 변명도 개그로 넘긴다. 웃기면 분위기가 산다. |
| 大変(たいへん)申(もう)し訳(わけ)ございません。 | × | 너무 정중하다. 면접처럼 들린다. |
| わるいわるい！めっちゃ待(ま)った？ | ○ | 상대의 말(めっちゃ待った)을 받아 되돌리면 대화가 굴러간다. |

### 장면 2 — `src/art/vn/osaka/02`

- 장면 메모: Shinsekai street by day, Yuki relaxed with his hands in his pockets
- 대사: **腹(はら)減(へ)ったなぁ、何(なに)食(た)べる？**

| 선택지 | | 피드백(ko) |
|---|---|---|
| うーん、もんじゃ焼(や)き食(た)べよっか？ | × | 몬자야키는 도쿄 명물. 오사카라면 오코노미야키나 쿠시카츠. |
| 串(くし)カツ食(た)べてみたい！ | ○ | 신세카이 명물 쿠시카츠, 좋은 선택! |
| マックはどう？ | × | 오사카에서는 マック가 아니라 マクド라고 부른다. |

### 장면 3 — `src/art/vn/osaka/03`

- 장면 메모: The doorway of a kushikatsu shop at lunchtime, Yuki pushing the noren aside
- 대사: **邪魔(じゃま)するで〜**

| 선택지 | | 피드백(ko) |
|---|---|---|
| え、どういう意味(いみ)？ | × | 요시모토 신희극의 정석 개그. 진심으로 "돌아가"라는 게 아니다. |
| はいよ〜（店(みせ)を出(で)る） | ○ | 퍼펙트! 받아서 나가는 척하는 게 정석. |
| ほな、お邪魔(じゃま)しました〜（店(みせ)を出(で)る） | ○ | 좋은 보케(ボケ). 개그를 이어서 받아쳤다. |

### 장면 4 — `src/art/vn/osaka/04`

- 장면 메모: At a table inside the kushikatsu shop, Yuki across, the shared sauce tray between
- 대사: ****

| 선택지 | | 피드백(ko) |
|---|---|---|

### 장면 5 — `src/art/vn/osaka/05`

- 장면 메모: Shinsekai street around 3 pm, still daytime, the two walking
- 대사: **ほな、次(つぎ)はスマートボール行(い)こか！**

| 선택지 | | 피드백(ko) |
|---|---|---|

### 장면 6 — `src/art/vn/osaka/06`

- 장면 메모: Inside the Shinsekai smart-ball arcade, retro, Yuki grinning
- 대사: **よっしゃ、勝負(しょうぶ)しよか。負(ま)けた方(ほう)がジュースおごりな！**

| 선택지 | | 피드백(ko) |
|---|---|---|
| よっしゃ、受(う)けて立(た)つで！ | ○ | 내기를 노리(ノリ)로 받아치면 분위기가 산다. |
| え、お金(かね)賭(か)けるのはちょっと…… | × | 주스 한 병짜리 장난을 너무 진지하게 받았다. |
| ほな、ジュースやなくてたこ焼(や)きにしよ！ | ○ | 판을 키워서 되받는 오사카식 노리. |

### 장면 7 — `src/art/vn/osaka/07`

- 장면 메모: The smart-ball machines, the two playing side by side
- 대사: ****

| 선택지 | | 피드백(ko) |
|---|---|---|

### 장면 8 — `src/art/vn/osaka/08`

- 장면 메모: Back where they met in Shinsekai, the sky just turning to sunset
- 대사: **今日(きょう)楽(たの)しかったわ！また遊(あそ)ぼな！**

| 선택지 | | 피드백(ko) |
|---|---|---|
| うん、また遊(あそ)ぼな！ | ○ | 오사카 말투로 받아치면 하루 동안 익숙해진 게 드러난다. |
| 本日(ほんじつ)はありがとうございました。 | × | 하루 종일 같이 논 친구에게 너무 격식 차렸다. |
| 次(つぎ)も勝負(しょうぶ)しよな！ | ○ | 스마트볼 내기를 다시 꺼내 다음 약속으로 이어진다. |

## 아야노 (교토) — `kyoto`

부드럽게 말한다. 속뜻은 한 걸음 뒤에 있다

### 장면 1 — `src/art/vn/kyoto/01`

- 장면 메모: Kyoto Station's great staircase, one friend waiting with a small bow
- 대사: **わざわざ来(き)てくれはって、おおきに。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| いえいえ、こちらこそ。 | ○ | 겸손으로 받는 게 자연스럽다. 〜はる는 교토의 부드러운 경어 |
| 来(き)たかったから。 | ○ | 솔직한 것도 좋다. 다만 교토에선 조금 직구로 들린다 |
| はい。 | × | 너무 짧다. 한 마디면 '화났나?'로 읽힌다 |

### 장면 2 — `src/art/vn/kyoto/02`

- 장면 메모: Nishiki Market, narrow and crowded, a skewer held out
- 대사: **これ、食(た)べてみはる？**

| 선택지 | | 피드백(ko) |
|---|---|---|
| じゃあ、ちょっとだけ。 | ○ | 사양의 형태. 다 받는 것보다 자연스럽다 |
| いただきます。 | ○ | 그대로 받는 것도 실례는 아니다 |
| 結構(けっこう)です。 | × | 강하다. 거절하려면 お腹いっぱいで처럼 이유를 붙인다 |

### 장면 3 — `src/art/vn/kyoto/03`

- 장면 메모: A temple garden, gravel path, the friend speaking very quietly
- 대사: **ここ、静(しず)かにしといた方(ほう)がええかもしれへんね。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| あ、うるさかった？ごめん。 | ○ | 돌려 말한 주의를 알아챘다. 교토의 지적은 이 형태로 온다 |
| （声(こえ)を小(ちい)さくする） | ○ | 말보다 행동. 이게 가장 자연스럽다 |
| そうですね。 | × | 동의만 했다. 지적받았다는 걸 못 알아챈 대답 |

### 장면 4 — `src/art/vn/kyoto/04`

- 장면 메모: A traditional living room, late afternoon light, a teapot being lifted
- 대사: **そろそろ、お茶漬(ちゃづ)けでもどうどす？**

| 선택지 | | 피드백(ko) |
|---|---|---|
| あ、もうこんな時間(じかん)。そろそろ失礼(しつれい)します。 | ○ | 유명한 돌려말하기. '슬슬 갈 때'라는 신호로 통한다 |
| お構(かま)いなく。 | ○ | 애매하게 넘긴다. 모서리가 안 생긴다 |
| いただきます！ | × | 전설적인 오독. 다만 요즘 교토에서 실제로 이렇게 말하는 사람은 드물고, 도시전설처럼 회자된다 |

### 장면 5 — `src/art/vn/kyoto/05`

- 장면 메모: A narrow lane at dusk, the friend standing in a doorway
- 대사: **また寄(よ)っとくれやす。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| おおきに、また。 | ○ | 따라 돌려주면 거리가 줄어든다. 관광객은 거의 쓰지 않는 말 |
| ありがとう、またね。 | ○ | 표준어로도 충분하다. 억지로 사투리를 쓸 필요는 없다 |
| 必(かなら)ず行(い)きます。 | × | 인사치레에 정색으로 답한 셈. 약속처럼 무겁게 들린다 |

## 엔딩 카드

| id | 친구 | 종류 | 제목 | 대사 | 장면 메모 | 설명(ko) |
|---|---|---|---|---|---|---|
| `e_osaka_best` | osaka | 좋음 | 내일 또 보자 | ほな、明日(あした)も空(あ)いてる？ | Dotonbori at night, two friends laughing on the river wall, neon reflections | 농담을 되돌려준 회차. 템포가 맞으면 다음 약속은 그 자리에서 정해진다 |
| `e_osaka_norm` | osaka | 보통 | 그럼 다음에 | ほな、また今度(こんど)な。 | Station ticket gates at night, one friend waving from the far side | 나쁘지 않은 하루. 다만 경어가 남으면 거리도 조금 남는다 |
| `e_osaka_bad` | osaka | 나쁨 | 갈 수 있으면 갈게 | 次(つぎ)？……行(い)けたら行(い)くわ。 | Station ticket gates at dusk, the friend half-turned away with a vague wave | 오사카의 「行けたら行くわ(갈 수 있으면 갈게)」는 대개 안 온다는 뜻. 경어만 쓰고 농담도 못 받으면 다음 약속은 생기지 않는다 |
| `e_kyoto_best` | kyoto | 좋음 | 말하지 않은 것들 | あんた、よう気(き)づかはるね。 | A narrow Kyoto lane at dusk, two friends walking slowly, lanterns lit | 돌려 말한 걸 전부 알아챈 회차. 교토에선 알아채는 것이 예의가 된다 |
| `e_kyoto_norm` | kyoto | 보통 | 오차즈케 이야기 | ……まあ、ゆっくりしていっておくれやす。 | A traditional room, teapot on the table, afternoon light going amber | 몇 개를 놓친 회차. 못 알아챘다고 미움받은 건 아니다 |
| `e_both` | both | 수집 | 두 개의 간사이 | 大阪(おおさか)と京都(きょうと)、電車(でんしゃ)で40分(ぷん)。 | A split scene: Osaka neon on one side, a quiet Kyoto lane on the other, the same student in both | 양쪽을 모두 걸은 사람만의 카드. 40분 거리인데 말하는 방식이 이만큼 다르다 |
