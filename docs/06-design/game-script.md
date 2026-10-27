# 대화 게임 대본 (레벨 8)

> **생성 문서 — 고치지 말 것.** `src/content/vn.ts`·`endings.ts` 에서 `node scripts/gen-comic-scripts.mjs` 로 만든다. 대사를 바꾸려면 그 파일을 고치고 다시 생성한다.

## 그림 규칙 (Y-J3)

- 장면: `src/art/vn/<친구>/<nn>` — **가로 4:3**. 엔딩 카드: `src/art/endings/<id>` — **가로 3:2**. `.webp`·`.png`·`.jpg`, 한 장 400KB 이하 권장.
- 그림에는 글자를 넣지 않는다. 대사와 선택지는 앱이 그림 아래에 보여 준다.
- ○ = 자연스러운 답(점수), × = 어색한 답. 피드백은 고른 뒤에 보인다.
- 한자 뒤 괄호 = 앱이 다는 후리가나.
- 엔딩: 놓친 선택이 1개 이하면 좋은 엔딩, 그보다 많으면 보통 엔딩. 두 친구의 엔딩을 하나씩 모으면 `e_both`.

## 유우키 (오사카) — `osaka`

목소리가 크다. 조용히 있으면 걱정받는다

### 장면 1 — `src/art/vn/osaka/01`

- 장면 메모: Two friends meeting at a crowded Osaka Station concourse, one waving hard
- 대사: **おー、こっちこっち！めっちゃ待(ま)ったで〜**

| 선택지 | | 피드백(ko) |
|---|---|---|
| ごめん、遅(おく)れた！ | ○ | 친구에겐 すみません보다 ごめん. 경어는 거리를 만든다 |
| 申(もう)し訳(わけ)ありません。 | × | 지나치게 정중하다. 알바 면접처럼 들린다 |
| えー、めっちゃ待(ま)った？ | ○ | 상대의 말을 받아 되돌리면 대화가 굴러간다 |

### 장면 2 — `src/art/vn/osaka/02`

- 장면 메모: A takoyaki stall, steam rising, friend already eating
- 대사: **ここのたこ焼(や)き、めっちゃうまいねん。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| ほんま？ | ○ | 맞장구는 이걸로 충분. 간사이에선 本当？보다 이쪽 |
| ねん、って何(なに)？ | ○ | 물어봐도 된다. 〜ねん은 〜んだ에 해당. 설명을 반기는 사람이 많다 |
| そうですか。 | × | 경어로 돌아가면 대화가 멈춘다. 친구 앞에선 풀어도 된다 |

### 장면 3 — `src/art/vn/osaka/03`

- 장면 메모: A covered shopping arcade, an older shopkeeper leaning out of her stall
- 대사: **お姉(ねえ)ちゃん、ええの入(はい)ってるで。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| ちょっと高(たか)いなあ。 | ○ | 가격 얘기는 실례가 아니다. 상점가에선 대화의 일부 |
| まけてくれます？ | ○ | 상점가에선 통하기도. 슈퍼나 체인점에선 쓰지 않는다 |
| （黙(だま)って値札(ねふだ)を見(み)る） | × | 물어보는 건 공짜, 가 오사카의 감각 |

### 장면 4 — `src/art/vn/osaka/04`

- 장면 메모: Both sitting on a river wall at Dotonbori, neon reflected in the water
- 대사: **俺(おれ)な、昨日(きのう)道(みち)で100万円(まんえん)拾(ひろ)ってん。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| 嘘(うそ)つけ！ | ○ | 놀랄 자리가 아니다. 의심하는 게 정답인 츳코미 |
| えー、すごい！ | × | 믿으면 얘기가 끝난다. 농담은 받기보다 되돌린다 |
| ほんまに？ | ○ | 반신반의. 약하지만 쓸 만한 반응 |

### 장면 5 — `src/art/vn/osaka/05`

- 장면 메모: Yuki sliding open the door of a small okonomiyaki shop, grinning back over a shoulder
- 대사: **邪魔(じゃま)すんでー。**

| 선택지 | | 피드백(ko) |
|---|---|---|
| 邪魔(じゃま)すんなら帰(かえ)ってー。 | ○ | 요시모토 신희극의 단골 주고받기. 유우키 "알고 있네!" |
| どうぞ、どうぞ。 | × | 그냥 들여보내면 보케가 허공에 뜬다. 여기선 받아칠 차례 |
| お邪魔(じゃま)します。 | × | 정중하고 맞는 말이지만, 유우키가 기다리는 건 츳코미 |

### 장면 6 — `src/art/vn/osaka/06`

- 장면 메모: Ticket gates at night, the friend already walking backwards, waving
- 대사: **ほな、またな！**

| 선택지 | | 피드백(ko) |
|---|---|---|
| ほな、また。 | ○ | ほな는 じゃあ. 따라서 돌려주면 단숨에 가까워진다 |
| さようなら。 | × | 무겁다. 다시 안 볼 사람에게 하는 말처럼 들린다 |
| お疲(つか)れさまでした。 | × | 알바 끝나고 하는 인사. 친구에겐 조금 남 같다 |

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
| `e_kyoto_best` | kyoto | 좋음 | 말하지 않은 것들 | あんた、よう気(き)づかはるね。 | A narrow Kyoto lane at dusk, two friends walking slowly, lanterns lit | 돌려 말한 걸 전부 알아챈 회차. 교토에선 알아채는 것이 예의가 된다 |
| `e_kyoto_norm` | kyoto | 보통 | 오차즈케 이야기 | ……まあ、ゆっくりしていっておくれやす。 | A traditional room, teapot on the table, afternoon light going amber | 몇 개를 놓친 회차. 못 알아챘다고 미움받은 건 아니다 |
| `e_both` | both | 수집 | 두 개의 간사이 | 大阪(おおさか)と京都(きょうと)、電車(でんしゃ)で40分(ぷん)。 | A split scene: Osaka neon on one side, a quiet Kyoto lane on the other, the same student in both | 양쪽을 모두 걸은 사람만의 카드. 40분 거리인데 말하는 방식이 이만큼 다르다 |
