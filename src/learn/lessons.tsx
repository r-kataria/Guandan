import { InlineCards as Ex } from '../components/Card'
import { LessonDef } from './types'

export const LESSONS: LessonDef[] = [
  {
    id: 'goal-and-table',
    n: 1,
    title: 'The goal & the table',
    subtitle: 'Partnerships, seating, and how a hand is won',
    tier: 'Basics',
    body: (
      <div className="lesson-body">
        <h2>Welcome to Guandan</h2>
        <p>
          Guandan (掼蛋, "throwing eggs/bombs") is played by <b>four players in two fixed
          partnerships</b>. Partners sit <b>opposite</b> each other: you and your partner face the
          two opponents. In this app you are seated at the bottom; your partner is across the table.
        </p>
        <p>
          The game uses <b>two full decks shuffled together — 108 cards</b> (everything twice, plus
          two Big and two Small Jokers). Each player is dealt <b>27 cards</b>.
        </p>
        <p>
          On each turn a player either <b>plays a legal combination that beats the last one</b> or{' '}
          <b>passes</b>. The first player to empty their hand finishes 1st; play continues for the
          others. The <b>partnership whose members finish earliest</b> wins the hand and climbs
          levels. The big idea: <b>shed your cards fast, but help your partner shed theirs too.</b>
        </p>
        <div className="callout">
          Guandan is a "climbing" game: each play must be <b>stronger than the one before</b>, until
          everyone passes and a new round (called a "trick") begins.
        </div>
      </div>
    ),
    drill: {
      type: 'quiz',
      question: 'How are the four players arranged?',
      options: [
        { text: 'Two partnerships, partners sitting opposite each other', correct: true, why: 'You and your partner sit across the table from one another.' },
        { text: 'Every player for themselves', correct: false, why: 'Guandan is a partnership game.' },
        { text: 'Two partnerships, partners sitting next to each other', correct: false, why: 'Partners sit opposite, not adjacent.' },
      ],
    },
  },
  {
    id: 'card-ranks',
    n: 2,
    title: 'Card ranks & beating singles',
    subtitle: 'The order of the cards, and your first play',
    tier: 'Basics',
    body: (
      <div className="lesson-body">
        <h2>From 2 up to the Jokers</h2>
        <p>
          Ignoring the special "level" rule for now, cards rank from low to high:{' '}
          <b>2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 10 · J · Q · K · A</b>, then the{' '}
          <b>Small Joker</b>, then the <b>Big Joker</b> as the single highest card.
        </p>
        <p>
          The simplest combination is a <b>single</b> — one card. To beat a single you play any
          single of higher rank. For example <Ex specs={['D9']} /> is beaten by{' '}
          <Ex specs={['S10']} />, <Ex specs={['HK']} />, or a Joker.
        </p>
        <div className="callout">Suits don't matter for ranking — only for straight flushes (later).</div>
        <p>Try it below: the opponent led a single. Beat it with the lowest card that works.</p>
      </div>
    ),
    drill: {
      type: 'select',
      level: 2,
      current: ['D9'],
      hand: ['S3', 'S6', 'D10', 'SJ', 'HK'],
      prompt: 'The opponent played ♦9. Play a single that beats it.',
      requireKind: 'single',
      mustBeat: true,
      hint: 'Any single higher than a 9 works — the ♦10 is the most economical.',
      successMsg: 'Nice — a higher single beats a single. Playing the lowest card that wins keeps your big cards for later.',
    },
  },
  {
    id: 'pairs-triples',
    n: 3,
    title: 'Pairs & triples',
    subtitle: 'Matching combinations',
    tier: 'Combinations',
    body: (
      <div className="lesson-body">
        <h2>Two and three of a kind</h2>
        <p>
          A <b>pair</b> is two cards of the same rank, e.g. <Ex specs={['S7', 'H7']} />. A{' '}
          <b>triple</b> is three of a kind, e.g. <Ex specs={['S9', 'H9', 'D9']} />.
        </p>
        <p>
          You can only beat a combination with the <b>same shape and the same number of cards</b>: a
          pair beats a pair, a triple beats a triple. A pair of 9s beats a pair of 7s; a pair can
          <b> never</b> be beaten by a single or a triple (only by a bigger pair — or a bomb).
        </p>
        <div className="callout">Same type, same count, higher rank. That rule governs almost every play.</div>
      </div>
    ),
    drill: {
      type: 'select',
      level: 2,
      current: ['S7', 'H7'],
      hand: ['S4', 'H4', 'S9', 'C9', 'SK'],
      prompt: 'A pair of 7s is on the table. Beat it with a pair.',
      requireKind: 'pair',
      mustBeat: true,
      hint: 'You need a pair higher than 7. Your pair of 9s does it (a lone King is just a single).',
      successMsg: 'Exactly — a higher pair beats a pair. Note your lone King could not help here; you needed a matching pair.',
    },
  },
  {
    id: 'straights-tubes-plates',
    n: 4,
    title: 'Straights, tubes & plates',
    subtitle: 'Consecutive combinations',
    tier: 'Combinations',
    body: (
      <div className="lesson-body">
        <h2>Runs of consecutive cards</h2>
        <p>
          A <b>straight</b> is <b>five cards in consecutive ranks</b>, any suits, e.g.{' '}
          <Ex specs={['S3', 'H4', 'D5', 'C6', 'S7']} />. Ace can be high (10-J-Q-K-A) or low
          (A-2-3-4-5), but runs can't wrap around (no Q-K-A-2-3). Jokers can't be in a straight.
        </p>
        <p>
          A <b>tube</b> is <b>three consecutive pairs</b>, e.g.{' '}
          <Ex specs={['S10', 'H10', 'SJ', 'HJ', 'SQ', 'HQ']} /> (10-10-J-J-Q-Q).
        </p>
        <p>
          A <b>plate</b> is <b>two consecutive triples</b>, e.g.{' '}
          <Ex specs={['S4', 'H4', 'D4', 'S5', 'H5', 'D5']} /> (444-555).
        </p>
        <p>Each is compared by its <b>top card</b>, and only against the same shape.</p>
      </div>
    ),
    drill: {
      type: 'select',
      level: 2,
      hand: ['S3', 'H4', 'D5', 'C6', 'S7', 'HK', 'SA'],
      prompt: "You're leading. Pick five cards that form a straight.",
      requireKind: 'straight',
      exactCount: 5,
      hint: 'Look for five ranks in a row: 3-4-5-6-7.',
      successMsg: 'That\'s a straight! Long combinations like this are great for dumping many cards at once.',
    },
  },
  {
    id: 'full-house',
    n: 5,
    title: 'Full houses',
    subtitle: 'A triple plus a pair',
    tier: 'Combinations',
    body: (
      <div className="lesson-body">
        <h2>Three plus two</h2>
        <p>
          A <b>full house</b> is a <b>triple together with a pair</b>, e.g.{' '}
          <Ex specs={['S8', 'H8', 'D8', 'S3', 'C3']} /> (three 8s + two 3s). It is ranked by its{' '}
          <b>triple</b>, so 888-33 beats 777-KK even though the King pair is higher.
        </p>
        <div className="callout">When comparing full houses, only the triple matters. Build your full house around a high triple.</div>
      </div>
    ),
    drill: {
      type: 'select',
      level: 2,
      hand: ['S8', 'H8', 'D8', 'S3', 'C3', 'SK'],
      prompt: "You're leading. Make a full house.",
      requireKind: 'fullhouse',
      exactCount: 5,
      hint: 'Three 8s plus the pair of 3s.',
      successMsg: 'A full house — triple 8s carried by the pair of 3s. Ranked by the 8s.',
    },
  },
  {
    id: 'bombs-1',
    n: 6,
    title: 'Bombs I — breaking the rules',
    subtitle: 'Four of a kind and the power to beat anything',
    tier: 'Bombs',
    body: (
      <div className="lesson-body">
        <h2>The great equalizer</h2>
        <p>
          A <b>bomb</b> breaks the "same shape" rule: <b>a bomb can be played on top of any normal
          combination</b>, no matter the type. The smallest bomb is <b>four of a kind</b>, e.g.{' '}
          <Ex specs={['S5', 'H5', 'D5', 'C5']} />.
        </p>
        <p>
          So even a powerful pair of Aces <Ex specs={['SA', 'HA']} /> can be blown away by a humble
          four-of-5s bomb. Bombs are your trump cards — but you only have so many, so spend them
          wisely (much more on this in the strategy lessons).
        </p>
        <div className="callout">A bomb beats any non-bomb. Only a bigger bomb beats a bomb.</div>
      </div>
    ),
    drill: {
      type: 'select',
      level: 2,
      current: ['SA', 'HA'],
      hand: ['S5', 'H5', 'D5', 'C5', 'S9'],
      prompt: 'A pair of Aces is on the table and you have no higher pair. Beat it anyway.',
      requireKind: 'bomb',
      mustBeat: true,
      hint: 'Four 5s is a bomb — and a bomb beats any pair, even Aces.',
      successMsg: 'Boom. A four-card bomb beats any normal combination, regardless of rank or type.',
    },
  },
  {
    id: 'bombs-2',
    n: 7,
    title: 'Bombs II — the hierarchy',
    subtitle: 'Straight flushes and bigger bombs',
    tier: 'Bombs',
    body: (
      <div className="lesson-body">
        <h2>Bigger bombs beat smaller bombs</h2>
        <p>From weakest to strongest, the bombs are:</p>
        <ol>
          <li><b>4 of a kind</b></li>
          <li><b>5 of a kind</b></li>
          <li><b>Straight flush</b> — five consecutive cards of one suit, e.g. <Ex specs={['S3', 'S4', 'S5', 'S6', 'S7']} /></li>
          <li><b>6, 7, 8, 9, 10 of a kind</b> (each bigger beats the last)</li>
          <li><b>Four Jokers</b> <Ex specs={['JB', 'JB', 'JS', 'JS']} /> — the ultimate bomb, beats everything</li>
        </ol>
        <p>
          A straight flush slots in <b>between the 5-of-a-kind and the 6-of-a-kind</b>. Within the
          same category, compare by rank (a six-of-Kings beats a six-of-9s).
        </p>
      </div>
    ),
    drill: {
      type: 'quiz',
      question: 'Which bomb is stronger: a straight flush, or a six-of-a-kind?',
      options: [
        { text: 'Six of a kind', correct: true, why: 'A straight flush sits between 5- and 6-of-a-kind, so any 6+ of a kind outranks it.' },
        { text: 'Straight flush', correct: false, why: 'Straight flush beats 4- and 5-of-a-kind, but loses to six-or-more of a kind.' },
        { text: 'They are equal', correct: false, why: 'Bombs always have a strict ordering.' },
      ],
    },
  },
  {
    id: 'levels',
    n: 8,
    title: 'The level system',
    subtitle: 'How teams climb, and the elevated level card',
    tier: 'Levels & Wilds',
    body: (
      <div className="lesson-body">
        <h2>Racing from 2 to A</h2>
        <p>
          Each team has a <b>level</b>, starting at <b>2</b> and climbing toward <b>A</b>. Winning a
          hand advances your level (by 1–3, covered in lesson 11). <b>The first team to win a hand
          at level A wins the whole game.</b>
        </p>
        <p>
          The current level also has a special power: the <b>level-rank cards jump in strength to
          just below the Jokers</b> — above the Ace. If your team is on level 7, then every 7 becomes
          the second-highest single in the game.
        </p>
        <p>
          So at level 7, a pair of 7s <Ex specs={['S7', 'D7']} level={7} /> <b>beats a pair of
          Aces</b>. (Inside a straight, though, a 7 still counts as a normal 7 — the boost only
          applies to singles, pairs, triples, and bombs.)
        </p>
      </div>
    ),
    drill: {
      type: 'select',
      level: 7,
      current: ['SA', 'CA'],
      hand: ['S7', 'D7', 'S4', 'D9', 'CK'],
      prompt: 'Your team is on level 7. A pair of Aces is on the table — beat it.',
      requireKind: 'pair',
      mustBeat: true,
      hint: 'At level 7, your pair of 7s is stronger than Aces.',
      successMsg: 'Right! Level cards are elevated above the Ace, so the pair of 7s wins.',
    },
  },
  {
    id: 'wild-cards',
    n: 9,
    title: 'Wild cards',
    subtitle: 'The Heart-level card stands in for anything',
    tier: 'Levels & Wilds',
    body: (
      <div className="lesson-body">
        <h2>The Heart wilds</h2>
        <p>
          At each level, the <b>level-rank card of Hearts</b> is a <b>wild card</b> (marked with a ★
          in this app). On level 5 that's the <Ex specs={['H5']} level={5} />. A wild can stand in
          for <b>any card except a Joker</b>, to help complete a pair, triple, straight, full house,
          tube, plate, or bomb.
        </p>
        <p>
          For example, at level 5, <Ex specs={['H5']} level={5} /> + <Ex specs={['SK']} /> becomes a{' '}
          <b>pair of Kings</b>. There are two such wilds in the deck (one per deck copy) — they're
          precious, so save them to complete your strongest combinations.
        </p>
        <div className="callout">A wild can be anything except a Joker — and Jokers themselves can never be replaced by a wild.</div>
      </div>
    ),
    drill: {
      type: 'select',
      level: 5,
      current: ['SQ', 'DQ'],
      hand: ['H5', 'SK', 'S3', 'D8'],
      prompt: 'Level 5: a pair of Queens is on the table. Use your wild ♥5 to beat it.',
      requireKind: 'pair',
      mustBeat: true,
      hint: 'Pair your wild ♥5 with the King to make a pair of Kings.',
      successMsg: 'The wild ♥5 became a King, forming a pair that beats the Queens. Wilds turn odd cards into combinations.',
    },
  },
  {
    id: 'tribute',
    n: 10,
    title: 'Tribute & return',
    subtitle: 'Paying the winners between hands',
    tier: 'Levels & Wilds',
    body: (
      <div className="lesson-body">
        <h2>The losers pay up</h2>
        <p>
          From the second hand onward, the <b>last-place player pays tribute</b>: they give their{' '}
          <b>single highest card</b> (excluding a wild) to the winning side. In return, a winner
          gives back any card of rank <b>10 or lower</b>. This narrows the gap a little — but the
          winners still get the better card and the right to lead.
        </p>
        <p>
          If <b>both opponents finished first and second</b> (a "double down"), <b>both</b> losers
          pay tribute, and the winners advance a full <b>three levels</b>.
        </p>
        <p>
          There's one escape: <b>anti-tribute</b>. If the losing side holds <b>both Big Jokers</b>,
          the tribute is cancelled entirely.
        </p>
        <div className="callout">Holding both Big Jokers after a loss saves you from paying tribute — a reason to hang on to them.</div>
      </div>
    ),
    drill: {
      type: 'quiz',
      question: 'You finished last. What do you give as tribute?',
      options: [
        { text: 'Your single highest card (but not a wild)', correct: true, why: 'Tribute is your highest non-wild card; a Big Joker would have to go.' },
        { text: 'Any card you choose', correct: false, why: 'You must give your highest card, not a card of your choosing.' },
        { text: 'Your entire lowest pair', correct: false, why: 'Tribute is a single card, not a pair.' },
      ],
    },
  },
  {
    id: 'winning',
    n: 11,
    title: 'Winning & scoring',
    subtitle: 'Finish order and the climb to A',
    tier: 'Levels & Wilds',
    body: (
      <div className="lesson-body">
        <h2>How many levels you climb</h2>
        <p>The winning team's advance depends on where its two players finished:</p>
        <ul>
          <li><b>1st &amp; 2nd</b> (a double down): <b>+3 levels</b></li>
          <li><b>1st &amp; 3rd</b>: <b>+2 levels</b></li>
          <li><b>1st &amp; 4th</b>: <b>+1 level</b></li>
        </ul>
        <p>
          Levels climb 2 → 3 → … → K → A. Once your team is on <b>A</b>, you must <b>take first place
          in a hand to win the whole game</b>. Get there before the opponents do!
        </p>
      </div>
    ),
    drill: {
      type: 'quiz',
      question: 'Your partner finishes 1st and you finish 2nd. How many levels does your team gain?',
      options: [
        { text: '3 levels', correct: true, why: 'Finishing 1st and 2nd ("double down") is the maximum, +3.' },
        { text: '1 level', correct: false, why: '+1 is for a 1st-and-4th finish.' },
        { text: '2 levels', correct: false, why: '+2 is for a 1st-and-3rd finish.' },
      ],
    },
  },
  {
    id: 'strategy-probing',
    n: 12,
    title: 'Strategy — probing & hand shape',
    subtitle: 'What to lead, and keeping your hand tidy',
    tier: 'Strategy',
    body: (
      <div className="lesson-body">
        <h2>Lead small, learn a lot</h2>
        <p>
          When you lead, you set the type everyone must follow. Early on, <b>lead low singles or low
          pairs to "probe"</b> — you lose little, and you learn what your opponents are holding by how
          they respond.
        </p>
        <p>
          Think about your <b>hand shape</b>: count how many separate "plays" your hand breaks into.
          Lone odd cards are a liability — try to attach them to combinations or shed them while
          leading. Keep your <b>high singles, level cards, wilds and bombs</b> for when they matter.
        </p>
        <div className="callout">A tidy hand of a few big combinations empties faster than many scattered singles.</div>
      </div>
    ),
    drill: {
      type: 'quiz',
      question: "It's your lead with a mediocre hand. What's usually best?",
      options: [
        { text: 'Lead a low single or pair to probe', correct: true, why: 'Cheap leads gather information and keep your power cards in reserve.' },
        { text: 'Lead your Ace immediately', correct: false, why: 'Spending control cards early leaves you weak in the endgame.' },
        { text: 'Lead your only bomb', correct: false, why: 'Bombs are precious; leading one away early is usually wasteful.' },
      ],
    },
  },
  {
    id: 'strategy-bombs',
    n: 13,
    title: 'Strategy — bomb management',
    subtitle: 'When to hold and when to detonate',
    tier: 'Strategy',
    body: (
      <div className="lesson-body">
        <h2>Timing is everything</h2>
        <p>Bombs win games, but only if you spend them at the right moment. Good times to bomb:</p>
        <ul>
          <li>To <b>stop an opponent who is about to empty their hand</b>.</li>
          <li>To <b>seize the lead</b> at a crucial moment when you can then run out your hand.</li>
          <li>To break a combination you simply can't beat normally, when the trick really matters.</li>
        </ul>
        <p>
          Otherwise, <b>hold</b>. A bomb in hand is also a threat that shapes how opponents play. And
          remember bigger bombs beat smaller ones — don't waste your four-of-a-kind if an opponent
          likely holds a bigger one.
        </p>
      </div>
    ),
    drill: {
      type: 'quiz',
      question: 'When is the strongest moment to use a bomb?',
      options: [
        { text: 'When an opponent is one or two cards from finishing', correct: true, why: 'Denying their win — or grabbing the lead to finish yourself — is the highest-value use.' },
        { text: 'On the very first trick, to look strong', correct: false, why: 'Early bombs waste a precious resource for little gain.' },
        { text: 'Any time you are bored of passing', correct: false, why: 'Spend bombs on purpose, not impatience.' },
      ],
    },
  },
  {
    id: 'strategy-partner',
    n: 14,
    title: 'Strategy — playing with your partner',
    subtitle: 'Two hands, one goal',
    tier: 'Strategy',
    body: (
      <div className="lesson-body">
        <h2>Win together</h2>
        <p>
          Guandan is a <b>team</b> game. The result depends on <b>both</b> partners' finishing
          places, so helping your partner go out is often worth more than going out yourself.
        </p>
        <p>Key cooperative habits:</p>
        <ul>
          <li><b>Don't overtake your partner.</b> If your partner played the current top combination and no opponent has beaten it, usually <b>pass</b> — let them win the trick and keep the lead.</li>
          <li><b>Lead types your partner is strong in</b>, and types your opponents have shown they dislike.</li>
          <li>If your hand is weak, <b>sacrifice</b> — feed your partner the lead and let the stronger hand finish first.</li>
        </ul>
        <div className="callout">When in doubt and your partner is winning the trick: pass. Cooperation beats greed.</div>
      </div>
    ),
    drill: {
      type: 'quiz',
      question: 'Your partner played a combo nobody has beaten, and you could beat it. Should you?',
      options: [
        { text: 'No — usually pass and let your partner win the trick', correct: true, why: 'Overtaking your own partner wastes a card and hands them no advantage.' },
        { text: 'Yes — always play your highest combination', correct: false, why: 'That competes against your own team.' },
        { text: 'Yes — bomb it to be safe', correct: false, why: 'Never bomb your partner; you would be attacking your own side.' },
      ],
    },
  },
  {
    id: 'graduation',
    n: 15,
    title: 'Graduation',
    subtitle: 'Put it all together against the Hard AI',
    tier: 'Strategy',
    body: (
      <div className="lesson-body">
        <h2>You're ready</h2>
        <p>
          You now know the ranks, every combination, the full bomb hierarchy, the level system, wild
          cards, tribute, scoring, and the core strategy. That's everything you need to play real
          Guandan.
        </p>
        <p>The path to mastery from here is practice. Your graduation challenge:</p>
        <ul>
          <li>Open <b>Play</b>, set difficulty to <b>Hard</b>, and win a full game to level A.</li>
          <li>Keep the <b>Coach</b> panel on — it will keep nudging you with situational advice.</li>
          <li>Use <b>Hint</b> when stuck, but try to predict the suggestion first.</li>
        </ul>
        <p>Watch how the bots conserve bombs, feed their partner, and punish loose play — then do it better. Good luck!</p>
      </div>
    ),
  },
]

export function getLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id)
}

export function lessonIndex(id: string): number {
  return LESSONS.findIndex((l) => l.id === id)
}
