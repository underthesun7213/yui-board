/* English for the lines of episode 8 (src/content/vn.ts, endings.ts,
   achievements.ts), keyed by the Japanese exactly as written there; a unit test
   checks every line has one and none is left over. Its own chunk, loaded when
   the game opens (actions/learn.ts ensureVnEn), so the lessons bundle stays in
   budget. The tone is the point of the game: polite stays stiff, Osaka stays
   loose, and Kyoto keeps saying less than it means. */
export const VN_EN: Record<string, string> = {
  /* Osaka: Yuki */
  'おー、こっちこっち！めっちゃ{待|ま}ったで〜。{何|なに}しとってん！':
    "Hey, over here! I've been waiting forever! What were you up to?",
  'ちゃうねん、ちゃうねん！{聞|き}いて、{踏切|ふみきり}にひっかかってん！':
    'No no no, listen! I got stuck at a railway crossing!',
  '{自分|じぶん}、{地下鉄|ちかてつ}で{来|き}たやろ！': 'You came by subway!',
  '{大変|たいへん}{申|もう}し{訳|わけ}ございません。': 'I most deeply apologize.',
  'まあまあ、そんな{謝|あやま}らんでもええって': 'Hey now, no need to apologize like that.',
  'わるいわるい！めっちゃ{待|ま}った？': 'Sorry, sorry! Been waiting forever, huh?',
  '{次|つぎ}は{許|ゆる}さへんで〜': "Next time I won't forgive you~",
  '{腹|はら}{減|へ}ったなぁ、{何|なに}{食|た}べる？': "Man, I'm starving. What should we eat?",
  'うーん、もんじゃ{焼|や}き{食|た}べよっか？': 'Hmm, how about monjayaki?',
  'もんじゃ？それ{東京|とうきょう}やん！せっかく{新世界|しんせかい}やし、{串|くし}カツいこうや':
    "Monja? That's a Tokyo thing! We're in Shinsekai, let's get kushikatsu.",
  '{串|くし}カツ{食|た}べてみたい！': 'I want to try kushikatsu!',
  'せやな、{新世界|しんせかい}なら{串|くし}カツやんな。{串|くし}カツのソースは{二度漬|にどづ}け{禁止|きんし}やで':
    'Right, in Shinsekai it has to be kushikatsu. And no double-dipping in the sauce.',
  'マックはどう？': 'How about Mac?',
  'マック？{大阪|おおさか}ではマクドやで！{昨日|きのう}マクド{食|た}べたから、{今日|きょう}はちょっとなぁ。{串|くし}カツにせぇへん？{新世界|しんせかい}やし':
    '"Mac"? In Osaka it\'s "Makudo"! I had Makudo yesterday, so not today. Kushikatsu instead? We\'re in Shinsekai.',
  '{邪魔|じゃま}するで〜': "We're coming in~",
  '{邪魔|じゃま}すんなら{帰|かえ}って〜': "If you're coming in to bother us, go home~",
  'え、どういう{意味|いみ}？': 'Huh, what does that mean?',
  '{急|きゅう}に{新喜劇|しんきげき}かい！……あー、これただのギャグやから':
    "A Shinkigeki routine out of nowhere! ...Ah, relax, it's just a gag.",
  'はいよ〜（{店|みせ}を{出|で}る）': 'Okay then~ (leaves the shop)',
  'ほんまに{帰|かえ}るんかい！いらっしゃい、いらっしゃい〜':
    "You're really leaving?! Come in, come in~",
  '{新喜劇|しんきげき}{知|し}ってるやん！やるやん！': 'You know Shinkigeki! Not bad!',
  'ほな、お{邪魔|じゃま}しました〜（{店|みせ}を{出|で}る）':
    'Well then, sorry to bother you~ (leaves the shop)',
  '{自分|じぶん}、なかなかやるやん！': "Hey, you're pretty good!",
  'ほな、{次|つぎ}はスマートボール{行|い}こか！': "Okay, smart ball next. Let's go!",
  'よっしゃ、{勝負|しょうぶ}しよか。{負|ま}けた{方|ほう}がジュースおごりな！':
    'All right, a match. Loser buys the juice!',
  'よっしゃ、{受|う}けて{立|た}つで！': "All right, you're on!",
  'おっ、ええやん！ほな{手加減|てかげん}せえへんで〜': "Oh, nice! Then I won't go easy on you~",
  'え、お{金|かね}{賭|か}けるのはちょっと……': "Um, I'm not really okay with betting money...",
  'いやいや、ジュースやで！？そんな{大|おお}げさな{話|はなし}ちゃうって':
    "No no, it's a juice! It's not that big a deal!",
  'ほな、ジュースやなくてたこ{焼|や}きにしよ！': "Then let's make it takoyaki, not juice!",
  'おっ、{上|あ}げてきたな！ええで、{乗|の}った！': "Oh, raising the stakes! Fine, I'm in!",
  'えーっ！！もう{一回|いっかい}！……いや、わかったわかった、{俺|おれ}の{負|ま}けや。しゃあないな、おごったるわ':
    "Whaaat?! One more! ...No, okay, okay, I lost. Can't be helped, it's on me.",
  'よっしゃー！{俺|おれ}の{勝|か}ちや！ごちそうさまで〜す': 'Yes! I win! Thanks for the treat~',
  '{今日|きょう}{楽|たの}しかったわ！また{遊|あそ}ぼな！': "Today was fun! Let's hang out again!",
  'うん、また{遊|あそ}ぼな！': "Yeah, let's hang out again!",
  'おっ、もう{大阪弁|おおさかべん}うつってるやん！': "Oh, you've already caught the Osaka dialect!",
  '{本日|ほんじつ}はありがとうございました。': 'Thank you very much for today.',
  '{急|きゅう}にかしこまるやん！{友達|ともだち}やろ〜': "So formal all of a sudden! We're friends~",
  '{次|つぎ}も{勝負|しょうぶ}しよな！': "Let's have another match next time!",
  '{望|のぞ}むところや！ほな、またな〜': 'Bring it on! See you, then~',

  /* Kyoto: Ayano */
  '{遠|とお}いとこ、ようおこしやす。……えらい{動|うご}きやすそうな{格好|かっこう}してはりますなぁ。':
    'So good of you to come all this way. ...My, what easy-to-move-in clothes you are wearing.',
  'あ、そうなんです！すごく{楽|らく}なんですよ。': "Oh, they are! They're really comfortable.",
  'あらまぁ、それはよろしおしたなぁ。': 'Oh my, how nice for you.',
  'いえいえ、そないなこと{気|き}にせんといておくれやす。':
    'No, no, please do not trouble yourself over such a thing.',
  'わっ、あやのさん、{着物|きもの}すごく{似合|にあ}ってますね！せっかくの{花火|はなび}なのに、{普段着|ふだんぎ}でごめんなさい。':
    "Wow, Ayano, that kimono really suits you! Sorry I'm in everyday clothes on a fireworks day.",
  'おおきに。{謝|あやま}らはることあらしまへん。': 'Thank you. There is nothing to apologize for.',
  '{始|はじ}まるまで、まだ{時間|じかん}おすなぁ。どこぞ{行|い}きまひょか？':
    'There is still some time before it starts. Shall we go somewhere?',
  'この{辺|へん}にいい{雰囲気|ふんいき}の{抹茶|まっちゃ}カフェがあるらしいんですけど、どうですか？':
    "I hear there's a matcha café with a nice atmosphere around here. How about it?",
  'よろしおすなぁ。ちょうど{三時|さんじ}やし、おやつの{時間|じかん}どすなぁ。':
    "That sounds lovely. It is just three o'clock, time for a little something sweet.",
  '{京都|きょうと}の{観光|かんこう}がしたいです！{嵐山|あらしやま}はどうですか？':
    'I want to go sightseeing in Kyoto! How about Arashiyama?',
  '{嵐山|あらしやま}どすか。よろしおすなぁ。また{今度|こんど}、ゆっくりの{時|とき}にでも。':
    'Arashiyama. How lovely. Another time, perhaps, when there is more time.',
  'ハイキングはどうですか？あそこにちょうどいい{山|やま}が{見|み}えますよ！':
    'How about a hike? I can see a perfect mountain over there!',
  'ハイキング……お{元気|げんき}どすなぁ。うち、この{格好|かっこう}どすさかい。':
    'A hike... How energetic you are. I am dressed like this, you see.',
  'デザートセット{頼|たの}める{時間|じかん}どすなぁ、うれしおすわぁ。{何|なに}にしはります？':
    'We are in time for the dessert set, how nice. What will you have?',
  '{私|わたし}、あんまり{欲|ほ}しいものないんで、お{水|みず}で{大丈夫|だいじょうぶ}です。あやのさんだけ{注文|ちゅうもん}しますか？':
    "There's nothing I really want, so water is fine for me. Do you want to order just for yourself?",
  'そうどすか。ここはあんまりお{口|くち}に{合|あ}わへんみたいどすなぁ。ほな、{他|ほか}のとこ{行|い}きまひょか？':
    'I see. This place does not seem much to your taste. Shall we go somewhere else, then?',
  '{抹茶|まっちゃ}とみたらし{団子|だんご}のセットが{美味|おい}しそうですね。':
    'The matcha and mitarashi dango set looks delicious.',
  'みたらし{団子|だんご}、{美味|おい}しそうどすなぁ。うちはアーモンドのパウンドケーキにしまひょ。':
    'Mitarashi dango does look delicious. I shall have the almond pound cake.',
  'チョコレートケーキが{美味|おい}しそうですね。{分|わ}けて{食|た}べませんか？':
    'The chocolate cake looks delicious. Want to share?',
  'よろしおすなぁ。ほな、うちも{頼|たの}んで{半分|はんぶん}こしまひょか。':
    'How lovely. Then I shall order too, and we can split them half and half.',
  'ええ{時間|じかん}になってきましたなぁ。ほな、そろそろ{行|い}きまひょか。':
    'It is getting to be about time. Well then, shall we be going?',
  'ほんま{迷|まよ}いますなぁ。{何|なに}がよろしおすやろ？':
    'It really is hard to choose. What would be nice, I wonder?',
  'りんご{飴|あめ}とか{綿|わた}あめみたいな{甘|あま}いもの、どうですか？':
    'How about something sweet, like a candy apple or cotton candy?',
  'りんご{飴|あめ}、{食|た}べはったことあります？お{祭|まつ}りいうたら、やっぱりりんご{飴|あめ}どすなぁ。':
    'Have you ever had a candy apple? When it comes to festivals, it has to be candy apples.',
  'たこ{焼|や}きとかベビーカステラなら{一口|ひとくち}で{食|た}べられるし、{食|た}べやすそうですね！':
    'Takoyaki or baby castella are one bite each, so they look easy to eat!',
  'ベビーカステラ、{懐|なつ}かしおすなぁ。{小|ちい}さい{頃|ころ}、ほんまに{好|す}きどしたんえ。{一緒|いっしょ}に{食|た}べまひょか？':
    'Baby castella, how that takes me back. I truly loved them as a child. Shall we have some together?',
  '{焼|や}きとうもろこしとか、イカ{焼|や}きはどうですか？すごくいい{匂|にお}いがしますね。':
    'How about grilled corn or grilled squid? They smell amazing.',
  '{匂|にお}いはほんまによろしおすなぁ。……{着物|きもの}で、{上手|じょうず}に{食|た}べられますやろか。':
    'The smell is truly lovely. ...I wonder if one could eat them neatly in a kimono.',
  'ほんまに{見事|みごと}な{景色|けしき}どすなぁ。お{写真|しゃしん}、{撮|と}ってさしあげまひょか？':
    'What a truly splendid view. Shall I take a photo for you?',
  'そうですね！こういう{所|ところ}だと{写真|しゃしん}{撮|と}りたくなりますね。{私|わたし}もあやのさんの{撮|と}りますよ！':
    "It is! A place like this makes you want to take photos. I'll take one of you too, Ayano!",
  'あら、よろしおすなぁ。おおきに。{二人|ふたり}のも、どなたかに{頼|たの}んでみまひょか？':
    'Oh, how lovely. Thank you. Shall we ask someone to take one of us both, too?',
  'あ、ありがとうございます！はい、チーズ！': 'Oh, thank you! Okay, say cheese!',
  'えらい{楽|たの}しそうどすなぁ。よろしおすこと。':
    'You do look to be enjoying yourself. How nice.',
  'うーん、{私|わたし}あんまり{写真|しゃしん}{撮|と}られるの{得意|とくい}じゃなくて……あやのさんはどうですか？{撮|と}りますよ！':
    "Hmm, I'm not great at having my photo taken... What about you, Ayano? I'll take one!",
  'そうどすか、{残念|ざんねん}やけどしゃあおへんなぁ。ほな、かんにんどすけど、うちだけ{撮|と}ってもろてもよろしおす？':
    'I see. A pity, but it cannot be helped. Then, forgive me, might you take one of just me?',

  /* endings */
  'ほな、{明日|あした}も{空|あ}いてる？': 'So, you free tomorrow too?',
  'ほな、また{今度|こんど}な。': 'Well, next time, then.',
  '{次|つぎ}？……{行|い}けたら{行|い}くわ。': "Next time? ...I'll go if I can.",
  '{今日|きょう}はほんまにおおきに。……{来年|らいねん}の{花火|はなび}も、{一緒|いっしょ}に{来|き}てくれはります？':
    'Thank you so much for today. ...Will you come with me to the fireworks next year too?',
  '{今日|きょう}はおおきに。{気|き}ぃつけて{帰|かえ}っておくれやす。':
    'Thank you for today. Please take care on your way home.',
  'ほな、またご{縁|えん}がありましたら。': 'Well then, until next time, if fate allows.',

  /* achievements */
  'やっぱ{串|くし}カツは{最高|さいこう}やな！': 'Kushikatsu really is the best!',
  '{勝負|しょうぶ}の{後|あと}のジュースは{格別|かくべつ}やな！':
    'Juice after a match hits different!',
  'ほら、{熱|あつ}いうちに{食|た}べよ': "Here, let's eat while they're hot.",
  'ハートのラテ、{飲|の}むのもったいないわぁ': 'A heart latte. It seems a shame to drink it.',
  'やっぱり、お{祭|まつ}りはりんご{飴|あめ}どすなぁ':
    'A festival really does call for a candy apple.',
  'ええ{写真|しゃしん}、おおきに。{大事|だいじ}にしますえ':
    'A lovely photo, thank you. I shall treasure it.',
};
