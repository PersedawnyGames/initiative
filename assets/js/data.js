/* ==========================================================================
   Initiative — site data
   --------------------------------------------------------------------------
   This is the only file you need to edit to keep the site up to date.
   Everything (roster, events, FC info) is rendered from here.
   ========================================================================== */

/* --- Free Company details ----------------------------------------------- */
const FC = {
  name: 'Initiative',
  dataCenter: 'Light',
  world: 'Alpha',
  region: 'EU',
  lodestone: 'https://eu.finalfantasyxiv.com/lodestone/freecompany/9279948507173654675/',
  discord: 'https://discord.gg/ffinit',        // from the FC slogan on the Lodestone

  // Everything below is refreshed automatically from the Lodestone
  // (see lodestone.js). These values only show if it can't be reached.
  tag: 'INIT',
  founded: '2026',
  members: 490,
  rank: 30,
  recruitment: 'Open',
  estateName: 'Initiative Sanctum',
  estateAddress: 'Plot 30, 19 Ward, Mist (Medium)'
};

/* --- Ranks ---------------------------------------------------------------
   Which in-game FC ranks appear on the roster page, in this order.
   name:   the rank exactly as the Lodestone member list shows it
   label:  the heading used on the site
-------------------------------------------------------------------------- */
const RANKS = [
  { name: 'The Emperor', label: 'Emperor' },
  { name: 'Regent',      label: 'Regent' },
  { name: 'Council',     label: 'Council' }
];

/* Order of the cards on the roster page, by the title shown on each card
   (a member's `rankLabel` below, or else their rank's label above). */
const ROSTER_ORDER = ['Emperor', 'Overseer', 'High Council', 'Council'];

/* --- Roster --------------------------------------------------------------
   One row per character. Anyone on the Lodestone member list holding one of
   the RANKS above appears on the roster page automatically.

   Edit these yourself:
     discord   their Discord name
     role      their role in the community
     rankLabel (optional) show this title on their card instead of the rank's
               label (e.g. 'High Council') — sorting still follows the rank
     hidden    (optional) true = keep this character off the roster page
     altOf     (optional) the Lodestone id of their main character — an alt
               with this set shares the main's card instead of getting its own

   Refreshed from the Lodestone (matched by id) — the values here are only a
   saved copy, shown if the Lodestone can't be reached:
     name · rank · id · portrait
-------------------------------------------------------------------------- */
const MEMBERS = [
  { name: 'Cipher Imperius',   discord: 'Cipher',           role: 'Community Leadership',  rank: 'The Emperor', id: '61287057', portrait: 'https://img2.finalfantasyxiv.com/f/8385d4f331e00b9a92abd1dc2322de6d_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789544578' },
  { name: 'Dino Dan',          discord: 'Nemo Rosa',        role: 'Member Management',     rank: 'Regent',      rankLabel: 'Overseer', altOf: '3078113', id: '61277910', portrait: 'https://img2.finalfantasyxiv.com/f/e931fbe7c5b039f2a3017dcab855f1eb_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789545688' },
  { name: 'Lumina Cipher',      discord: '',                 role: '',                      rank: 'Regent',      hidden: true, id: '61342026', portrait: '' },
  { name: 'Ninja Novak',        discord: '',                 role: '',                      rank: 'Regent',      hidden: true, id: '61355324', portrait: '' },
  { name: 'Kidagakash Nedakh', discord: 'Kida (Alba)',      role: 'Member Support',        rank: 'Regent',      rankLabel: 'High Council', id: '61302595', portrait: 'https://img2.finalfantasyxiv.com/f/4d1a1d6d3046ff53ad533b185b39a5a2_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789545546' },
  { name: 'Nemo Rosa',         discord: 'Nemo Rosa',        role: 'Member Management',     rank: 'Regent',      rankLabel: 'Overseer', id: '3078113', portrait: 'https://img2.finalfantasyxiv.com/f/8c09e967f667289e22af8a7804d36e9e_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789545883' },
  { name: 'Opal Noxfleuret',   discord: 'Opal Noxfleuret',  role: 'Estate Management',     rank: 'Regent',      rankLabel: 'High Council', id: '38510729', portrait: 'https://img2.finalfantasyxiv.com/f/0adce7b73914ddc306318aac1eeea802_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789546719' },
  { name: 'Dawn Undomiel',     discord: 'Dawn Undomiel',    role: 'Events Manager',        rank: 'Council',     rankLabel: 'Overseer',     id: '61417925', portrait: 'https://img2.finalfantasyxiv.com/f/62a93a3aafe9b6af1b2572395ae096ec_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789546626' },
  { name: 'Mizuki Sasaki',      discord: 'Summer / Mizuki',  role: 'FC Operations Manager', rank: 'Council',     altOf: '56325437', id: '60104764', portrait: '' },
  { name: 'Pale King',        discord: 'Pale King',        role: 'High-End Content Lead', rank: 'Council',     id: '61342637', portrait: 'https://img2.finalfantasyxiv.com/f/a0de494ee474fe0ebb025b3b81dfc74d_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789547107' },
  { name: 'Summer Cassidy',    discord: 'Summer / Mizuki',  role: 'FC Operations Manager', rank: 'Council',     id: '56325437', portrait: 'https://img2.finalfantasyxiv.com/f/ad695212e542b122edc3d95d88633d83_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789547815' }
];

