/* ==========================================================================
   Initiative — Sprout Night sign-ups (sprout.html)
   --------------------------------------------------------------------------
   Nights come from EVENTS in data.js: every event titled "Sprout Night"
   (today or later) gets a tab. Add an optional `content:` line to an event
   to say what we're running, e.g.  content: 'Shadowbringers Extremes'.

   Sign-ups live in Supabase (see supabase/setup.sql). Login is Discord.
   The database itself makes sure people can only change their own entry.
   ========================================================================== */

(function () {
  'use strict';

  var TZ = 'Europe/Paris';             // Server Time (ST) = Central European Time
  var CFG = window.SPROUT_CONFIG || {};

  var JOBS = [
    { abbr: 'PLD', name: 'Paladin',     role: 'tank' },
    { abbr: 'WAR', name: 'Warrior',     role: 'tank' },
    { abbr: 'DRK', name: 'Dark Knight', role: 'tank' },
    { abbr: 'GNB', name: 'Gunbreaker',  role: 'tank' },
    { abbr: 'WHM', name: 'White Mage',  role: 'healer' },
    { abbr: 'SCH', name: 'Scholar',     role: 'healer' },
    { abbr: 'AST', name: 'Astrologian', role: 'healer' },
    { abbr: 'SGE', name: 'Sage',        role: 'healer' },
    { abbr: 'MNK', name: 'Monk',        role: 'dps', group: 'Melee' },
    { abbr: 'DRG', name: 'Dragoon',     role: 'dps', group: 'Melee' },
    { abbr: 'NIN', name: 'Ninja',       role: 'dps', group: 'Melee' },
    { abbr: 'SAM', name: 'Samurai',     role: 'dps', group: 'Melee' },
    { abbr: 'RPR', name: 'Reaper',      role: 'dps', group: 'Melee' },
    { abbr: 'VPR', name: 'Viper',       role: 'dps', group: 'Melee' },
    { abbr: 'BRD', name: 'Bard',        role: 'dps', group: 'Ranged' },
    { abbr: 'MCH', name: 'Machinist',   role: 'dps', group: 'Ranged' },
    { abbr: 'DNC', name: 'Dancer',      role: 'dps', group: 'Ranged' },
    { abbr: 'BLM', name: 'Black Mage',  role: 'dps', group: 'Caster' },
    { abbr: 'SMN', name: 'Summoner',    role: 'dps', group: 'Caster' },
    { abbr: 'RDM', name: 'Red Mage',    role: 'dps', group: 'Caster' },
    { abbr: 'PCT', name: 'Pictomancer', role: 'dps', group: 'Caster' }
  ];
  var JOB_BY_ABBR = {};
  JOBS.forEach(function (j) { JOB_BY_ABBR[j.abbr] = j; });

  var ROLES = [
    { key: 'tank',   label: 'Tank',   plural: 'Tanks',   icon: '🛡️' },
    { key: 'healer', label: 'Healer', plural: 'Healers', icon: '💚' },
    { key: 'dps',    label: 'DPS',    plural: 'DPS',     icon: '⚔️' },
    { key: 'flex',   label: 'Flex',   plural: 'Flex',    icon: '🌱', hint: 'whatever the group needs' }
  ];
  var ROLE_BY_KEY = {};
  ROLES.forEach(function (r) { ROLE_BY_KEY[r.key] = r; });

  var STATUSES = [
    { key: 'going', label: "I'm in" },
    { key: 'maybe', label: 'Maybe' },
    { key: 'out',   label: "Can't make it" }
  ];
  var EXPERIENCE = [
    { key: 'new',     icon: '🌱', label: 'First time' },
    { key: 'some',    icon: '🌿', label: 'Done it before' },
    { key: 'veteran', icon: '🌳', label: 'Veteran, happy to explain' }
  ];
  var EXP_BY_KEY = {};
  EXPERIENCE.forEach(function (e) { EXP_BY_KEY[e.key] = e; });

  /* ---- Helpers --------------------------------------------------------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  function el(name) { return $('[data-sn="' + name + '"]'); }

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function partsIn(tz, date) {
    var o = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function todayST() {
    var o = partsIn(TZ, new Date());
    return o.year + '-' + o.month + '-' + o.day;
  }
  // Wall-clock time in ST → a real moment in time.
  function stToDate(ymd, hh, mm) {
    var b = ymd.split('-').map(Number);
    var guess = Date.UTC(b[0], b[1] - 1, b[2], hh, mm);
    function offset(ts) {
      var o = partsIn(TZ, new Date(ts));
      return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute) - ts;
    }
    var t = guess - offset(guess);
    return new Date(guess - offset(t));
  }

  function nightLabel(ymd, opts) {
    var b = ymd.split('-').map(Number);
    return new Date(Date.UTC(b[0], b[1] - 1, b[2], 12)).toLocaleDateString('en-GB', Object.assign({ timeZone: 'UTC' }, opts));
  }

  function toast(msg, isError) {
    var t = el('toast');
    t.textContent = msg;
    t.classList.toggle('is-error', !!isError);
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, isError ? 7000 : 3200);
  }

  function notice(html) {
    var n = el('notice');
    n.innerHTML = html || '';
    n.hidden = !html;
  }

  /* ---- State ----------------------------------------------------------- */
  var sb = null;
  var state = {
    nights: [],          // [{ date, time, start (Date|null), title, content, detail }]
    selected: null,      // 'YYYY-MM-DD'
    user: null,          // Supabase user
    isHost: false,
    rows: [],            // sign-ups for upcoming nights
    lastProfile: null,   // my most recent sign-up (for pre-filling)
    loaded: false,
    loadError: false
  };

  function mine(night) {
    if (!state.user) return null;
    for (var i = 0; i < state.rows.length; i++) {
      var r = state.rows[i];
      if (r.night === night && r.user_id === state.user.id) return r;
    }
    return null;
  }

  /* ---- Nights from data.js -------------------------------------------- */
  function collectNights() {
    if (typeof EVENTS === 'undefined') return [];
    var today = todayST();
    return EVENTS
      .filter(function (e) { return e && /sprout night/i.test(e.title || '') && e.date >= today; })
      .map(function (e) {
        var m = /(\d{1,2}):(\d{2})/.exec(e.time || '');
        var sets = [].concat(e.mounts || []).map(function (key) {
          var set = typeof SPROUT_MOUNTS !== 'undefined' && SPROUT_MOUNTS[key];
          if (!set) { console.warn('[sprout] unknown mount set "' + key + '" on ' + e.date); return null; }
          return set;
        }).filter(Boolean);
        var mountNames = [];
        sets.forEach(function (s) { s.mounts.forEach(function (mt) { if (mountNames.indexOf(mt.name) === -1) mountNames.push(mt.name); }); });
        return {
          date: e.date,
          time: e.time || '',
          start: m ? stToDate(e.date, +m[1], +m[2]) : null,
          title: e.title,
          content: e.content || '',
          detail: e.detail || '',
          mountSets: sets,
          mountNames: mountNames
        };
      })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }

  function pickSelected() {
    var want = new URLSearchParams(location.search).get('night');
    var dates = state.nights.map(function (n) { return n.date; });
    state.selected = dates.indexOf(want) !== -1 ? want : (dates[0] || null);
  }

  function selectNight(date) {
    state.selected = date;
    var url = new URL(location.href);
    url.searchParams.set('night', date);
    history.replaceState(null, '', url);
    renderTabs();
    renderNight();
    renderMine();
  }

  /* ---- Rendering: login bar ------------------------------------------- */
  var DISCORD_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" class="sn-discord"><path fill="currentColor" d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.85a13.7 13.7 0 0 0-.63 1.29 18.4 18.4 0 0 0-5.5 0 12.6 12.6 0 0 0-.64-1.29 19.7 19.7 0 0 0-4.93 1.52C.6 9.07-.25 13.65.18 18.17a19.9 19.9 0 0 0 6.04 3.05c.49-.66.92-1.37 1.3-2.1a12.9 12.9 0 0 1-2.04-.98l.5-.39a14.2 14.2 0 0 0 12.06 0l.5.4c-.65.38-1.33.71-2.04.97.37.74.81 1.44 1.3 2.1a19.8 19.8 0 0 0 6.04-3.05c.5-5.24-.86-9.78-3.52-13.8ZM8.02 15.4c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.34-.95 2.42-2.16 2.42Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.34-.95 2.42-2.16 2.42Z"/></svg>';

  function userName(u) {
    var m = (u && u.user_metadata) || {};
    return (m.custom_claims && m.custom_claims.global_name) || m.full_name || m.name || 'you';
  }

  function renderAuth() {
    var host = el('auth');
    if (!sb) { host.innerHTML = ''; return; }
    if (!state.user) {
      host.innerHTML =
        '<p class="sn-auth__text">Log in with Discord to sign up. No new account needed.</p>' +
        '<button type="button" class="btn btn--solid sn-auth__login" data-action="login">' + DISCORD_ICON + 'Log in with Discord</button>';
      return;
    }
    var m = state.user.user_metadata || {};
    host.innerHTML =
      '<p class="sn-auth__text">' +
        (m.avatar_url ? '<img class="sn-avatar" src="' + esc(m.avatar_url) + '" alt="" width="28" height="28">' : '') +
        'Logged in as <strong>' + esc(userName(state.user)) + '</strong>' +
        (state.isHost ? ' <span class="tag sn-tag-host">Host</span>' : '') +
      '</p>' +
      '<button type="button" class="btn btn--ghost sn-auth__logout" data-action="logout">Log out</button>';
  }

  /* ---- Rendering: night tabs ------------------------------------------ */
  function countFor(date) {
    return state.rows.filter(function (r) { return r.night === date && r.status === 'going'; }).length;
  }

  function renderTabs() {
    var host = el('tabs');
    if (state.nights.length < 2) { host.innerHTML = ''; host.hidden = true; return; }
    host.hidden = false;
    var today = todayST();
    host.innerHTML = state.nights.map(function (n) {
      var on = n.date === state.selected;
      var me = mine(n.date);
      return '<button type="button" role="tab" class="sn-tab' + (on ? ' is-active' : '') + '" aria-selected="' + on + '" data-night="' + esc(n.date) + '">' +
               '<span class="sn-tab__date">' + (n.date === today ? 'Tonight' : esc(nightLabel(n.date, { weekday: 'short', day: 'numeric', month: 'short' }))) + '</span>' +
               '<span class="sn-tab__meta">' + (state.loaded ? countFor(n.date) + ' joining' : '&nbsp;') + (me ? ' · <span class="sn-tab__me">' + (me.status === 'out' ? "you can't" : "you're " + (me.status === 'going' ? 'in' : 'maybe')) + '</span>' : '') + '</span>' +
             '</button>';
    }).join('');
  }

  /* ---- Rendering: the selected night + roster ------------------------- */
  function jobPills(jobs) {
    return (jobs || []).map(function (a) {
      var j = JOB_BY_ABBR[a];
      if (!j) return '';
      return '<span class="sn-job sn-job--' + j.role + '" title="' + esc(j.name) + '">' + esc(j.abbr) + '</span>';
    }).join('');
  }

  /* ---- Content people can vote for (nights without a set plan) ---------
     Built from SPROUT_NIGHT_CONTENT ("Content we've run before"). Each
     entry gets the mount set from SPROUT_MOUNTS whose `content` matches. */
  var CONTENT = [];
  var CONTENT_BY_KEY = {};
  function buildContent() {
    if (typeof SPROUT_NIGHT_CONTENT === 'undefined') return;
    var sets = typeof SPROUT_MOUNTS !== 'undefined' ? SPROUT_MOUNTS : {};
    SPROUT_NIGHT_CONTENT.forEach(function (group) {
      (group.items || []).forEach(function (item) {
        var key = group.category + ': ' + item;
        var set = null;
        Object.keys(sets).forEach(function (k) {
          var c = sets[k].content;
          if (c && c[0] === group.category && c[1] === item) set = sets[k];
        });
        var entry = {
          key: key,
          category: group.category,
          item: item,
          label: group.category === 'Extremes' ? item + ' Extremes' : item,
          set: set
        };
        CONTENT.push(entry);
        CONTENT_BY_KEY[key] = entry;
      });
    });
  }

  function isOpenNight(night) { return night && !night.mountSets.length; }

  // Which mount names count for this sign-up on this night.
  function allowedMounts(night, wanted) {
    if (!night) return [];
    if (!isOpenNight(night)) return night.mountNames;
    var names = [];
    (wanted || []).forEach(function (k) {
      var c = CONTENT_BY_KEY[k];
      if (c && c.set) c.set.mounts.forEach(function (mt) { names.push(mt.name); });
    });
    return names;
  }

  function mountPills(r, night) {
    var ok = allowedMounts(night, r.wanted);
    var need = (r.mounts || []).filter(function (n) { return ok.indexOf(n) !== -1; });
    var wants = isOpenNight(night) ? (r.wanted || []).filter(function (k) { return CONTENT_BY_KEY[k]; }) : [];
    var html = '';
    if (wants.length) {
      html += '<div class="sn-row__mounts"><span class="sn-row__mounts-label">Wants</span>' +
        wants.map(function (k) { return '<span class="sn-want">' + esc(CONTENT_BY_KEY[k].label) + '</span>'; }).join('') + '</div>';
    }
    if (need.length) {
      html += '<div class="sn-row__mounts"><span class="sn-row__mounts-label">Needs</span>' +
        need.map(function (n) { return '<span class="sn-mount">' + esc(n) + '</span>'; }).join('') + '</div>';
    }
    return html;
  }

  // Nights without a set plan: what do people want to run, and what do they need from it?
  function renderWishTally(night, rows) {
    if (!isOpenNight(night) || !CONTENT.length) return '';
    var active = rows.filter(function (r) { return r.status !== 'out'; });
    var votes = CONTENT.map(function (c) {
      var voters = active.filter(function (r) { return (r.wanted || []).indexOf(c.key) !== -1; });
      var tally = {};
      if (c.set) {
        voters.forEach(function (r) {
          (r.mounts || []).forEach(function (n) {
            if (c.set.mounts.some(function (mt) { return mt.name === n; })) (tally[n] = tally[n] || []).push(r.character);
          });
        });
      }
      return { c: c, voters: voters, tally: tally };
    }).filter(function (v) { return v.voters.length; })
      .sort(function (a, b) { return b.voters.length - a.voters.length; });

    var body = votes.length ? '<ol class="sn-wishes">' + votes.map(function (v) {
      var mounts = v.c.set ? v.c.set.mounts.filter(function (mt) { return v.tally[mt.name]; })
        .sort(function (a, b) { return v.tally[b.name].length - v.tally[a.name].length; }) : [];
      return '<li class="sn-wish">' +
        '<div class="sn-wish__head">' +
          '<span class="sn-wish__name">' + esc(v.c.label) + '</span>' +
          '<span class="sn-wish__votes" title="' + esc(v.voters.map(function (r) { return r.character; }).join(', ')) + '">' + v.voters.length + (v.voters.length === 1 ? ' wants it' : ' want it') + '</span>' +
        '</div>' +
        (mounts.length ? '<ul class="sn-mounts__list">' + mounts.map(function (mt) {
          var who = v.tally[mt.name];
          return '<li class="sn-mounts__item is-wanted" title="' + esc(mt.from) + '\nNeeded by: ' + esc(who.join(', ')) + '">' +
            '<span class="sn-mounts__name">' + esc(mt.name) + '</span><span class="sn-mounts__n">×' + who.length + '</span></li>';
        }).join('') + '</ul>' : (v.c.set ? '' : '<p class="sn-wish__nomounts">No mounts drop here</p>')) +
      '</li>';
    }).join('') + '</ol>'
      : '<p class="sn-muted sn-mounts__none">' + (active.length ? 'Nobody has picked any content yet.' : 'Sign up and pick what you\'d like to run.') + '</p>';

    return '<section class="sn-mounts">' +
      '<h3 class="sn-group__title">🗳️ What people want to run</h3>' + body +
    '</section>';
  }

  function renderMountTally(night, rows) {
    if (!night.mountSets.length) return '';
    var active = rows.filter(function (r) { return r.status !== 'out'; });
    var tally = {};
    active.forEach(function (r) {
      (r.mounts || []).forEach(function (n) {
        if (night.mountNames.indexOf(n) === -1) return;
        (tally[n] = tally[n] || []).push(r.character);
      });
    });
    var anyone = Object.keys(tally).length > 0;

    return '<section class="sn-mounts">' +
      '<h3 class="sn-group__title">🐎 Mounts people still need</h3>' +
      night.mountSets.map(function (set) {
        var items = set.mounts.slice().sort(function (a, b) {
          return (tally[b.name] || []).length - (tally[a.name] || []).length;
        });
        return '<div class="sn-mounts__set">' +
          (night.mountSets.length > 1 ? '<span class="sn-mounts__label">' + esc(set.label) + '</span>' : '') +
          '<ul class="sn-mounts__list">' + items.map(function (mt) {
            var who = tally[mt.name] || [];
            return '<li class="sn-mounts__item' + (who.length ? ' is-wanted' : '') + '" title="' + esc(mt.from) + (who.length ? '\nNeeded by: ' + esc(who.join(', ')) : '') + '">' +
              '<span class="sn-mounts__name">' + esc(mt.name) + '</span>' +
              '<span class="sn-mounts__n">' + (who.length ? '×' + who.length : '–') + '</span>' +
            '</li>';
          }).join('') + '</ul>' +
          (set.reward ? '<p class="sn-mounts__reward">✨ Collect them all for the <strong>' + esc(set.reward.name) + '</strong>: ' + esc(set.reward.how.replace(/^Quest /, 'quest ')) + '</p>' : '') +
        '</div>';
      }).join('') +
      (!anyone && active.length ? '<p class="sn-muted sn-mounts__none">Nobody has asked for a mount yet.</p>' : '') +
    '</section>';
  }

  function rosterRow(r) {
    var isMe = state.user && r.user_id === state.user.id;
    var exp = EXP_BY_KEY[r.experience];
    var canRemove = state.isHost && !isMe;
    var night = state.nights.find(function (x) { return x.date === r.night; });
    return '<li class="sn-row' + (isMe ? ' is-me' : '') + '">' +
      '<div class="sn-row__main">' +
        '<span class="sn-row__name">' + esc(r.character) + '</span>' +
        (isMe ? '<span class="tag sn-tag-me">You</span>' : '') +
        (exp ? '<span class="sn-row__exp" title="' + esc(exp.label) + '">' + exp.icon + '<span class="sn-row__exp-text">' + esc(exp.label) + '</span></span>' : '') +
      '</div>' +
      '<div class="sn-row__jobs">' + jobPills(r.jobs) + '</div>' +
      mountPills(r, night) +
      (r.notes ? '<p class="sn-row__notes">' + esc(r.notes) + '</p>' : '') +
      '<div class="sn-row__who">' +
        (r.discord_avatar ? '<img class="sn-avatar sn-avatar--sm" src="' + esc(r.discord_avatar) + '" alt="" width="18" height="18" loading="lazy">' : '') +
        '<span>' + esc(r.discord_name || '') + '</span>' +
        (canRemove ? '<button type="button" class="sn-row__remove" data-action="host-remove" data-id="' + esc(r.id) + '" data-name="' + esc(r.character) + '">Remove</button>' : '') +
      '</div>' +
    '</li>';
  }

  function renderNight() {
    var host = el('night');
    var n = state.nights.find(function (x) { return x.date === state.selected; });
    if (!n) {
      host.innerHTML = '<div class="empty-state">No Sprout Nights are on the calendar right now. Keep an eye on the <a href="events.html">events page</a> or the Discord.</div>';
      return;
    }

    var today = todayST();
    var when = esc(nightLabel(n.date, { weekday: 'long', day: 'numeric', month: 'long' }));
    var timeLine = '';
    if (n.start) {
      var st = esc(n.time.replace(/\s*ST\s*$/i, '')) + ' ST';
      var local = n.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var stSame = partsIn(localTz, n.start).hour === partsIn(TZ, n.start).hour;
      timeLine = st + (stSame ? '' : ' <span class="sn-night__local">· ' + esc(local) + ' your time</span>');
    } else if (n.time) {
      timeLine = esc(n.time);
    }

    var rows = state.rows.filter(function (r) { return r.night === n.date; });
    var going = rows.filter(function (r) { return r.status === 'going'; });
    var maybe = rows.filter(function (r) { return r.status === 'maybe'; });
    var out = rows.filter(function (r) { return r.status === 'out'; });
    var sprouts = going.filter(function (r) { return r.experience === 'new'; }).length;

    var head =
      '<header class="sn-night__head">' +
        (n.date === today ? '<span class="sn-night__badge">Tonight</span>' : '') +
        '<h2 class="sn-night__title">' + when + '</h2>' +
        (timeLine ? '<p class="sn-night__time">' + timeLine + '</p>' : '') +
        (n.content ? '<p class="sn-night__content"><span class="eyebrow">Running</span>' + esc(n.content) + '</p>' : '') +
        (!n.content && n.detail ? '<p class="sn-night__detail">' + esc(n.detail) + '</p>' : '') +
      '</header>';

    var counts =
      '<div class="sn-counts" aria-label="Who is joining, by role">' +
        ROLES.map(function (role) {
          var c = going.filter(function (r) { return r.pref_role === role.key; }).length;
          return '<div class="sn-count sn-count--' + role.key + '"><span class="sn-count__n">' + c + '</span><span class="sn-count__label">' + role.icon + ' ' + esc(c === 1 ? role.label : role.plural) + '</span></div>';
        }).join('') +
        '<div class="sn-count sn-count--sprout"><span class="sn-count__n">' + sprouts + '</span><span class="sn-count__label">🌱 First-timers</span></div>' +
      '</div>';

    var body;
    if (!sb) {
      body = '';
    } else if (!state.loaded) {
      body = '<p class="sn-muted">' + (state.loadError ? "Couldn't load the sign-ups right now. Try refreshing in a moment." : 'Loading sign-ups…') + '</p>';
    } else if (!rows.length) {
      body = '<div class="empty-state sn-empty">Nobody has signed up yet. Be the first! 🌱</div>';
    } else {
      body = ROLES.map(function (role) {
        var list = going.filter(function (r) { return r.pref_role === role.key; });
        if (!list.length) return '';
        return '<section class="sn-group"><h3 class="sn-group__title sn-group__title--' + role.key + '">' + role.icon + ' ' + esc(role.plural) + ' <span>' + list.length + '</span></h3>' +
               '<ul class="sn-list">' + list.map(rosterRow).join('') + '</ul></section>';
      }).join('');
      if (maybe.length) {
        body += '<section class="sn-group sn-group--maybe"><h3 class="sn-group__title">🤔 Maybe <span>' + maybe.length + '</span></h3>' +
                '<ul class="sn-list">' + maybe.map(rosterRow).join('') + '</ul></section>';
      }
      if (out.length) {
        body += '<p class="sn-out"><strong>Can\'t make it:</strong> ' + out.map(function (r) { return esc(r.character); }).join(', ') + '</p>';
      }
    }

    var mounts = sb && state.loaded ? (isOpenNight(n) ? renderWishTally(n, rows) : renderMountTally(n, rows)) : '';
    host.innerHTML = head + (sb ? counts : '') + mounts + '<div class="sn-roster">' + body + '</div>';
  }

  /* ---- Rendering: my sign-up form ------------------------------------- */
  // Only re-rendered on night/login changes and after saving, never on live
  // roster updates — so it never wipes what someone is typing.
  function renderMine() {
    var host = el('mine');
    if (!sb || !state.selected) { host.innerHTML = ''; host.hidden = true; return; }
    host.hidden = false;

    if (!state.user) {
      host.innerHTML =
        '<div class="sn-card sn-card--cta">' +
          '<h3>Join this Sprout Night</h3>' +
          '<p>Log in with Discord, pick your role and jobs, and you\'re on the list. You can come back and change it whenever you like. Only you can edit your sign-up.</p>' +
          '<button type="button" class="btn btn--solid sn-auth__login" data-action="login">' + DISCORD_ICON + 'Log in with Discord</button>' +
        '</div>';
      return;
    }

    var row = mine(state.selected);
    var base = row || state.lastProfile || {};
    var v = {
      character: base.character || '',
      status: row ? row.status : 'going',
      pref_role: base.pref_role || '',
      jobs: base.jobs || [],
      experience: row ? row.experience : '',
      notes: row ? (row.notes || '') : '',
      mounts: row ? (row.mounts || []) : [],
      wanted: row ? (row.wanted || []) : []
    };
    var night = state.nights.find(function (x) { return x.date === state.selected; });

    function mountChip(mt, checked) {
      var id = 'sn-mount-' + mt.name.replace(/[^a-z0-9]+/gi, '-');
      return '<input type="checkbox" name="mounts" id="' + id + '" value="' + esc(mt.name) + '"' + (checked ? ' checked' : '') + '>' +
             '<label for="' + id + '" class="sn-mountchip" title="' + esc(mt.from) + '">' + esc(mt.name) + '</label>';
    }

    var mountField = '';
    if (isOpenNight(night) && CONTENT.length) {
      // No set plan: pick content to vote for, then the mounts you need from it.
      var cats = [];
      CONTENT.forEach(function (c) { if (cats.indexOf(c.category) === -1) cats.push(c.category); });
      mountField =
        '<div class="sn-field"><span class="sn-label">What would you like to run? <small>(pick any)</small></span>' +
          '<div class="sn-jobs">' + cats.map(function (cat) {
            return '<div class="sn-jobs__group sn-jobs__group--wide"><span class="sn-jobs__title">' + esc(cat) + '</span><div class="sn-mountpick__list">' +
              CONTENT.filter(function (c) { return c.category === cat; }).map(function (c) {
                var id = 'sn-want-' + c.key.replace(/[^a-z0-9]+/gi, '-');
                return '<input type="checkbox" name="wanted" id="' + id + '" value="' + esc(c.key) + '"' + (v.wanted.indexOf(c.key) !== -1 ? ' checked' : '') + '>' +
                       '<label for="' + id + '" class="sn-wantchip">' + esc(c.item) + '</label>';
              }).join('') + '</div></div>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="sn-field" data-sn="wish-mounts"><span class="sn-label">Mounts you still need <small>(from what you picked)</small></span>' +
          '<div class="sn-mountpick">' + CONTENT.map(function (c) {
            var on = v.wanted.indexOf(c.key) !== -1;
            return '<div class="sn-mountpick__set" data-for="' + esc(c.key) + '"' + (on ? '' : ' hidden') + '>' +
              '<span class="sn-jobs__title">' + esc(c.set ? c.set.label : c.label) + (c.set && c.set.note ? ' · ' + esc(c.set.note) : '') + '</span>' +
              (c.set
                ? '<div class="sn-mountpick__list">' + c.set.mounts.map(function (mt) { return mountChip(mt, v.mounts.indexOf(mt.name) !== -1); }).join('') + '</div>'
                : '<p class="sn-hint">No mounts drop here.</p>') +
            '</div>';
          }).join('') + '</div>' +
          '<p class="sn-hint" data-sn="wish-empty"' + (v.wanted.length ? ' hidden' : '') + '>Pick something above to see its mounts.</p>' +
          '<p class="sn-hint">On a computer, hover a mount to see where it drops.</p>' +
        '</div>';
    } else if (night && night.mountSets.length) {
      mountField =
        '<div class="sn-field"><span class="sn-label">Mounts you still need <small>(optional)</small></span>' +
          '<div class="sn-mountpick">' + night.mountSets.map(function (set, si) {
            return '<div class="sn-mountpick__set">' +
              (night.mountSets.length > 1 ? '<span class="sn-jobs__title">' + esc(set.label) + '</span>' : '') +
              '<div class="sn-mountpick__list">' + set.mounts.map(function (mt) {
                return mountChip(mt, v.mounts.indexOf(mt.name) !== -1);
              }).join('') + '</div></div>';
          }).join('') + '</div>' +
          '<p class="sn-hint">On a computer, hover a mount to see where it drops.</p>' +
        '</div>';
    }

    function seg(name, items, current) {
      return '<div class="sn-seg" role="radiogroup">' + items.map(function (it) {
        var id = 'sn-' + name + '-' + it.key;
        return '<input type="radio" name="' + name + '" id="' + id + '" value="' + it.key + '"' + (current === it.key ? ' checked' : '') + '>' +
               '<label for="' + id + '">' + (it.icon ? it.icon + ' ' : '') + esc(it.label) + '</label>';
      }).join('') + '</div>';
    }

    var jobGroups = [
      { title: '🛡️ Tanks', jobs: JOBS.filter(function (j) { return j.role === 'tank'; }) },
      { title: '💚 Healers', jobs: JOBS.filter(function (j) { return j.role === 'healer'; }) },
      { title: '⚔️ Melee', jobs: JOBS.filter(function (j) { return j.group === 'Melee'; }) },
      { title: '🏹 Ranged', jobs: JOBS.filter(function (j) { return j.group === 'Ranged'; }) },
      { title: '🔮 Casters', jobs: JOBS.filter(function (j) { return j.group === 'Caster'; }) }
    ];

    host.innerHTML =
      '<form class="sn-card sn-form" data-sn="form" novalidate>' +
        '<h3>' + (row ? 'Your sign-up' : 'Sign up for this night') + '</h3>' +
        (row ? '<p class="sn-form__saved">✓ You\'re on the list. Change anything below and save again.</p>' : '') +

        '<div class="sn-field"><span class="sn-label">Are you coming?</span>' + seg('status', STATUSES, v.status) + '</div>' +

        '<label class="sn-field"><span class="sn-label">Character name</span>' +
          '<input type="text" name="character" maxlength="40" autocomplete="off" placeholder="e.g. Sprouty Moogleton" value="' + esc(v.character) + '" required></label>' +

        '<div class="sn-field"><span class="sn-label">Preferred role</span>' + seg('pref_role', ROLES, v.pref_role) + '</div>' +

        '<div class="sn-field"><span class="sn-label">Jobs you can bring <small>(pick all that apply)</small></span>' +
          '<div class="sn-jobs">' + jobGroups.map(function (g) {
            return '<div class="sn-jobs__group"><span class="sn-jobs__title">' + g.title + '</span><div class="sn-jobs__list">' +
              g.jobs.map(function (j) {
                var id = 'sn-job-' + j.abbr;
                return '<input type="checkbox" name="jobs" id="' + id + '" value="' + j.abbr + '"' + (v.jobs.indexOf(j.abbr) !== -1 ? ' checked' : '') + '>' +
                       '<label for="' + id + '" class="sn-jobchip sn-jobchip--' + j.role + '" title="' + esc(j.name) + '">' + j.abbr + '</label>';
              }).join('') + '</div></div>';
          }).join('') + '</div></div>' +

        '<div class="sn-field"><span class="sn-label">Done this content before?</span>' + seg('experience', EXPERIENCE, v.experience) + '</div>' +

        mountField +

        '<label class="sn-field"><span class="sn-label">Anything we should know? <small>(optional)</small></span>' +
          '<textarea name="notes" rows="3" maxlength="300" placeholder="Arriving late, leaving early, want mechanics explained first…">' + esc(v.notes) + '</textarea></label>' +

        '<p class="sn-form__error" data-sn="form-error" role="alert" hidden></p>' +
        '<div class="sn-form__actions">' +
          '<button type="submit" class="btn btn--solid" data-sn="save">' + (row ? 'Save changes' : 'Sign me up') + '</button>' +
          (row ? '<button type="button" class="btn btn--ghost sn-form__remove" data-action="remove-mine">Remove my sign-up</button>' : '') +
        '</div>' +
      '</form>';
  }

  /* ---- Data ------------------------------------------------------------ */
  var BASE_COLUMNS = 'id,user_id,night,discord_name,discord_avatar,character,status,pref_role,jobs,experience,mounts,notes,created_at,updated_at';
  // `wanted` was added later. If the database hasn't been updated with the
  // newest setup.sql yet, carry on without it instead of breaking the page.
  var hasWanted = true;
  function columns() { return hasWanted ? BASE_COLUMNS + ',wanted' : BASE_COLUMNS; }
  function missingWanted(err) {
    return err && (err.code === '42703' || err.code === 'PGRST204') && /wanted/.test(err.message || '');
  }

  function loadRows() {
    if (!sb || !state.nights.length) { state.loaded = true; return Promise.resolve(); }
    return sb.from('sprout_signups')
      .select(columns())
      .gte('night', state.nights[0].date)
      .order('created_at', { ascending: true })
      .then(function (res) {
        if (res.error && hasWanted && missingWanted(res.error)) {
          console.warn('[sprout] database has no "wanted" column yet: run supabase/setup.sql again');
          hasWanted = false;
          return loadRows();
        }
        if (res.error) throw res.error;
        state.rows = res.data || [];
        state.loaded = true;
        state.loadError = false;
      })
      .catch(function (err) {
        console.error('[sprout] load failed', err);
        state.loadError = true;
      })
      .then(function () { renderTabs(); renderNight(); });
  }

  var reloadTimer = null;
  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(loadRows, 400);
  }

  function loadMyProfile() {
    if (!state.user) { state.lastProfile = null; return Promise.resolve(); }
    return sb.from('sprout_signups')
      .select('character,pref_role,jobs')
      .eq('user_id', state.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .then(function (res) { state.lastProfile = (res.data && res.data[0]) || null; });
  }

  function loadHost() {
    if (!state.user) { state.isHost = false; return Promise.resolve(); }
    return sb.rpc('is_sprout_host').then(function (res) { state.isHost = !res.error && res.data === true; });
  }

  /* ---- Actions --------------------------------------------------------- */
  function login() {
    var redirect = location.origin + location.pathname + (state.selected ? '?night=' + encodeURIComponent(state.selected) : '');
    sb.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: redirect } }).then(function (res) {
      if (res.error) toast("Couldn't start the Discord login: " + res.error.message, true);
    });
  }

  function logout() {
    sb.auth.signOut().then(function () { toast('Logged out.'); });
  }

  function formError(msg) {
    var e = el('form-error');
    if (!e) return;
    e.textContent = msg || '';
    e.hidden = !msg;
  }

  var saving = false;
  function save(form) {
    if (saving) return;
    var fd = new FormData(form);
    var night = state.nights.find(function (x) { return x.date === state.selected; });
    var wanted = isOpenNight(night) ? fd.getAll('wanted').filter(function (k) { return CONTENT_BY_KEY[k]; }) : [];
    var okMounts = allowedMounts(night, wanted);
    var payload = {
      mounts: fd.getAll('mounts').filter(function (n) { return okMounts.indexOf(n) !== -1; }),
      night: state.selected,
      character: String(fd.get('character') || '').trim().replace(/\s+/g, ' '),
      status: fd.get('status'),
      pref_role: fd.get('pref_role'),
      jobs: fd.getAll('jobs'),
      experience: fd.get('experience'),
      notes: String(fd.get('notes') || '').trim() || null
    };

    if (payload.character.length < 2) return formError('Please enter your character name.');
    if (!payload.status) return formError('Let us know if you\'re coming.');
    if (!payload.pref_role) return formError('Pick a preferred role (or Flex).');
    if (payload.status !== 'out' && !payload.jobs.length) return formError('Pick at least one job you can bring.');
    if (!payload.experience) return formError('Let us know if you\'ve done this content before.');
    formError('');

    if (hasWanted) payload.wanted = wanted;

    var row = mine(state.selected);
    var btn = el('save');
    saving = true;
    btn.disabled = true;
    btn.textContent = 'Saving…';

    var req = row
      ? sb.from('sprout_signups').update(payload).eq('id', row.id).select(columns()).single()
      : sb.from('sprout_signups').insert(payload).select(columns()).single();

    req.then(function (res) {
      if (res.error) throw res.error;
      var saved = res.data;
      state.rows = state.rows.filter(function (r) { return r.id !== saved.id; }).concat([saved]);
      state.lastProfile = saved;
      toast(row ? 'Changes saved ✓' : "You're signed up! 🌱");
      renderTabs(); renderNight(); renderMine();
    }).catch(function (err) {
      console.error('[sprout] save failed', err);
      var msg = err && err.code === '23505'
        ? 'You already have a sign-up for this night. Refresh the page to edit it.'
        : "Couldn't save your sign-up. Please try again.";
      formError(msg);
    }).then(function () {
      saving = false;
      var b = el('save');
      if (b && b.isConnected && b.disabled) { b.disabled = false; b.textContent = row ? 'Save changes' : 'Sign me up'; }
    });
  }

  function removeRow(id, confirmText, doneText) {
    if (!window.confirm(confirmText)) return;
    sb.from('sprout_signups').delete().eq('id', id).select('id').then(function (res) {
      if (res.error || !res.data || !res.data.length) {
        toast("Couldn't remove that sign-up.", true);
        return;
      }
      state.rows = state.rows.filter(function (r) { return String(r.id) !== String(id); });
      toast(doneText);
      renderTabs(); renderNight(); renderMine();
    });
  }

  /* ---- Wiring ---------------------------------------------------------- */
  function bindEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-action], [data-night]');
      if (!t || !t.closest('[data-sn="root"]')) return;
      if (t.dataset.night) return selectNight(t.dataset.night);
      switch (t.dataset.action) {
        case 'login': return login();
        case 'logout': return logout();
        case 'remove-mine': {
          var row = mine(state.selected);
          if (row) removeRow(row.id, 'Remove your sign-up for this night?', 'Your sign-up was removed.');
          return;
        }
        case 'host-remove':
          return removeRow(t.dataset.id, 'Remove ' + t.dataset.name + "'s sign-up?", 'Sign-up removed.');
      }
    });

    // Show the mounts for whatever content is ticked.
    el('root').addEventListener('change', function (e) {
      if (e.target.name !== 'wanted') return;
      var form = e.target.form;
      var picked = $$('input[name="wanted"]:checked', form).map(function (i) { return i.value; });
      $$('[data-for]', form).forEach(function (block) { block.hidden = picked.indexOf(block.dataset.for) === -1; });
      var empty = $('[data-sn="wish-empty"]', form);
      if (empty) empty.hidden = picked.length > 0;
    });

    el('root').addEventListener('submit', function (e) {
      if (e.target.matches('[data-sn="form"]')) {
        e.preventDefault();
        save(e.target);
      }
    });

    // Keyboard: arrow keys move between night tabs.
    el('tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = $$('.sn-tab', el('tabs'));
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      next.click();
    });
  }

  function onAuth(session) {
    var before = state.user && state.user.id;
    state.user = session ? session.user : null;
    if ((state.user && state.user.id) === before) { renderAuth(); return; }
    Promise.all([loadHost(), loadMyProfile()]).then(function () {
      renderAuth(); renderTabs(); renderNight(); renderMine();
    });
  }

  function init() {
    if (!el('root')) return;
    buildContent();
    state.nights = collectNights();
    pickSelected();
    bindEvents();

    // An error coming back from the Discord login.
    var params = new URLSearchParams(location.search + '&' + location.hash.replace(/^#/, ''));
    if (params.get('error_description')) {
      toast('Discord login didn\'t work: ' + params.get('error_description'), true);
    }

    if (!CFG.supabaseUrl || !CFG.supabaseKey) {
      notice('<strong>Sign-ups aren\'t switched on yet.</strong> The site admin still needs to connect the database. See <code>supabase/SETUP.md</code>. Until then, sign up in the Discord.');
    } else if (!window.supabase || !window.supabase.createClient) {
      notice('<strong>Couldn\'t load the sign-up system.</strong> Something (an ad blocker, perhaps) blocked it. Try refreshing, or sign up in the Discord.');
    } else {
      sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
        auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true }
      });
    }

    renderAuth(); renderTabs(); renderNight(); renderMine();
    if (!sb) return;

    sb.auth.onAuthStateChange(function (_event, session) {
      // Supabase asks us not to await its calls inside this callback.
      setTimeout(function () { onAuth(session); }, 0);
    });

    loadRows();

    sb.channel('sprout-signups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sprout_signups' }, scheduleReload)
      .subscribe();

    // Catch up after the tab was in the background for a while.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') scheduleReload();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
