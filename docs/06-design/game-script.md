# 대화 게임 대본 (레벨 8)

> **생성 문서 — 고치지 말 것.** `src/content/vn.ts`·`endings.ts` 에서 `node scripts/gen-comic-scripts.mjs` 로 만든다. 대사를 바꾸려면 그 파일을 고치고 다시 생성한다.

## 그림 규칙 (Y-J3)

- 장면: `src/art/vn/<친구>/<nn>` — **가로 4:3**. 엔딩 카드: `src/art/endings/<id>` — **가로 3:2**. `.webp`·`.png`·`.jpg`, 한 장 400KB 이하 권장.
- 그림에는 글자를 넣지 않는다. 대사와 선택지는 앱이 그림 아래에 보여 준다.
- ○ = 자연스러운 답(점수), × = 어색한 답. 피드백은 고른 뒤에 보인다.
- 한자 뒤 괄호 = 앱이 다는 후리가나.
- osaka 엔딩: 놓친 선택 0개 이하면 좋은 엔딩, 맞힌 선택 1개 이하면 나쁜 엔딩, 그 사이는 보통 엔딩.
- kyoto 엔딩: 놓친 선택 0개 이하면 좋은 엔딩, 맞힌 선택 1개 이하면 나쁜 엔딩, 그 사이는 보통 엔딩.

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

목소리가 작다. 하고 싶은 말은 늘 한 걸음 뒤에 있다

### 장면 1 — `src/art/vn/kyoto/01`

- 장면 메모: Gion Shirakawa at 3 pm, a stone path and willows, few people, Ayano in kimono waiting quietly
- 대사: **遠(とお)いとこ、ようおこしやす。……えらい動(うご)きやすそうな格好(かっこう)してはりますなぁ。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| あ、そうなんです！すごく楽(らく)なんですよ。 | × | 칭찬이 아니다. 「動きやすそう」는 '오늘 같은 날 그 옷이에요?'라는 교토식 꼬집기. 상대는 기모노를 차려입고 왔다 |
| 大変(たいへん)申(もう)し訳(わけ)ございません。 | × | 너무 정중하다. 가볍게 꼬집은 말이 진짜 꾸중이 되어, 오히려 상대가 미안해진다 |
| わっ、あやのさん、着物(きもの)すごく似合(にあ)ってますね！せっかくの花火(はなび)なのに、普段着(ふだんぎ)でごめんなさい。 | ○ | 차려입은 상대를 먼저 칭찬하고, 편한 옷은 가볍게 사과했다. 둘 다 챙긴 완벽한 대답 |

### 장면 2 — `src/art/vn/kyoto/02`

- 장면 메모: The same Gion street in the afternoon sun, Ayano tilting her head, thinking
- 대사: **始(はじ)まるまで、まだ時間(じかん)おすなぁ。どこぞ行(い)きまひょか？**

| 선택지 | | 피드백(ko) |
|---|---|---|
| この辺(へん)にいい雰囲気(ふんいき)の抹茶(まっちゃ)カフェがあるらしいんですけど、どうですか？ | ○ | 가까워서 부담이 없고, 기모노 차림의 상대가 앉아 쉴 수 있는 곳. 배려가 느껴진다 |
| 京都(きょうと)の観光(かんこう)がしたいです！嵐山(あらしやま)はどうですか？ | × | 불꽃놀이 전에 다녀오기엔 멀다. 교토의 「また今度」는 정중한 거절이다 |
| ハイキングはどうですか？あそこにちょうどいい山(やま)が見(み)えますよ！ | × | 게타에 기모노 차림인 상대를 생각하지 않았다. 「お元気どすなぁ」는 칭찬이 아니다 |

### 장면 3 — `src/art/vn/kyoto/03`

- 장면 메모: Inside a quiet Kyoto matcha tea house at 4 pm, tatami and low tables, Ayano holding a menu
- 대사: **デザートセット頼(たの)める時間(じかん)どすなぁ、うれしおすわぁ。何(なに)にしはります？**

| 선택지 | | 피드백(ko) |
|---|---|---|
| 私(わたし)、あんまり欲(ほ)しいものないんで、お水(みず)で大丈夫(だいじょうぶ)です。あやのさんだけ注文(ちゅうもん)しますか？ | × | 일본 카페는 1인 1주문이 기본. 혼자만 시키게 하면 상대가 곤란하다. 게다가 이 가게를 고른 건 나다 |
| 抹茶(まっちゃ)とみたらし団子(だんご)のセットが美味(おい)しそうですね。 | ○ | 무난하고 상식적인 좋은 대답 |
| チョコレートケーキが美味(おい)しそうですね。分(わ)けて食(た)べませんか？ | ○ | 1인 1디저트가 기본이지만, 각자 시켜서 나눠 먹는 건 괜찮다 |

### 장면 4 — `src/art/vn/kyoto/04`

- 장면 메모: A Kyoto matcha tea house by day, the two at a table with a self-serve matcha set
- 대사: ****

| 선택지 | | 피드백(ko) |
|---|---|---|

### 장면 5 — `src/art/vn/kyoto/05`