/* --- Event type colors ----------------------------------------------------
   Used for the calendar's filter pills and event bars. Add a line here
   whenever you start using a new `type` below — anything without a match
   just falls back to gold.
-------------------------------------------------------------------------- */
const EVENT_TYPE_COLORS = {
  Raid:            '#e0665c',
  Social:          '#6fd3e8',
  Newbie:          '#7cc576',
  Event:           '#c8a95e',
  FF14:            '#b18cf0',
  'Game Night':    '#e8944a',
  Movie:           '#5c8ce0',
  'FC Month':      '#e06ba8',
  'Treasure Maps': '#2fb8a3'
};

/* --- Upcoming events -----------------------------------------------------
   date:     'YYYY-MM-DD', the first (or only) day
   endDate:  'YYYY-MM-DD', optional — only set this for something that runs
             more than one day (inclusive). E.g. a fan meet from the 10th to
             the 12th: date: '2026-09-10', endDate: '2026-09-12'. Leave it
             out for a normal one-night event and it's just that one day.
   adventDay: (optional) the day of the December advent calendar this event
             belongs to — it shows as "???" until that day, then takes its real
             title and details from the ADVENT list further down.
   time:     free text  ·  type: short label — give it a color above so it
             shows up on the calendar, otherwise it's just gold
-------------------------------------------------------------------------- */
const EVENTS = [
  {
    date: '2026-08-04',
    endDate: '2026-10-05',
    title: 'Yo-kai Watch: Gather One, Gather All!',
    type: 'FF14',
    detail: 'Official crossover event. Gather Yo-kai medals starting in Ul’dah and trade them for minions, weapons and furnishings, plus the Whisper-go mount. Also brings back rewards from past Yo-kai Watch collabs. Runs 4 Aug, 8:00 GMT – 5 Oct, 14:59 GMT.'
  },
  {
    date: '2026-09-01',
    endDate: '2026-09-30',
    title: 'FC Room Competition',
    type: 'FC Month'
  },
  {
    date: '2026-09-01',
    endDate: '2026-09-30',
    title: 'FC Bingo',
    type: 'FC Month'
  },
  {
    date: '2026-10-01',
    endDate: '2026-10-31',
    title: 'FFXIV HALLOWEEN & COSTUME PHOTO CHALLENGE',
    type: 'FC Month'
  },
  {
    date: '2026-11-01',
    endDate: '2026-11-30',
    title: 'Color Me Contagious',
    type: 'FC Month'
  },
  {
    date: '2026-11-01',
    endDate: '2026-11-30',
    title: 'Official Morbol Art Competition',
    type: 'FC Month'
  },
  {
    date: '2026-09-09',
    endDate: '2026-10-19',
    title: 'Moogle Treasure Trove: The First Hunt for Astronomy',
    type: 'FF14',
    detail: 'Official seasonal event, first of a two-part special tied to the Evercold expansion. Earn irregular tomestones from duties and complete minimog/ultimog challenges for a shot at the Uolon horn mount. Runs 9 Sep, 8:00 GMT – 19 Oct, 14:59 GMT.'
  },
  {
    date: '2026-09-24',
    endDate: '2026-10-13',
    title: 'A Nocturne for Heroes: FFXIV x FFXV',
    type: 'FF14',
    detail: 'Official crossover event with Final Fantasy XV returns. Requires level 50 and the MSQ "The Ultimate Weapon" (A Realm Reborn) completed — start "The Man in Black" from Kipih Jakkya in Ul’dah, Old Steps of Nald. Rewards include the 4-seat Regalia Type-G mount (200,000 MGP), the Lucian Prince (Noctis) attire from the quests, the Modern Aesthetics – Lucian Locks hairstyle (20,000 MGP), a Noctis Triple Triad card (10,000 MGP), and FFXV orchestrion rolls. Runs 24 Sep, 8:00 GMT – 13 Oct, 14:59 GMT.'
  },
  {
    date: '2026-10-07',
    endDate: '2026-10-27',
    title: 'FFXIV x Fall Guys Collaboration',
    type: 'FF14',
    detail: 'Official crossover event returns. Requires level 15 and one of the early MSQ quests "The Gridanian Envoy", "The Ul’dahn Envoy" or "The Lominsan Envoy" — start "Just Crowning Around" from Lewena at the Gold Saucer. Join Blunderville shows to earn Manderville Gold Saucer Fame (MGF) and exchange it for Fall Guys-themed outfits, Winner’s Crowns, furnishings and an orchestrion roll (MGF can only be earned during the event). Runs 7 Oct, 8:00 GMT – 27 Oct, 14:59 GMT.'
  },
  {
    date: '2026-10-15',
    endDate: '2026-11-02',
    title: 'All Saints’ Wake 2026',
    type: 'FF14',
    detail: 'Official seasonal Halloween event — "A Grisly Affair of Mortals and Bears". Requires level 15; speak with the Pumpkin-headed Apparition in Old Gridania (X:10.2, Y:9.4) to begin. Rewards include spooky armor and furnishings, and a peddler sells items from previous years’ events. Seasonal quests can’t be completed once the event ends. Runs 15 Oct, 8:00 GMT – 2 Nov, 14:59 GMT (dates may change).'
  },
  {
    date: '2026-10-28',
    endDate: '2027-02-23',
    title: 'Keybound Brawler: FFXIV x FFVII Remake',
    type: 'FF14',
    detail: 'Official Final Fantasy VII Remake collaboration at the Manderville Gold Saucer. Requires level 15 and one of the early MSQ quests "The Gridanian Envoy", "The Ul’dahn Envoy" or "The Lominsan Envoy", plus "It Could Happen to You" — then take "Keyward Bound" from Catlike Mammet at the Gold Saucer. A keyboard is required. Play Keybound Brawler to earn MGC and exchange it for Avalanche gear, a Wind-up Barret, orchestrion rolls and more (MGC can only be earned during the event). Runs from 28 Oct, 8:00 GMT until Patch 8.0 (Evercold) releases.'
  },
  {
    date: '2026-11-04',
    title: 'Evercold Pre-orders Open',
    type: 'FF14',
    detail: 'Pre-orders for FINAL FANTASY XIV: Evercold open on the official store.'
  },
  {
    date: '2026-11-10',
    title: 'Patch 7.58',
    type: 'FF14',
    detail: 'Patch 7.58 goes live after maintenance. Crystalline Conflict Season 21 ends and the final results are announced the same day.'
  },
  {
    date: '2027-02-19',
    endDate: '2027-02-23',
    title: 'FFXIV: Evercold Launch',
    type: 'FF14',
    detail: 'The Evercold expansion (Patch 8.0). Early access begins Friday 19 Feb 2027 at 9:00 GMT; full launch is Tuesday 23 Feb 2027.'
  },
  {
    date: '2026-09-18',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-09-19',
    time: '20:00 ST',
    title: 'Reels & Riches',
    type: 'Treasure Maps',
    detail: 'International Talk Like a Pirate Day — ocean fishing and treasure maps. Bring at least 2 treasure maps, and complete the Ocean Fishing unlock quest beforehand. All fishing levels welcome!'
  },
  {
    date: '2026-09-20',
    time: '20:00 ST',
    title: 'Sunday Movie Night — Kimi no Na wa',
    type: 'Movie'
  },
  {
    date: '2026-09-23',
    time: '20:00 ST',
    title: 'Sprout Night',
    type: 'Raid',
    detail: 'A run through the content from our earlier FC events — for sprouts and anyone who missed it the first time around.'
  },
  {
    date: '2026-09-25',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night',
    detail: 'Jackbox / free game night.'
  },
  {
    date: '2026-09-27',
    time: '19:00 ST',
    title: 'Unholy Banana & Serinah Starweaver’s Wedding',
    type: 'Event'
  },
  {
    date: '2026-09-27',
    time: '20:00 ST',
    title: 'Sunday Movie Night — Nimona',
    type: 'Movie',
    detail: 'This week’s pick: Nimona (2023) — a knight framed for a crime he didn’t commit teams up with a shape-shifting outcast to clear his name and take down the kingdom that betrayed them both.'
  },
  {
    date: '2026-09-26',
    time: '20:00 ST',
    title: 'The Binding Coil of Bahamut',
    type: 'Raid'
  },
  {
    date: '2026-09-30',
    time: '20:00 ST',
    title: 'Treasure Maps',
    type: 'Treasure Maps'
  },
  {
    date: '2026-10-02',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-10-03',
    time: '20:00 ST',
    title: 'From Mahjong to Minions: Gold Saucer Night',
    type: 'Event',
    detail: 'Join INIT for a relaxed evening of learning and playing together! Choose the games you’d like to explore: Triple Triad, Doman Mahjong, Lord of Verminion, or Chocobo Racing.'
  },
  {
    date: '2026-10-04',
    time: '20:00 ST',
    title: 'Sunday Movie Night — Weathering With You',
    type: 'Movie',
    detail: 'This week’s pick: Weathering With You (2019) — a runaway teen in Tokyo befriends a girl with the mysterious power to part the clouds, and the two turn her gift into a business as an unusually rainy summer pushes their world toward its breaking point.'
  },
  {
    date: '2026-10-16',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-10-17',
    time: '20:00 ST',
    title: 'Hide and Seek in Gridania',
    type: 'Social'
  },
  {
    date: '2026-10-18',
    time: '19:00 ST',
    title: 'Finia Dei & Lime Bell’s Wedding',
    type: 'Event'
  },
  {
    date: '2026-10-14',
    time: '20:00 ST',
    title: 'Treasure Maps',
    type: 'Treasure Maps'
  },
  {
    date: '2026-10-23',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-10-24',
    time: '20:00 ST',
    title: 'Alexander Raids',
    type: 'Raid'
  },
  {
    date: '2026-10-28',
    time: '20:00 ST',
    title: 'Treasure Maps',
    type: 'Treasure Maps'
  },
  {
    date: '2026-10-30',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-10-31',
    title: '???',
    type: 'Event'
  },
  {
    date: '2026-11-07',
    time: '20:00 ST',
    title: 'Morbol Parade + Kugane Speed-Run',
    type: 'Event',
    detail: 'A Morbol Parade followed by a Kugane speed-run.'
  },
  {
    date: '2026-11-11',
    time: '20:00 ST',
    title: 'Treasure Maps',
    type: 'Treasure Maps'
  },
  {
    date: '2026-11-14',
    title: 'Fate Farming + Hide and Seek',
    type: 'Event',
    detail: 'Fate Farming starts earlier than usual — check Discord for the exact start time — followed by Hide and Seek.'
  },
  {
    date: '2026-11-21',
    time: '20:00 ST',
    title: 'Aurum Vale Speed-Run',
    type: 'Raid'
  },
  {
    date: '2026-11-25',
    time: '20:00 ST',
    title: 'Treasure Maps',
    type: 'Treasure Maps'
  },
  {
    date: '2026-11-28',
    time: '20:00 ST',
    title: 'M.O.R.B.O.L Pic Hunt + Glam Contest',
    type: 'Event',
    detail: 'A picture hunt across the three main cities, followed by a Glam Contest.'
  },
  {
    date: '2026-11-04',
    time: '20:00 ST',
    title: 'Sprout Night',
    type: 'Raid',
    detail: 'A run through the content from our earlier FC events — for sprouts and anyone who missed it the first time around.'
  },
  {
    date: '2026-11-06',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-11-13',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-11-20',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-11-27',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-12-04',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-12-11',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-12-18',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-12-25',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-12-02',
    time: '20:00 ST',
    title: 'Sprout Night',
    type: 'Raid',
    detail: 'A run through the content from our earlier FC events — for sprouts and anyone who missed it the first time around.'
  },
  {
    date: '2026-12-09',
    time: '20:00 ST',
    title: 'Treasure Maps',
    type: 'Treasure Maps'
  },
  {
    date: '2026-12-23',
    time: '20:00 ST',
    title: 'Treasure Maps',
    type: 'Treasure Maps'
  },
  {
    date: '2026-12-05',
    title: '???',
    type: 'Event',
    adventDay: 5
  },
  {
    date: '2026-12-06',
    title: '???',
    type: 'Event',
    adventDay: 6
  },
  {
    date: '2026-12-12',
    title: '???',
    type: 'Event',
    adventDay: 12
  },
  {
    date: '2026-12-13',
    title: '???',
    type: 'Event',
    adventDay: 13
  },
  {
    date: '2026-12-19',
    title: '???',
    type: 'Event',
    adventDay: 19
  },
  {
    date: '2026-12-20',
    title: '???',
    type: 'Event',
    adventDay: 20
  },
  {
    date: '2026-12-24',
    title: '???',
    type: 'Event',
    adventDay: 24
  }
];

