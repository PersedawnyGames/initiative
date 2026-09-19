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

/* --- Roster --------------------------------------------------------------
   One row per character. Anyone on the Lodestone member list holding one of
   the RANKS above appears on the roster page automatically.

   Edit these yourself:
     discord   their Discord name
     role      their role in the community

   Refreshed from the Lodestone (matched by id) — the values here are only a
   saved copy, shown if the Lodestone can't be reached:
     name · rank · id · portrait
-------------------------------------------------------------------------- */
const MEMBERS = [
  { name: 'Cipher Imperius',   discord: 'Cipher',           role: 'Community Leadership',  rank: 'The Emperor', id: '61287057', portrait: 'https://img2.finalfantasyxiv.com/f/8385d4f331e00b9a92abd1dc2322de6d_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789544578' },
  { name: 'Dino Dan',          discord: 'Nemo Rosa',        role: 'Member Management',     rank: 'Regent',      id: '61277910', portrait: 'https://img2.finalfantasyxiv.com/f/e931fbe7c5b039f2a3017dcab855f1eb_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789545688' },
  { name: 'Kidagakash Nedakh', discord: 'Kida (Alba)',      role: 'Member Support',        rank: 'Regent',      id: '61302595', portrait: 'https://img2.finalfantasyxiv.com/f/4d1a1d6d3046ff53ad533b185b39a5a2_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789545546' },
  { name: 'Nemo Rosa',         discord: 'Nemo Rosa',        role: 'Member Management',     rank: 'Regent',      id: '3078113',  portrait: 'https://img2.finalfantasyxiv.com/f/8c09e967f667289e22af8a7804d36e9e_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789545883' },
  { name: 'Opal Noxfleuret',   discord: 'Opal Noxfleuret',  role: 'Estate Management',     rank: 'Regent',      id: '38510729', portrait: 'https://img2.finalfantasyxiv.com/f/0adce7b73914ddc306318aac1eeea802_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789546719' },
  { name: 'Dawn Undomiel',     discord: 'Dawn Undomiel',    role: 'Events Manager',        rank: 'Council',     id: '61417925', portrait: 'https://img2.finalfantasyxiv.com/f/62a93a3aafe9b6af1b2572395ae096ec_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789546626' },
  { name: 'Pale King',         discord: 'Pale King',        role: 'High-End Content Lead', rank: 'Council',     id: '61342637', portrait: 'https://img2.finalfantasyxiv.com/f/a0de494ee474fe0ebb025b3b81dfc74d_6132295fcf5570fb8b0a944ef322a598fl0.jpg?1789547107' },
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
    date: '2026-09-09',
    endDate: '2026-10-19',
    title: 'Moogle Treasure Trove: The First Hunt for Astronomy',
    type: 'FF14',
    detail: 'Official seasonal event, first of a two-part special tied to the Evercold expansion. Earn irregular tomestones from duties and complete minimog/ultimog challenges for a shot at the Uolon horn mount. Runs 9 Sep, 8:00 GMT – 19 Oct, 14:59 GMT.'
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
    title: 'Sunday Movie Night — TBA',
    type: 'Movie',
    detail: 'Film to be announced closer to the date — check Discord for the pick.'
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
    date: '2026-10-04',
    time: '20:00 ST',
    title: 'Sunday Movie Night — TBA',
    type: 'Movie',
    detail: 'Film to be announced closer to the date — check Discord for the pick.'
  },
  {
    date: '2026-10-09',
    time: '20:00 ST',
    title: 'Friendslop Friday',
    type: 'Game Night'
  },
  {
    date: '2026-10-10',
    time: '20:00 ST',
    title: 'Alexander Raids',
    type: 'Raid'
  },
  {
    date: '2026-10-10',
    title: '???',
    type: 'Event'
  },
  {
    date: '2026-10-11',
    time: '20:00 ST',
    title: 'Sunday Movie Night — TBA',
    type: 'Movie',
    detail: 'Film to be announced closer to the date — check Discord for the pick.'
  },
  {
    date: '2026-10-14',
    time: '20:00 ST',
    title: 'Sprout Night',
    type: 'Raid',
    detail: 'A run through the content from our earlier FC events — for sprouts and anyone who missed it the first time around.'
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
    title: 'Sky Pirates',
    type: 'Raid'
  },
  {
    date: '2026-10-18',
    time: '20:00 ST',
    title: 'Sunday Movie Night — TBA',
    type: 'Movie',
    detail: 'Film to be announced closer to the date — check Discord for the pick.'
  },
  {
    date: '2026-10-21',
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
    title: '???',
    type: 'Event'
  },
  {
    date: '2026-10-25',
    time: '20:00 ST',
    title: 'Sunday Movie Night — TBA',
    type: 'Movie',
    detail: 'Film to be announced closer to the date — check Discord for the pick.'
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