- 장면 메모: The Kamo riverbank at dusk, a little sunset, the two walking toward the festival, lanterns being lit
- 대사: **ええ時間(じかん)になってきましたなぁ。ほな、そろそろ行(い)きまひょか。**

| 선택지 | | 피드백(ko) |
|---|---|---|

### 장면 6 — `src/art/vn/kyoto/06`

- 장면 메모: A festival street lined with yatai stalls, lively and packed, Ayano looking over the stalls
- 대사: **ほんま迷(まよ)いますなぁ。何(なに)がよろしおすやろ？**

| 선택지 | | 피드백(ko) |
|---|---|---|
| りんご飴(あめ)とか綿(わた)あめみたいな甘(あま)いもの、どうですか？ | ○ | 노점의 정석. 예쁜 옷에 어울리는 귀여운 선택 |
| たこ焼(や)きとかベビーカステラなら一口(ひとくち)で食(た)べられるし、食(た)べやすそうですね！ | ○ | 한 입 크기라 기모노를 입고도 먹기 편하다 |
| 焼(や)きとうもろこしとか、イカ焼(や)きはどうですか？すごくいい匂(にお)いがしますね。 | × | 뜯어 먹는 음식은 기모노를 더럽히기 쉽다. 「匂いは」의 は가 '먹기는 글쎄'라는 신호 |

### 장면 7 — `src/art/vn/kyoto/07`

- 장면 메모: A red wooden bridge over a river at 7 pm, fireworks in full bloom, Ayano holding her phone out with a small smile
- 대사: **ほんまに見事(みごと)な景色(けしき)どすなぁ。お写真(しゃしん)、撮(と)ってさしあげまひょか？**

| 선택지 | | 피드백(ko) |
|---|---|---|
| そうですね！こういう所(ところ)だと写真(しゃしん)撮(と)りたくなりますね。私(わたし)もあやのさんの撮(と)りますよ！ | ○ | 「撮ってさしあげまひょか」는 '나도 찍히고 싶다'는 신호. 알아채고 서로 찍어 주었다 |
| あ、ありがとうございます！はい、チーズ！ | × | 자기만 찍고 끝냈다. 「よろしおすこと」는 '좋겠네요(나는?)'에 가깝다 |
| うーん、私(わたし)あんまり写真(しゃしん)撮(と)られるの得意(とくい)じゃなくて……あやのさんはどうですか？撮(と)りますよ！ | ○ | 내 성향대로 거절해도 된다. 대신 상대는 어떤지 물어본 게 포인트 |

### 장면 8 — `src/art/vn/kyoto/08`

- 장면 메모: Ayano on the red bridge, looking back over her shoulder, fireworks over the hills behind
- 대사: ****

| 선택지 | | 피드백(ko) |
|---|---|---|

## 엔딩 카드

| id | 친구 | 종류 | 제목 | 대사 | 장면 메모 | 설명(ko) |
|---|---|---|---|---|---|---|
| `e_osaka_best` | osaka | 좋음 | 내일 또 보자 | ほな、明日(あした)も空(あ)いてる？ | Dotonbori at night, two friends laughing on the river wall, neon reflections | 농담을 되돌려준 회차. 템포가 맞으면 다음 약속은 그 자리에서 정해진다 |
| `e_osaka_norm` | osaka | 보통 | 그럼 다음에 | ほな、また今度(こんど)な。 | Station ticket gates at night, one friend waving from the far side | 나쁘지 않은 하루. 다만 경어가 남으면 거리도 조금 남는다 |
| `e_osaka_bad` | osaka | 나쁨 | 갈 수 있으면 갈게 | 次(つぎ)？……行(い)けたら行(い)くわ。 | Station ticket gates at dusk, the friend half-turned away with a vague wave | 오사카의 「行けたら行くわ(갈 수 있으면 갈게)」는 대개 안 온다는 뜻. 경어만 쓰고 농담도 못 받으면 다음 약속은 생기지 않는다 |
| `e_kyoto_best` | kyoto | 좋음 | 내년 여름에도 | 今日(きょう)はほんまにおおきに。……来年(らいねん)の花火(はなび)も、一緒(いっしょ)に来(き)てくれはります？ | The red bridge after the last firework, Ayano smiling openly, her sleeve raised to her lips | 돌려 말한 걸 전부 알아챈 하루. 교토 사람이 먼저 꺼낸 '다음'은 진짜 약속이다 |
| `e_kyoto_norm` | kyoto | 보통 | 조심히 들어가세요 | 今日(きょう)はおおきに。気(き)ぃつけて帰(かえ)っておくれやす。 | The end of the red bridge, the crowd thinning, Ayano bowing politely | 나쁘지 않은 하루. 몇 개를 놓쳤지만 아야노는 끝까지 상냥했다. 교토의 상냥함은 거리이기도 하다 |
| `e_kyoto_bad` | kyoto | 나쁨 | 인연이 닿으면 | ほな、またご縁(えん)がありましたら。 | The red bridge in drifting smoke after the fireworks, Ayano walking away with a small polite bow over her shoulder | 교토의 「またご縁があれば」는 대개 '다시 볼 일은 없을 것'. 오사카의 「行けたら行くわ」와 같다 |