/* --- What we do (home page cards) --------------------------------------- */
const ACTIVITIES = [
  {
    icon: 'sword',
    title: 'Raid Nights',
    text: 'Old-tier trials and raids like the Binding Coil of Bahamut, plus Sprout Night reruns of anything you missed. No fixed static required.'
  },
  {
    icon: 'users',
    title: 'Social & Casual',
    text: 'Game nights like Friendslop Friday, Gold Saucer nights such as Reels & Riches, and a Sunday Movie Night most weeks.'
  },
  {
    icon: 'sprout',
    title: 'New Players',
    text: 'Sprout Night runs you through the content from our earlier events — perfect if you are new or just missed it the first time.'
  },
  {
    icon: 'house',
    title: 'FC Perks',
    text: 'A stocked FC chest, active buffs, a workshop, and a monthly FC Room Competition and FC Bingo to keep things interesting.'
  }
];

/* --- Sprout Night content log --------------------------------------------
   Shown on the Events page under the calendar — a running list of what
   we've already covered on Sprout Night, grouped by category. Add a new
   item to a category's list, or a whole new category, as we go.
-------------------------------------------------------------------------- */
const SPROUT_NIGHT_CONTENT = [
  {
    category: 'Extremes',
    items: ['A Realm Reborn', 'Heavensward', 'Stormblood']
  },
  {
    category: 'Deep Dungeons',
    items: ['Palace of the Dead']
  },
  {
    category: 'Raids',
    items: ['The Binding Coil of Bahamut']
  }
];

