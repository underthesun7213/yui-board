/* A short introduction to each prefecture, shown on the map when one is
   picked in "All of Japan". Loaded on demand (actions/map.ts), so it stays
   out of the map bundle. Facts that do not change much: places, food, the
   region — no figures that go out of date. Keys are the JIS codes of
   domain/geo/prefs.ts. */
export type PrefIntro = { ja: string; en: string; ko: string };

export const PREF_INTRO: Record<string, PrefIntro> = {
  '01': {
    ja: '日本最北で、いちばん広い都道府県です。雪の多い冬、2月のさっぽろ雪まつり、乳製品や海産物、ラーメンで知られます。',
    en: "Japan's northernmost and largest prefecture: snowy winters, the Sapporo Snow Festival in February, dairy, seafood and ramen.",
    ko: '일본 최북단이자 가장 넓은 도도부현이에요. 눈 많은 겨울, 2월의 삿포로 눈축제, 유제품과 해산물, 라멘으로 유명해요.',
  },
  '02': {
    ja: '本州の北の端。りんごと、8月初めに大きな灯籠の山車が練り歩くねぶた祭で知られます。',
    en: 'The northern tip of Honshu, known for apples and the Nebuta festival in early August, with giant lantern floats.',
    ko: '혼슈의 북쪽 끝이에요. 사과, 그리고 8월 초 거대한 등롱 수레가 거리를 누비는 네부타 축제로 유명해요.',
  },
  '03': {
    ja: '東北の広く山がちな県。世界遺産の平泉・中尊寺や、次々におかわりが出るわんこそばで知られます。',
    en: "A wide, mountainous prefecture in Tohoku, home to Hiraizumi's Chuson-ji temple (World Heritage) and wanko soba served bowl after bowl.",
    ko: '도호쿠의 넓고 산이 많은 현이에요. 세계유산인 히라이즈미 주손지와, 그릇이 비면 계속 채워 주는 완코소바로 유명해요.',
  },
  '04': {
    ja: '東北最大の都市・仙台がある県。島々が浮かぶ松島は日本三景のひとつで、牛たんが名物です。',
    en: "Home to Sendai, Tohoku's largest city. The island-dotted bay of Matsushima is one of Japan's three classic views; try grilled beef tongue.",
    ko: '도호쿠 최대 도시 센다이가 있는 현이에요. 섬이 떠 있는 마쓰시마는 일본 3대 절경 중 하나이고, 소 혀 구이가 명물이에요.',
  },
  '05': {
    ja: '日本海側の雪深い県。なまはげの伝統行事、秋田犬、きりたんぽで知られます。',
    en: 'A snowy prefecture on the Sea of Japan side, known for the Namahage folk tradition, Akita dogs and kiritanpo rice sticks.',
    ko: '동해 쪽의 눈 많은 현이에요. 나마하게 전통 행사, 아키타견, 기리탄포로 유명해요.',
  },
  '06': {
    ja: '山と温泉の県。銀山温泉の町並み、さくらんぼ、冬の蔵王の樹氷（スノーモンスター）が有名です。',
    en: "Mountains and hot springs: the old inns of Ginzan Onsen, cherries, and Zao's frost-covered 'snow monsters' in winter.",
    ko: '산과 온천의 현이에요. 긴잔 온천 거리, 체리, 겨울 자오의 수빙(스노 몬스터)이 유명해요.',
  },
  '07': {
    ja: '東北の南の入り口。会津若松の鶴ヶ城、かやぶき屋根の宿場町・大内宿、桃で知られます。',
    en: "Tohoku's southern gateway: Tsuruga Castle in Aizu-Wakamatsu, the thatched post town of Ouchi-juku, and peaches.",
    ko: '도호쿠의 남쪽 관문이에요. 아이즈와카마쓰의 쓰루가성, 초가지붕 역참 마을 오우치주쿠, 복숭아로 유명해요.',
  },
  '08': {
    ja: '東京の北東。春に丘が青く染まる国営ひたち海浜公園のネモフィラ、水戸の納豆と偕楽園で知られます。',
    en: "Northeast of Tokyo: Hitachi Seaside Park's hills of blue nemophila in spring, and Mito's natto and Kairakuen garden.",
    ko: '도쿄의 북동쪽이에요. 봄에 언덕이 파랗게 물드는 히타치 해변공원의 네모필라, 미토의 낫토와 가이라쿠엔으로 유명해요.',
  },
  '09': {
    ja: '世界遺産の日光東照宮と、中禅寺湖などの湖や滝がある県。宇都宮は餃子の町です。',
    en: "Nikko's Toshogu shrine (World Heritage), lakes and waterfalls; Utsunomiya is famous for gyoza.",
    ko: '세계유산 닛코 도쇼구와 주젠지호 같은 호수와 폭포가 있는 현이에요. 우쓰노미야는 교자의 도시예요.',
  },
  '10': {
    ja: '海のない山の県で、草津などの温泉が有名です。世界遺産の富岡製糸場もあります。',
    en: 'A landlocked, mountainous prefecture with hot springs such as Kusatsu, and the Tomioka Silk Mill (World Heritage).',
    ko: '바다가 없는 산의 현으로, 구사쓰 같은 온천이 유명해요. 세계유산 도미오카 제사장도 있어요.',
  },
  '11': {
    ja: '東京のとなりで、ここから東京へ通う人も多い県。「小江戸」と呼ばれる川越の町並みや、秩父の山があります。',
    en: "Next to Tokyo, where many people live and commute from. Kawagoe's 'Little Edo' streets and the Chichibu mountains are here.",
    ko: '도쿄 바로 옆이라 여기서 도쿄로 출퇴근하는 사람이 많아요. "작은 에도"라 불리는 가와고에 거리와 지치부의 산이 있어요.',
  },
  '12': {
    ja: '東京の東。成田空港と東京ディズニーリゾートはこの県にあり、房総半島には海辺が続きます。',
    en: 'East of Tokyo. Narita Airport and Tokyo Disney Resort are in Chiba, and the Boso Peninsula has long stretches of coast.',
    ko: '도쿄의 동쪽이에요. 나리타 공항과 도쿄 디즈니 리조트가 이 현에 있고, 보소반도에는 해안이 길게 이어져요.',
  },
  '13': {
    ja: '日本の首都。新宿、渋谷、浅草など街ごとに顔が違います。西には奥多摩の山、南には島々もあります。京都から新幹線で2時間あまり。',
    en: 'The capital. Each neighbourhood has its own character — Shinjuku, Shibuya, Asakusa — with mountains to the west and islands to the south. A little over two hours from Kyoto by Shinkansen.',
    ko: '일본의 수도예요. 신주쿠, 시부야, 아사쿠사처럼 동네마다 분위기가 달라요. 서쪽엔 오쿠타마의 산, 남쪽엔 섬들도 있어요. 교토에서 신칸센으로 2시간 남짓.',
  },
  '14': {
    ja: '東京の南。横浜の港と中華街、鎌倉の大仏、富士山が見える箱根の温泉があります。',
    en: "South of Tokyo: Yokohama's port and Chinatown, Kamakura's Great Buddha, and the hot springs of Hakone with views of Mt Fuji.",
    ko: '도쿄의 남쪽이에요. 요코하마의 항구와 차이나타운, 가마쿠라의 대불, 후지산이 보이는 하코네 온천이 있어요.',
  },
  '15': {
    ja: '日本海側の雪深い県。コシヒカリの米と日本酒で知られ、佐渡島もあります。',
    en: 'A snowy prefecture on the Sea of Japan, known for Koshihikari rice and sake, and home to Sado Island.',
    ko: '동해 쪽의 눈 많은 현이에요. 고시히카리 쌀과 니혼슈로 유명하고, 사도섬도 있어요.',
  },
  '16': {
    ja: '海と北アルプスにはさまれた県。春の立山黒部アルペンルートの雪の壁、ホタルイカや白えびが有名です。',
    en: 'Between the sea and the Northern Alps: the snow walls of the Tateyama Kurobe Alpine Route in spring, firefly squid and white shrimp.',
    ko: '바다와 북알프스 사이의 현이에요. 봄 다테야마 구로베 알펜루트의 눈벽, 반딧불오징어와 흰새우가 유명해요.',
  },
  '17': {
    ja: '金沢の兼六園、古い茶屋街、金箔で知られる県。北には能登半島が延びます。',
    en: "Kanazawa's Kenroku-en garden, old teahouse districts and gold leaf; the Noto Peninsula stretches north.",
    ko: '가나자와의 겐로쿠엔, 옛 찻집 거리, 금박으로 유명한 현이에요. 북쪽으로 노토반도가 뻗어 있어요.',
  },
  '18': {
    ja: '恐竜の化石と博物館で知られる県。禅寺の永平寺、東尋坊の断崖、冬のカニがあります。',
    en: 'Known for dinosaur fossils and its dinosaur museum, the Zen temple of Eihei-ji, the Tojinbo cliffs and crab in winter.',
    ko: '공룡 화석과 박물관으로 유명한 현이에요. 선종 사찰 에이헤이지, 도진보 절벽, 겨울 게가 있어요.',
  },
  '19': {
    ja: '富士山の北側。富士五湖があり、ぶどうや桃、ワインの産地です。',
    en: 'The north side of Mt Fuji, with the Fuji Five Lakes; a region of grapes, peaches and wine.',
    ko: '후지산의 북쪽이에요. 후지 5호가 있고, 포도와 복숭아, 와인의 산지예요.',
  },
  '20': {
    ja: '日本アルプスの県。スキー、善光寺、松本城、温泉に入る地獄谷のスノーモンキーで知られます。',
    en: 'The Japan Alps: skiing, Zenko-ji temple, Matsumoto Castle and the snow monkeys bathing in the hot springs of Jigokudani.',
    ko: '일본 알프스의 현이에요. 스키, 젠코지, 마쓰모토성, 온천에 몸을 담그는 지고쿠다니의 원숭이로 유명해요.',
  },
  '21': {
    ja: '世界遺産・白川郷の合掌造り、飛騨高山の古い町並み、長良川の鵜飼で知られます。',
    en: "Shirakawa-go's thatched farmhouses (World Heritage), the old streets of Takayama and cormorant fishing on the Nagara River.",
    ko: '세계유산 시라카와고의 갓쇼즈쿠리 집, 히다 다카야마의 옛 거리, 나가라강의 가마우지 낚시로 유명해요.',
  },
  '22': {
    ja: '富士山の南側。茶畑が広がり、伊豆半島には温泉と海辺があります。',
    en: 'The south side of Mt Fuji, with green tea fields and the hot springs and beaches of the Izu Peninsula.',
    ko: '후지산의 남쪽이에요. 녹차밭이 펼쳐지고, 이즈반도에는 온천과 바닷가가 있어요.',
  },
  '23': {
    ja: '中部最大の都市・名古屋がある県。名古屋城、トヨタの地元で、みそかつや手羽先が名物です。',
    en: "Home to Nagoya, central Japan's largest city, Nagoya Castle and Toyota; try miso katsu and tebasaki chicken wings.",
    ko: '중부 최대 도시 나고야가 있는 현이에요. 나고야성, 도요타의 고장이고, 미소카쓰와 데바사키가 명물이에요.',
  },
  '24': {
    ja: '伊勢神宮と、真珠や海女で知られる伊勢志摩の海があります。大阪から近鉄で行けます。',
    en: 'Ise Grand Shrine and the Ise-Shima coast, known for pearls and ama divers. Reachable from Osaka on the Kintetsu line.',
    ko: '이세 신궁과, 진주와 해녀로 알려진 이세시마 바다가 있어요. 오사카에서 긴테쓰선으로 갈 수 있어요.',
  },
  '25': {
    ja: '日本最大の湖・琵琶湖がある、京都のとなりの県。彦根城もあります。',
    en: "Next to Kyoto, built around Lake Biwa, Japan's largest lake; Hikone Castle is here too.",
    ko: '교토 바로 옆, 일본에서 가장 큰 호수 비와호가 있는 현이에요. 히코네성도 있어요.',
  },
  '26': {
    ja: '千年以上都だった町。清水寺や伏見稲荷大社など寺社が多く、枚方から京阪電車で祇園四条まで乗り換えなしで行けます。',
    en: 'The capital for over a thousand years, full of temples and shrines such as Kiyomizu-dera and Fushimi Inari. The Keihan line runs from Hirakata to Gion-Shijo with no change.',
    ko: '천 년 넘게 수도였던 도시예요. 기요미즈데라, 후시미 이나리 같은 절과 신사가 많고, 히라카타에서 게이한선으로 기온시조까지 갈아타지 않고 가요.',
  },
  '27': {
    ja: '結のある枚方市は大阪府の北東部です。「天下の台所」と呼ばれ、たこ焼きやお好み焼き、梅田・なんばの繁華街、大阪城があります。',
    en: "結 is in Hirakata, in the northeast of Osaka. Called 'the nation's kitchen': takoyaki and okonomiyaki, the busy streets of Umeda and Namba, and Osaka Castle.",
    ko: '結가 있는 히라카타시는 오사카부의 북동쪽이에요. "천하의 부엌"이라 불리며, 다코야키와 오코노미야키, 우메다·난바의 번화가, 오사카성이 있어요.',
  },
  '28': {
    ja: '神戸の港と神戸牛、世界遺産の姫路城、有馬温泉、淡路島がある県です。',
    en: "Kobe's port and Kobe beef, Himeji Castle (World Heritage), Arima Onsen and Awaji Island.",
    ko: '고베의 항구와 고베규, 세계유산 히메지성, 아리마 온천, 아와지섬이 있는 현이에요.',
  },
  '29': {
    ja: '古い都が置かれた県。東大寺の大仏、奈良公園のシカ、法隆寺があります。',
    en: 'An ancient capital: the Great Buddha of Todai-ji, the deer of Nara Park, and Horyu-ji temple.',
    ko: '옛 수도가 있던 현이에요. 도다이지의 대불, 나라 공원의 사슴, 호류지가 있어요.',
  },
  '30': {
    ja: '世界遺産の熊野古道と高野山の寺々、白浜の海、梅とみかんで知られます。',
    en: 'The Kumano Kodo pilgrimage trails and the temples of Mt Koya (World Heritage), the beaches of Shirahama, plums and mandarins.',
    ko: '세계유산 구마노 고도와 고야산의 절들, 시라하마 바다, 매실과 귤로 유명해요.',
  },
  '31': {
    ja: '人口がいちばん少ない県。鳥取砂丘と、冬のカニで知られます。',
    en: 'The least populous prefecture, known for the Tottori Sand Dunes and crab in winter.',
    ko: '인구가 가장 적은 현이에요. 돗토리 사구와 겨울 게로 유명해요.',
  },
  '32': {
    ja: '縁結びの出雲大社、松江城、世界遺産の石見銀山がある県です。',
    en: 'Izumo Taisha, the shrine of matchmaking, Matsue Castle and the Iwami Ginzan silver mine (World Heritage).',
    ko: '인연을 맺어 준다는 이즈모 대사, 마쓰에성, 세계유산 이와미 은광이 있는 현이에요.',
  },
  '33': {
    ja: '「晴れの国」と呼ばれる県。後楽園、倉敷の美観地区、桃とぶどうで知られます。',
    en: "The 'land of sunshine': Korakuen garden, Kurashiki's canal-side old quarter, peaches and grapes.",
    ko: '"맑은 나라"라 불리는 현이에요. 고라쿠엔, 구라시키의 미관지구, 복숭아와 포도로 유명해요.',
  },
  '34': {
    ja: '平和記念公園と原爆ドーム、宮島の厳島神社の大鳥居（どちらも世界遺産）、広島風お好み焼きの県です。',
    en: "The Peace Memorial Park and Atomic Bomb Dome, Miyajima's Itsukushima Shrine with its torii in the sea (both World Heritage), and Hiroshima-style okonomiyaki.",
    ko: '평화기념공원과 원폭 돔, 미야지마 이쓰쿠시마 신사의 바다 위 도리이(둘 다 세계유산), 히로시마식 오코노미야키의 현이에요.',
  },
  '35': {
    ja: '本州の西の端。錦帯橋、下関のふぐ、カルスト台地の秋吉台があります。',
    en: 'The western tip of Honshu: the arched Kintai Bridge, pufferfish in Shimonoseki and the karst plateau of Akiyoshidai.',
    ko: '혼슈의 서쪽 끝이에요. 긴타이교, 시모노세키의 복어, 카르스트 대지 아키요시다이가 있어요.',
  },
  '36': {
    ja: '8月の阿波おどりと、鳴門のうず潮で知られる四国の県です。',
    en: 'A Shikoku prefecture known for the Awa Odori dance festival in August and the whirlpools of Naruto.',
    ko: '8월의 아와오도리 춤 축제와 나루토의 소용돌이로 유명한 시코쿠의 현이에요.',
  },
  '37': {
    ja: '面積がいちばん小さい県。讃岐うどんの本場で、瀬戸内海にはアートの島・直島があります。',
    en: 'The smallest prefecture by area and the home of sanuki udon; the art island of Naoshima lies in the Seto Inland Sea.',
    ko: '면적이 가장 작은 현이에요. 사누키 우동의 본고장이고, 세토 내해에는 예술의 섬 나오시마가 있어요.',
  },
  '38': {
    ja: '松山の道後温泉は日本でも古い温泉のひとつ。みかんと、広島へ渡るしまなみ海道のサイクリングで知られます。',
    en: "Matsuyama's Dogo Onsen is one of Japan's oldest hot springs; known for mikan oranges and cycling the Shimanami Kaido to Hiroshima.",
    ko: '마쓰야마의 도고 온천은 일본에서도 오래된 온천 중 하나예요. 귤, 그리고 히로시마로 건너가는 시마나미 해도 자전거 길로 유명해요.',
  },
  '39': {
    ja: '太平洋に面した県。四万十川、かつおのたたき、坂本龍馬のふるさとです。',
    en: 'On the Pacific: the Shimanto River, seared bonito (katsuo no tataki) and the hometown of Sakamoto Ryoma.',
    ko: '태평양에 면한 현이에요. 시만토강, 가다랑어 다타키, 사카모토 료마의 고향이에요.',
  },
  '40': {
    ja: '九州最大の都市・福岡（博多）がある県。とんこつラーメンと屋台が名物で、韓国にも近い町です。',
    en: "Home to Fukuoka (Hakata), Kyushu's largest city, famous for tonkotsu ramen and yatai food stalls, and close to Korea.",
    ko: '규슈 최대 도시 후쿠오카(하카타)가 있는 현이에요. 돈코쓰 라멘과 포장마차가 명물이고, 한국과도 가까워요.',
  },
  '41': {
    ja: '有田焼・伊万里焼の焼き物と、弥生時代の吉野ヶ里遺跡、唐津で知られます。',
    en: 'Known for Arita and Imari porcelain, the ancient Yoshinogari site and the castle town of Karatsu.',
    ko: '아리타·이마리 도자기, 야요이 시대 유적 요시노가리, 가라쓰로 유명해요.',
  },
  '42': {
    ja: 'ヨーロッパや中国との長い交流の歴史がある県。グラバー園、平和公園、多くの島々、ちゃんぽんがあります。',
    en: 'A long history of trade with Europe and China: Glover Garden, the Peace Park, many islands, and champon noodles.',
    ko: '유럽, 중국과 오랜 교류의 역사가 있는 현이에요. 글로버 정원, 평화공원, 많은 섬, 짬뽕이 있어요.',
  },
  '43': {
    ja: '熊本城、阿蘇山の大きなカルデラ、くまモンの県です。',
    en: "Kumamoto Castle, Mt Aso's huge caldera, and Kumamon the bear mascot.",
    ko: '구마모토성, 아소산의 거대한 칼데라, 구마몬의 현이에요.',
  },
  '44': {
    ja: '「おんせん県」と呼ばれ、別府や湯布院の温泉で知られます。',
    en: "The 'hot spring prefecture', known for the onsen towns of Beppu and Yufuin.",
    ko: '"온천현"이라 불리며, 벳푸와 유후인 온천으로 유명해요.',
  },
  '45': {
    ja: '暖かい太平洋の海岸とサーフィン、高千穂峡、マンゴーやチキン南蛮で知られます。',
    en: 'A warm Pacific coast for surfing, the Takachiho Gorge, mangoes and chicken nanban.',
    ko: '따뜻한 태평양 해안과 서핑, 다카치호 협곡, 망고와 치킨 난반으로 유명해요.',
  },
  '46': {
    ja: '湾の向こうに活火山・桜島がそびえる県。世界遺産の屋久島の杉、黒豚、焼酎で知られます。',
    en: "Sakurajima, an active volcano across the bay, Yakushima's ancient cedars (World Heritage), black pork and shochu.",
    ko: '만 건너편에 활화산 사쿠라지마가 솟은 현이에요. 세계유산 야쿠시마의 삼나무, 흑돼지, 소주로 유명해요.',
  },
  '47': {
    ja: '亜熱帯の島々の県。サンゴの海、琉球王国の歴史と文化、沖縄料理があります。',
    en: 'Subtropical islands: coral seas, the history and culture of the Ryukyu Kingdom, and Okinawan food.',
    ko: '아열대 섬들의 현이에요. 산호 바다, 류큐 왕국의 역사와 문화, 오키나와 요리가 있어요.',
  },
};
