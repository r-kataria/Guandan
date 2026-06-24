import { InlineCards as Ex } from '../components/Card'

export function Reference() {
  return (
    <div className="container">
      <div className="hero" style={{ paddingBottom: '0.5rem' }}>
        <h1>Rules Reference</h1>
        <p>Everything in one place. Keep this open while you play.</p>
      </div>

      <div className="ref-section panel">
        <h3>Setup</h3>
        <ul className="lesson-body">
          <li>4 players, 2 partnerships; partners sit opposite.</li>
          <li>Two decks = <b>108 cards</b> (each card ×2, plus 2 Big + 2 Small Jokers). 27 cards each.</li>
          <li>Empty your hand to finish; the partnership finishing earliest wins the hand and climbs levels.</li>
        </ul>
      </div>

      <div className="ref-section panel">
        <h3>Card order</h3>
        <p className="lesson-body">
          2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 10 · J · Q · K · A · Small Joker · Big Joker.
          The current <b>level rank</b> is elevated to just below the Jokers (above Ace) — except
          inside straights/tubes/plates, where it keeps its natural position.
        </p>
      </div>

      <div className="ref-section panel">
        <h3>Combinations</h3>
        <table className="ref-table">
          <thead>
            <tr><th>Type</th><th>Cards</th><th>Example</th><th>Compared by</th></tr>
          </thead>
          <tbody>
            <tr><td>Single</td><td>1</td><td><Ex specs={['SA']} /></td><td>its rank</td></tr>
            <tr><td>Pair</td><td>2 same rank</td><td><Ex specs={['S7', 'H7']} /></td><td>the rank</td></tr>
            <tr><td>Triple</td><td>3 same rank</td><td><Ex specs={['S9', 'H9', 'D9']} /></td><td>the rank</td></tr>
            <tr><td>Full house</td><td>triple + pair</td><td><Ex specs={['S8', 'H8', 'D8', 'S3', 'C3']} /></td><td>the triple</td></tr>
            <tr><td>Straight</td><td>5 consecutive</td><td><Ex specs={['S3', 'H4', 'D5', 'C6', 'S7']} /></td><td>top card</td></tr>
            <tr><td>Tube</td><td>3 consecutive pairs</td><td><Ex specs={['S10', 'H10', 'SJ', 'HJ', 'SQ', 'HQ']} /></td><td>top pair</td></tr>
            <tr><td>Plate</td><td>2 consecutive triples</td><td><Ex specs={['S4', 'H4', 'D4', 'S5', 'H5', 'D5']} /></td><td>top triple</td></tr>
          </tbody>
        </table>
        <p className="kbd-hint">A non-bomb can only be beaten by the same type with the same number of cards and a higher rank.</p>
      </div>

      <div className="ref-section panel">
        <h3>Bombs (weakest → strongest)</h3>
        <table className="ref-table">
          <thead><tr><th>#</th><th>Bomb</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Four of a kind</td><td>The smallest bomb.</td></tr>
            <tr><td>2</td><td>Five of a kind</td><td>Possible with duplicates + wilds.</td></tr>
            <tr><td>3</td><td>Straight flush</td><td>5 consecutive, one suit, e.g. <Ex specs={['S3', 'S4', 'S5', 'S6', 'S7']} /></td></tr>
            <tr><td>4</td><td>Six … Ten of a kind</td><td>Each larger size beats the smaller.</td></tr>
            <tr><td>5</td><td>Four Jokers</td><td><Ex specs={['JB', 'JB', 'JS', 'JS']} /> — beats everything.</td></tr>
          </tbody>
        </table>
        <p className="kbd-hint">A bomb beats any non-bomb. Between bombs: higher category wins; same category, higher rank wins.</p>
      </div>

      <div className="ref-section panel">
        <h3>Levels, wilds & winning</h3>
        <ul className="lesson-body">
          <li>Teams climb from level 2 toward A. <b>Win a hand at level A to win the game.</b></li>
          <li>Advance <b>+3</b> for a 1st-and-2nd finish, <b>+2</b> for 1st-and-3rd, <b>+1</b> for 1st-and-4th.</li>
          <li>The <b>Heart card of the level rank is wild</b> (★) — it stands in for any card except a Joker.</li>
        </ul>
      </div>

      <div className="ref-section panel">
        <h3>Tribute</h3>
        <ul className="lesson-body">
          <li>From hand 2 on, the last-place player gives their <b>highest non-wild card</b> to the winners.</li>
          <li>The winner returns any card of rank <b>≤ 10</b>.</li>
          <li><b>Double down</b> (opponents finished 1st &amp; 2nd): both losers pay; winners gain 3 levels.</li>
          <li><b>Anti-tribute</b>: if the losing side holds both Big Jokers, tribute is cancelled.</li>
        </ul>
      </div>
    </div>
  )
}