/* --- Advent calendar (advent.html) ---------------------------------------
   One door per day. Edit the titles and text here — the page builds itself.
     day     the day of the month (1–24)
     kind    'daily'  = a daily surprise (gift icon)
             'event'  = a live FC event (star icon)
             'finale' = the Christmas finale (crown icon)
     emoji   shown next to the title once the door is opened
     extras  (optional) more things on the same day — a list of { emoji, title, text }
   lockByDate  true = each door only opens on its own date (add ?preview to the
               page address to open them all early); false = every door opens
               on click, any time.
-------------------------------------------------------------------------- */
const ADVENT = {
  year: 2026,
  month: 12,
  lockByDate: true,    // true = doors unlock on their own date; false = every door opens on click
  days: [
    { day: 1,  kind: 'daily',  emoji: '🎄', title: 'Starlight Welcome',        text: 'Holiday greeting and festive FC announcement.' },
    { day: 2,  kind: 'event',  emoji: '🌱', title: 'Sprout Night',             text: 'A run through the content from our earlier FC events — for sprouts and anyone who missed it the first time around.' },
    { day: 3,  kind: 'daily',  emoji: '🎁', title: 'Mystery Gift',             text: 'Chance to win a random minion, dye, or small prize.' },
    { day: 4,  kind: 'daily',  emoji: '📸', title: 'Screenshot Hunt',          text: 'Guess an Eorzean location from a screenshot.' },
    { day: 5,  kind: 'event',  emoji: '🏇', title: 'Festive Mount Parade',     text: 'Bring your favorite mount for a parade through Gridania — prizes for the coolest and the silliest rides.' },
    { day: 6,  kind: 'event',  emoji: '🎅', title: 'Hide & Seek',              text: 'Find the hidden Santa somewhere in Eorzea.' },
    { day: 7,  kind: 'daily',  emoji: '💌', title: 'Moogle Message',           text: 'A cute message or compliment for an FC member.' },
    { day: 8,  kind: 'daily',  emoji: '🎲', title: 'Lucky Roll',               text: 'Roll for a chance to win a small prize.' },
    { day: 9,  kind: 'event',  emoji: '🗺️', title: 'Treasure Maps',            text: 'Group treasure maps, portals, and loot!',
      extras: [{ emoji: '🕵️', title: 'Guess the NPC', text: 'Identify an FFXIV character from three clues.' }] },
    { day: 10, kind: 'daily',  emoji: '🔮', title: 'Festive Fortune',          text: 'Receive a silly Eorzean holiday prediction.' },
    { day: 11, kind: 'daily',  emoji: '🐸', title: 'Glam Challenge',           text: 'Share your most cursed winter outfit.' },
    { day: 12, kind: 'event',  emoji: '👗', title: 'Starlight Glamour Contest', text: 'Live fashion show with prizes for the cutest, funniest, and most creative outfits.' },
    { day: 13, kind: 'event',  emoji: '🐥', title: 'Gold Saucer Games',        text: 'Chocobo racing, Triple Triad, and mini-game competitions.' },
    { day: 14, kind: 'daily',  emoji: '🐱', title: 'Minion Monday',            text: 'Show everyone your favorite minion.' },
    { day: 15, kind: 'daily',  emoji: '📖', title: 'Lore Quiz',                text: 'Answer a tricky Eorzean lore question.' },
    { day: 16, kind: 'daily',  emoji: '🎁', title: 'Secret Santa',             text: 'Sign up and receive your gift exchange assignment.' },
    { day: 17, kind: 'daily',  emoji: '🔎', title: 'Where Am I?',              text: 'Guess a mystery location in FFXIV.' },
    { day: 18, kind: 'daily',  emoji: '📷', title: 'FC Memories',              text: 'Share your favorite FC screenshot or memory from this year.' },
    { day: 19, kind: 'event',  emoji: '🧩', title: 'Starlight Scavenger Hunt', text: 'Solve riddles and explore Eorzea together to find hidden prizes.' },
    { day: 20, kind: 'event',  emoji: '⚔️', title: 'Chaotic Duty Night',       text: 'Run group duties with silly challenges and fun restrictions.' },
    { day: 21, kind: 'daily',  emoji: '❤️', title: 'Kindness Day',             text: 'Do something nice for another adventurer.' },
    { day: 22, kind: 'daily',  emoji: '🎯', title: 'Holiday Bingo',            text: 'Complete some easy FFXIV-themed bingo tasks.' },
    { day: 23, kind: 'event',  emoji: '🗺️', title: 'Treasure Maps',            text: 'Group treasure maps, portals, and loot! Everyone who joins also gets a raffle ticket and a teaser for the grand finale.' },
    { day: 24, kind: 'finale', emoji: '🎄', title: 'Grand Starlight Finale',   text: 'Secret Santa gift exchange, FC group photo, and grand Christmas raffle!' }
  ]
};

/* --- Seasonal theme for the Events page ---------------------------------
   Between `from` and `to` (inclusive, YYYY-MM-DD) events.html wears the
   "Morbol Month" look. Outside those dates it goes back to normal by itself.
   Try it any time by adding ?theme=morbol to any page URL (not the Advent page)
-------------------------------------------------------------------------- */
const EVENTS_THEME = {
  name: 'morbol',
  from: '2026-11-01',
  to:   '2026-11-30',
  label: 'Morbol Month',
  kicker: 'Heads up: the whole FC is Morbol-ized this month. Expect vines, spores and a faint, lingering smell.',
  calendarTitle: 'The Morbol calendar'
};
