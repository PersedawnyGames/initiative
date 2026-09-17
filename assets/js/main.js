/* ==========================================================================
   Initiative — site behaviour
   Every renderer bails out quietly if its target element is not on the page,
   so this one file can be loaded by all pages.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* Escape anything that comes out of data.js before it hits innerHTML. */
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---- Mobile nav ------------------------------------------------------ */
  function initNav() {
    var toggle = $('.nav__toggle');
    var links  = $('.nav__links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Mark the current page in the nav.
    var here = location.pathname.split('/').pop() || 'index.html';
    $$('a', links).forEach(function (a) {
      if (a.getAttribute('href') === here) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---- Fill in FC details anywhere marked with data-fc ----------------- */
  function initFcBindings() {
    if (typeof FC === 'undefined') return;

    $$('[data-fc]').forEach(function (el) {
      var value = FC[el.dataset.fc];
      if (value === undefined) return;
      el.textContent = value;
    });

    $$('[data-fc-href]').forEach(function (el) {
      var value = FC[el.dataset.fcHref];
      if (!value) return;
      el.setAttribute('href', value);
      if (value !== '#') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    });
  }

  /* ---- Live FC details from the Lodestone ------------------------------ */
  // Shows the saved values from data.js first, then swaps in live ones —
  // and says so out loud next to the numbers, so "is this actually live?"
  // has a visible, checkable answer instead of needing to trust the JS.
  function relTime(ms) {
    var mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (mins < 1)  return 'just now';
    if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    var hrs = Math.round(mins / 60);
    if (hrs < 24)  return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
    var days = Math.round(hrs / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  }

  function initLiveFc() {
    if (typeof Lodestone === 'undefined' || typeof FC === 'undefined') return;

    var statusEl = $('[data-render="fc-status"]');
    function setStatus(html) { if (statusEl) statusEl.innerHTML = html; }

    Lodestone.freeCompany(
      function (live, fetchedAt) {
        Object.keys(live).forEach(function (key) { FC[key] = live[key]; });
        initFcBindings();
        setStatus('<span class="is-live">●</span> Live from the Lodestone · fetched ' + esc(relTime(fetchedAt)));
      },
      function (err, cached) {
        setStatus(cached
          ? 'Showing saved figures from ' + esc(relTime(cached.time)) + ' — Lodestone unreachable right now'
          : 'Showing saved figures — Lodestone unreachable right now');
      }
    );
  }

  /* ---- Icons (inline SVG, no image files needed) ----------------------- */
  var ICONS = {
    sword:  '<path d="M6 42l6-6M14 34L38 10l6-6v8L20 40l-6 2-2-6z"/><path d="M8 38l6 6"/>',
    users:  '<circle cx="18" cy="17" r="6"/><path d="M6 40c0-6.6 5.4-12 12-12s12 5.4 12 12"/><path d="M32 12a6 6 0 010 11"/><path d="M34 28c4.8 1.4 8 5.8 8 11"/>',
    sprout: '<path d="M24 42V22"/><path d="M24 22C24 14 18 8 8 8c0 10 6 16 16 14z"/><path d="M24 26c0-6 5-11 14-11 0 8-5 13-14 12z"/>',
    house:  '<path d="M6 21L24 6l18 15"/><path d="M11 20v22h26V20"/><path d="M20 42V29h8v13"/>'
  };

  function icon(name) {
    return '<svg class="card__icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
           'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           (ICONS[name] || '') + '</svg>';
  }

  /* ---- Home: activity cards ------------------------------------------- */
  function renderActivities() {
    var host = $('[data-render="activities"]');
    if (!host || typeof ACTIVITIES === 'undefined') return;

    host.innerHTML = ACTIVITIES.map(function (a) {
      return '<article class="card reveal">' +
               icon(a.icon) +
               '<h3>' + esc(a.title) + '</h3>' +
               '<p>' + esc(a.text) + '</p>' +
             '</article>';
    }).join('');
  }

  /* ---- Roster (live from the Lodestone, with search) ------------------- */
  function renderRoster() {
    var host = $('[data-render="roster"]');
    if (!host || typeof MEMBERS === 'undefined' || typeof RANKS === 'undefined') return;

    var search  = $('#roster-search');
    var count   = $('[data-roster-count]');
    var members = MEMBERS.slice();   // replaced by live data when it arrives
    var LODESTONE = 'https://eu.finalfantasyxiv.com/lodestone/character/';

    // Discord names and community roles only live in data.js, so they're
    // looked up by Lodestone ID and survive live updates and name changes.
    var community = {};
    MEMBERS.forEach(function (m) { if (m.id) community[m.id] = m; });

    var DISCORD_ICON =
      '<svg class="member__discord-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.49 0 12.64 12.64 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.89 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z"/></svg>';

    function rankOf(m) {
      for (var i = 0; i < RANKS.length; i++) {
        if (RANKS[i].name === m.rank) return { index: i, label: RANKS[i].label };
      }
      return null;
    }

    function initials(name) {
      return name.split(/\s+/).map(function (w) { return w.charAt(0); })
                 .join('').slice(0, 2).toUpperCase();
    }

    // Leadership only, in RANKS order, alphabetical within each rank.
    function roster() {
      return members
        .map(function (m) {
          var rank  = rankOf(m);
          var extra = community[m.id] || {};
          return rank && {
            name: m.name, id: m.id, portrait: m.portrait,
            rankIndex: rank.index, rankLabel: rank.label,
            discord: extra.discord || '', role: extra.role || ''
          };
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return a.rankIndex - b.rankIndex || a.name.localeCompare(b.name);
        });
    }

    function matches(m, q) {
      return !q || [m.name, m.rankLabel, m.role, m.discord].join(' ').toLowerCase().indexOf(q) !== -1;
    }

    // Initials sit underneath the portrait and show through if the image is
    // missing or fails to load.
    function memberMarkup(m) {
      var linked = /^\d+$/.test(m.id || '');
      var tag    = linked ? 'a' : 'div';
      var attrs  = linked
        ? ' href="' + LODESTONE + m.id + '/" target="_blank" rel="noopener"' +
          ' aria-label="' + esc(m.name) + ' on the Lodestone"'
        : '';

      return '<article class="member">' +
               '<' + tag + ' class="portrait"' + attrs + '>' +
                 '<div class="portrait__frame">' +
                   '<span class="portrait__fallback" aria-hidden="true">' + esc(initials(m.name)) + '</span>' +
                   (m.portrait
                     ? '<img src="' + esc(m.portrait) + '" alt="" width="880" height="1200" loading="lazy" decoding="async">'
                     : '') +
                 '</div>' +
                 '<span class="portrait__name">' + esc(m.name) + '</span>' +
               '</' + tag + '>' +
               '<div class="member__info">' +
                 '<span class="member__rank">' + esc(m.rankLabel) + '</span>' +
                 (m.role ? '<span class="member__role">' + esc(m.role) + '</span>' : '') +
                 (m.discord
                   ? '<span class="member__discord">' + DISCORD_ICON +
                       '<span class="sr-only">Discord: </span>' + esc(m.discord) + '</span>'
                   : '') +
               '</div>' +
             '</article>';
    }

    function draw() {
      var q    = (search && search.value || '').trim().toLowerCase();
      var all  = roster();
      var list = all.filter(function (m) { return matches(m, q); });

      host.innerHTML = list.length
        ? '<div class="roster-grid">' + list.map(memberMarkup).join('') + '</div>'
        : '<div class="empty-state">' + (q ? 'No members match that search.' : 'No members listed yet.') + '</div>';

      if (count) {
        count.textContent = q
          ? list.length + ' of ' + all.length + ' members'
          : all.length + (all.length === 1 ? ' member' : ' members');
      }
    }

    // Image errors don't bubble, so listen in the capture phase — one
    // listener covers every portrait, however often the roster re-renders.
    host.addEventListener('error', function (e) {
      if (e.target.tagName === 'IMG') e.target.hidden = true;
    }, true);

    if (search) search.addEventListener('input', draw);

    draw();

    // Swap in the live member list; if the Lodestone can't be reached, the
    // saved copy from data.js simply stays on screen.
    if (typeof Lodestone !== 'undefined') {
      Lodestone.members(function (list) {
        members = list;
        draw();
      });
    }
  }

  /* ---- Members page: everyone below Council, live from the Lodestone ---
     The whole roster is fetched once in the background (Lodestone.allMembers
     pages through it internally), then paginated for display client-side —
     so flipping pages here is instant, and filtering/sorting can see
     everyone rather than just whatever page happens to be loaded.

     Sorted by rank then name: the Lodestone always returns members ranked
     highest-first, so the rank order they arrive in is used as-is (rather
     than hard-coding this FC's specific rank names), with an alphabetical
     sort by name inside each rank.

     Once the roster is in, job levels are looked up one character page at a
     time (a few at once, not all ~490 simultaneously) to tag anyone with a
     level 90+ combat job, gatherer or crafter. That's a lot of extra
     requests through the same proxies, so tags fill in gradually — a filter
     applied before they've all landed will only match whoever's been
     checked so far. ---------------------------------------------------- */
  function renderAllMembers() {
    var host       = $('[data-render="all-members"]');
    if (!host) return;

    var search     = $('#members-search');
    var count      = $('[data-members-count]');
    var pageLabel  = $('[data-members-page-label]');
    var prevBtn    = $('[data-members-nav="prev"]');
    var nextBtn    = $('[data-members-nav="next"]');
    var filtersEl  = $('[data-members-filters]');
    var progressEl = $('[data-members-progress]');

    var excluded = {};
    if (typeof RANKS !== 'undefined') {
      RANKS.forEach(function (r) { excluded[r.name] = true; });
    }

    var TAGS = [
      { key: 'combat90',   label: 'Combat',   color: '#e0665c' },
      { key: 'gatherer90', label: 'Gatherer', color: '#7cc576' },
      { key: 'crafter90',  label: 'Crafter',  color: '#e8944a' }
    ];
    var PAGE_SIZE = 50;

    var all     = null;    // full sorted list, or null until the first fetch lands
    var failed  = false;
    var page    = 1;
    var active  = {};      // tag key -> true while that filter pill is on
    var checked = 0;       // how many members have a job-level result so far

    function matches(m, q) {
      return !q || (m.name + ' ' + m.rank).toLowerCase().indexOf(q) !== -1;
    }

    function activeKeys() {
      return TAGS.map(function (t) { return t.key; }).filter(function (k) { return active[k]; });
    }

    function passesFilters(m) {
      var keys = activeKeys();
      if (!keys.length) return true;
      var info = m.jobInfo || {};
      return keys.some(function (k) { return info[k]; });
    }

    // Rank order comes from the Lodestone's own sort (highest rank first)
    // rather than a hard-coded list of this FC's rank names, so it keeps
    // working if custom ranks are ever renamed or reordered in-game.
    function sortByRankThenName(list) {
      var order = {};
      var next  = 0;
      list.forEach(function (m) {
        if (!(m.rank in order)) order[m.rank] = next++;
      });
      return list.slice().sort(function (a, b) {
        return (order[a.rank] - order[b.rank]) || a.name.localeCompare(b.name);
      });
    }

    function jobTagsHtml(info) {
      if (!info) return '';
      return TAGS.map(function (t) {
        return info[t.key]
          ? '<span class="tag" style="color:' + t.color + ';border-color:' + t.color + '">' + t.label + '</span>'
          : '';
      }).join('');
    }

    function memberMiniMarkup(m) {
      return '<div class="member-mini" data-member-id="' + esc(m.id) + '">' +
               '<span class="member-mini__name">' + esc(m.name) + '</span>' +
               '<span class="member-mini__rank">' + esc(m.rank) + '</span>' +
               '<div class="member-mini__tags" data-member-tags>' + jobTagsHtml(m.jobInfo) + '</div>' +
             '</div>';
    }

    function drawFilters() {
      if (!filtersEl) return;
      filtersEl.innerHTML = TAGS.map(function (t) {
        var on = !!active[t.key];
        return '<button type="button" class="cal__filter' + (on ? ' is-active' : '') + '" ' +
                 'data-members-filter="' + t.key + '" aria-pressed="' + on + '" ' +
                 'style="--pill-color:' + t.color + ';--pill-rgb:' + calHexToRgb(t.color) + '">' +
                 '<span class="cal__filter-dot"></span>' + t.label +
               '</button>';
      }).join('');
    }

    function draw() {
      if (all === null) {
        host.innerHTML = '<div class="empty-state">' + (failed
          ? 'Couldn’t reach the Lodestone right now — try again shortly, or see the full ' +
            '<a href="' + (typeof FC !== 'undefined' ? FC.lodestone + 'member/' : '#') +
            '" target="_blank" rel="noopener">member list on the Lodestone</a>.'
          : 'Loading members from the Lodestone… this pages through the whole roster, so it can take a little while.'
        ) + '</div>';
        if (count) count.textContent = '';
        if (pageLabel) pageLabel.textContent = 'Page 1';
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (progressEl) progressEl.textContent = '';
        return;
      }

      var q       = (search && search.value || '').trim().toLowerCase();
      var visible = all.filter(function (m) { return matches(m, q) && passesFilters(m); });

      var totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
      if (page > totalPages) page = totalPages;

      var pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      host.innerHTML = pageItems.length
        ? '<div class="member-mini-grid">' + pageItems.map(memberMiniMarkup).join('') + '</div>'
        : '<div class="empty-state">No members match' + ((q || activeKeys().length) ? ' this search or filter.' : '.') + '</div>';

      if (count) {
        count.textContent = visible.length + (visible.length === 1 ? ' member' : ' members') +
          (visible.length !== all.length ? ' (of ' + all.length + ' total)' : '');
      }

      if (pageLabel) pageLabel.textContent = 'Page ' + page + ' of ' + totalPages;
      if (prevBtn) prevBtn.disabled = page <= 1;
      if (nextBtn) nextBtn.disabled = page >= totalPages;

      if (progressEl) {
        progressEl.textContent = checked < all.length
          ? 'Checking job levels… ' + checked + ' of ' + all.length
          : '';
      }
    }

    // A handful of lookups in flight at once, not all ~490 simultaneously —
    // kinder to the free proxies, and no less useful since tags (and any
    // filter watching for them) fill in as each one lands.
    function fetchJobTags(list) {
      if (typeof Lodestone === 'undefined') return;
      var queue = list.filter(function (m) { return !m.jobInfo && /^\d+$/.test(m.id || ''); });
      if (!queue.length) return;

      var CONCURRENCY = 5;
      var inFlight     = CONCURRENCY;
      var dirty        = false;
      var progressTimer = setInterval(function () {
        if (dirty) { dirty = false; draw(); }
      }, 500);

      function settle(m, info) {
        m.jobInfo = info;
        checked++;
        dirty = true;
        var el = host.querySelector('.member-mini[data-member-id="' + m.id + '"] [data-member-tags]');
        if (el) el.innerHTML = jobTagsHtml(info);
        next();
      }

      function next() {
        var m = queue.shift();
        if (!m) {
          inFlight--;
          if (inFlight <= 0) { clearInterval(progressTimer); draw(); }
          return;
        }
        Lodestone.classJob(m.id, function (info) { settle(m, info || {}); }, function () { settle(m, {}); });
      }

      for (var i = 0; i < CONCURRENCY; i++) next();
    }

    function load() {
      if (typeof Lodestone === 'undefined') return;
      failed = false;
      draw();
      Lodestone.allMembers(function (list) {
        var filtered = (list || []).filter(function (m) { return !excluded[m.rank]; });
        all  = sortByRankThenName(filtered);
        page = 1;
        draw();
        fetchJobTags(all);
      }, function () {
        failed = true;
        draw();
      });
    }

    drawFilters();
    draw();
    load();

    if (search) search.addEventListener('input', function () { page = 1; draw(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { page--; draw(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { page++; draw(); });
    if (filtersEl) filtersEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-members-filter]');
      if (!btn) return;
      var key = btn.getAttribute('data-members-filter');
      active[key] = !active[key];
      page = 1;
      drawFilters();
      draw();
    });
  }

  /* ---- Events page: server maintenance from the Lodestone -------------- */
  var DAY_FORMAT  = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  var TIME_FORMAT = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

  // "Thu 17 Sept, 08:00 – 12:00" in the visitor's own time zone.
  function formatRange(start, end) {
    var a = new Date(start);
    var b = new Date(end);
    var from = DAY_FORMAT.format(a) + ', ' + TIME_FORMAT.format(a);
    return DAY_FORMAT.format(a) === DAY_FORMAT.format(b)
      ? from + ' – ' + TIME_FORMAT.format(b)
      : from + ' – ' + DAY_FORMAT.format(b) + ', ' + TIME_FORMAT.format(b);
  }

  function renderMaintenance() {
    var host    = $('[data-render="maintenance"]');
    var section = $('[data-section="maintenance"]');
    if (!host || !section || typeof Lodestone === 'undefined') return;

    var dc = typeof FC !== 'undefined' ? String(FC.dataCenter || '') : '';

    function affectsUs(m) {
      // Only maintenance that takes game worlds offline (not the Mog Station,
      // Companion app or Lodestone website)…
      if (!/\bworlds?\b|data cent(er|re)/i.test(m.title)) return false;
      // …for all worlds, or tagged with our data center, e.g. "[Light] …".
      var scope = m.title.match(/^\[([^\]]+)\]/);
      return !scope || scope[1].toLowerCase().indexOf(dc.toLowerCase()) !== -1;
    }

    Lodestone.maintenance(function (list) {
      var now = Date.now();
      var upcoming = list
        .filter(function (m) { return m.end > now && affectsUs(m); })
        .sort(function (a, b) { return a.start - b.start; });

      section.hidden = !upcoming.length;
      host.innerHTML = upcoming.map(function (m) {
        var live = m.start <= now;
        return '<a class="notice" href="' + esc(m.url) + '" target="_blank" rel="noopener">' +
                 '<span class="notice__status' + (live ? ' is-live' : '') + '">' +
                   (live ? 'Happening now' : 'Upcoming') +
                 '</span>' +
                 '<span class="notice__title">' + esc(m.title) + '</span>' +
                 '<span class="notice__time">' + esc(formatRange(m.start, m.end)) +
                   ' <small>your time</small></span>' +
               '</a>';
      }).join('');
    });
  }

  /* ---- Events page: calendar --------------------------------------------
     Month grid, Monday-first. Every event is drawn as a bar spanning from
     its start day to its end day (a one-day event is just a one-day bar) —
     multiple events on overlapping days stack into their own lane so they
     never cover each other. Filter pills toggle a type's bars on/off;
     clicking a bar opens its full detail below the grid.
     ------------------------------------------------------------------- */
  var CAL_WEEKDAYS      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var CAL_MONTH_FORMAT  = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
  var CAL_DEFAULT_COLOR = '#c8a95e';
  var CAL_COLOR_CACHE   = {};

  // "Server Time" (ST) is Central European (Summer) Time — the EU data
  // centers run on CET/CEST, which is what the Lodestone and most EU raiders
  // mean by "ST". Converting through an IANA zone (rather than a fixed
  // UTC+1/+2 offset) means this stays correct across the DST switchover.
  var CAL_SERVER_ZONE = 'Europe/Paris';
  var CAL_LOCAL_TIME_FORMAT = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  var CAL_LOCAL_DAY_FORMAT  = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  // Resolves a wall-clock date + time *in CAL_SERVER_ZONE* to the real UTC
  // instant it refers to, by comparing a naive UTC guess against how that
  // guess reads back in the target zone and correcting for the difference —
  // the standard way to do zone-aware math with only Date/Intl, no library.
  function calServerTimeToUtc(y, m, d, hh, mm) {
    var guess = new Date(Date.UTC(y, m, d, hh, mm));
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: CAL_SERVER_ZONE, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    var parts = {};
    dtf.formatToParts(guess).forEach(function (p) { parts[p.type] = p.value; });
    var hour = parts.hour === '24' ? 0 : +parts.hour;
    var readBack = Date.UTC(+parts.year, +parts.month - 1, +parts.day, hour, +parts.minute);
    return new Date(guess.getTime() - (readBack - guess.getTime()));
  }

  // ev.time is free text like "20:00 ST" — pulls the leading HH:MM off it
  // and returns that moment formatted in whoever's looking at the page's own
  // time zone, or null if there's no parseable time (multi-day FF14 events,
  // "Drop in any time", etc. — those just don't get a converted reading).
  //
  // For someone far enough from CET (Asia, Australia…) the converted time
  // can land on a different calendar day than the Server Time date shown
  // next to it — read back the instant's date in *their* zone and prefix a
  // day label whenever it doesn't match, so "20:00 ST" on a Friday doesn't
  // silently read as "3:00 AM" without saying that's already Saturday.
  function calLocalTime(ev) {
    var m = /^(\d{1,2}):(\d{2})/.exec(ev.time || '');
    if (!m) return null;
    try {
      var instant = calServerTimeToUtc(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate(), +m[1], +m[2]);
      var clock   = CAL_LOCAL_TIME_FORMAT.format(instant);
      var shifted = instant.getFullYear() !== ev.start.getFullYear() ||
                    instant.getMonth() !== ev.start.getMonth() ||
                    instant.getDate() !== ev.start.getDate();
      return shifted ? CAL_LOCAL_DAY_FORMAT.format(instant) + ', ' + clock : clock;
    } catch (e) {
      return null;
    }
  }

  function calParseDate(s) {
    var p = String(s || '').split('-').map(Number);
    return new Date(p[0] || 1970, (p[1] || 1) - 1, p[2] || 1);
  }

  function calAddDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  function calSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function calDiffDays(a, b) {
    return Math.round((b - a) / 86400000);
  }

  // Monday-first week that contains d.
  function calWeekStart(d) {
    return calAddDays(d, -((d.getDay() + 6) % 7));
  }

  // Every Monday-first week needed to fully cover a month, leading/trailing
  // days from neighbouring months included so the grid is always full rows.
  function calMonthWeeks(year, month) {
    var first = new Date(year, month, 1);
    var last  = new Date(year, month + 1, 0);
    var start = calWeekStart(first);
    var end   = calWeekStart(last);
    var weeks = [];

    for (var d = start; d <= end; d = calAddDays(d, 7)) {
      var week = [];
      for (var i = 0; i < 7; i++) week.push(calAddDays(d, i));
      weeks.push(week);
    }
    return weeks;
  }

  function calHexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    if (isNaN(n)) return '200, 169, 94';
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(', ');
  }

  function calTypeColor(type) {
    if (!CAL_COLOR_CACHE[type]) {
      var hex = (typeof EVENT_TYPE_COLORS !== 'undefined' && EVENT_TYPE_COLORS[type]) || CAL_DEFAULT_COLOR;
      CAL_COLOR_CACHE[type] = { hex: hex, rgb: calHexToRgb(hex) };
    }
    return CAL_COLOR_CACHE[type];
  }

  function calNormalize(list) {
    return list.map(function (ev) {
      var start = calParseDate(ev.date);
      var end   = ev.endDate ? calParseDate(ev.endDate) : start;
      if (end < start) end = start;
      return { title: ev.title, time: ev.time, type: ev.type, detail: ev.detail, start: start, end: end };
    });
  }

  function calTypesIn(list) {
    var seen = [];
    list.forEach(function (ev) {
      if (ev.type && seen.indexOf(ev.type) === -1) seen.push(ev.type);
    });
    return seen;
  }

  // Greedy lane packing for one Monday-first week: events sorted by start
  // day (longest first among ties) each claim the first lane free of any
  // bar that would overlap them, so nothing visually collides.
  function calLayoutWeek(weekStart, events) {
    var weekEnd = calAddDays(weekStart, 6);
    var items = [];

    events.forEach(function (ev) {
      if (ev.end < weekStart || ev.start > weekEnd) return;
      items.push({
        ev: ev,
        colStart: Math.max(0, calDiffDays(weekStart, ev.start)),
        colEnd: Math.min(6, calDiffDays(weekStart, ev.end)),
        continuesBefore: ev.start < weekStart,
        continuesAfter: ev.end > weekEnd
      });
    });

    items.sort(function (a, b) {
      return a.colStart - b.colStart || (b.colEnd - b.colStart) - (a.colEnd - a.colStart);
    });

    var laneEnds = [];
    items.forEach(function (item) {
      var lane = 0;
      while (laneEnds[lane] !== undefined && laneEnds[lane] >= item.colStart) lane++;
      laneEnds[lane] = item.colEnd;
      item.lane = lane;
    });

    return { items: items, lanes: laneEnds.length };
  }

  // Remembers which filter pills are on/off between visits. Wrapped in
  // try/catch because localStorage can throw (private browsing, disabled
  // storage) — the calendar just falls back to "everything shown" then.
  var CAL_FILTER_KEY = 'initiative:cal-filters';

  function calLoadFilters() {
    try {
      var raw = localStorage.getItem(CAL_FILTER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function calSaveFilters(active) {
    try {
      localStorage.setItem(CAL_FILTER_KEY, JSON.stringify(active));
    } catch (e) {
      // Storage unavailable — filter choice just won't persist this visit.
    }
  }

  function renderCalendar() {
    var host = $('[data-render="calendar"]');
    if (!host || typeof EVENTS === 'undefined') return;

    var monthLabel = $('[data-cal="month"]', host);
    var weekdaysEl = $('[data-cal="weekdays"]', host);
    var gridEl     = $('[data-cal="grid"]', host);
    var filtersEl  = $('[data-cal="filters"]', host);
    var detailEl   = $('[data-cal="detail"]', host);
    var cardsEl    = $('[data-cal="cards"]', host);   // mobile agenda view — optional
    if (!monthLabel || !weekdaysEl || !gridEl || !filtersEl || !detailEl) return;

    var events = calNormalize(EVENTS);
    var types  = calTypesIn(events);
    var saved  = calLoadFilters();
    var active = {};
    types.forEach(function (t) { active[t] = saved.hasOwnProperty(t) ? !!saved[t] : true; });

    var today    = new Date();
    var view     = { year: today.getFullYear(), month: today.getMonth() };
    var rendered = [];   // flat list of visible events, indexed to match each bar's data-cal-idx

    weekdaysEl.innerHTML = CAL_WEEKDAYS.map(function (d) {
      return '<span class="cal__weekday">' + d + '</span>';
    }).join('');

    function drawFilters() {
      filtersEl.innerHTML = types.map(function (t) {
        var on    = active[t];
        var color = calTypeColor(t);
        return '<button type="button" class="cal__filter' + (on ? ' is-active' : '') + '" ' +
                 'data-cal-filter="' + esc(t) + '" aria-pressed="' + on + '" ' +
                 'style="--pill-color:' + color.hex + ';--pill-rgb:' + color.rgb + '">' +
                 '<span class="cal__filter-dot"></span>' + esc(t) +
               '</button>';
      }).join('');
    }

    function closeDetail() {
      detailEl.hidden = true;
      detailEl.innerHTML = '';
    }

    function showDetail(ev) {
      var color = calTypeColor(ev.type);
      var range = calSameDay(ev.start, ev.end)
        ? DAY_FORMAT.format(ev.start)
        : DAY_FORMAT.format(ev.start) + ' – ' + DAY_FORMAT.format(ev.end);
      var localTime = calLocalTime(ev);

      detailEl.hidden = false;
      detailEl.innerHTML =
        '<div class="cal__detail-card" style="border-left-color:' + color.hex + '">' +
          '<button type="button" class="cal__detail-close" aria-label="Close event details">&times;</button>' +
          '<span class="tag" style="color:' + color.hex + ';border-color:' + color.hex + '">' + esc(ev.type) + '</span>' +
          '<h3>' + esc(ev.title) + '</h3>' +
          '<p class="cal__detail-meta">' + esc(range) + (ev.time ? ' · ' + esc(ev.time) : '') +
            (localTime ? ' <small>(' + esc(localTime) + ' your time)</small>' : '') +
          '</p>' +
          (ev.detail ? '<p>' + esc(ev.detail) + '</p>' : '') +
        '</div>';
      detailEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function draw() {
      var weeks = calMonthWeeks(view.year, view.month);
      monthLabel.textContent = CAL_MONTH_FORMAT.format(new Date(view.year, view.month, 1));

      var visible = events.filter(function (ev) { return active[ev.type] !== false; });
      var anyThisMonth = events.some(function (ev) {
        return ev.start.getFullYear() === view.year && ev.start.getMonth() === view.month;
      });
      var anyVisibleThisMonth = visible.some(function (ev) {
        return ev.start.getFullYear() === view.year && ev.start.getMonth() === view.month;
      });

      rendered = [];

      gridEl.innerHTML = weeks.map(function (week) {
        var layout = calLayoutWeek(week[0], visible);
        var lanes  = Math.max(layout.lanes, 1);

        // Day numbers and bars are placed in ONE shared grid (not two stacked
        // grids) so their columns are guaranteed to land on the same tracks —
        // two separate grids with different gaps drift out of alignment by
        // the time you reach the later columns.
        //
        // A full-height bordered cell is drawn behind each day (spanning
        // every lane row) so which column owns which bar is visible, not
        // just mathematically true.
        var cells = week.map(function (day, i) {
          var classes = ['cal__cell'];
          if (i < 6) classes.push('cal__cell--divide');
          if (calSameDay(day, today)) classes.push('cal__cell--today');
          return '<span class="' + classes.join(' ') + '" style="grid-column:' + (i + 1) + ';grid-row:1 / -1;"></span>';
        }).join('');

        var daynums = week.map(function (day, i) {
          var classes = ['cal__daynum'];
          if (day.getMonth() !== view.month) classes.push('cal__daynum--outside');
          if (calSameDay(day, today)) classes.push('cal__daynum--today');
          return '<span class="' + classes.join(' ') + '" style="grid-column:' + (i + 1) + ';grid-row:1;">' +
                   day.getDate() + '</span>';
        }).join('');

        var bars = layout.items.map(function (item) {
          var idx = rendered.length;
          rendered.push(item.ev);

          var color   = calTypeColor(item.ev.type);
          var classes = ['cal__bar'];
          if (item.continuesBefore) classes.push('cal__bar--open-start');
          if (item.continuesAfter) classes.push('cal__bar--open-end');

          var barLocalTime = calLocalTime(item.ev);
          var label = item.ev.title + (item.ev.time
            ? ' — ' + item.ev.time + (barLocalTime ? ' (' + barLocalTime + ' your time)' : '')
            : '');

          return '<button type="button" class="' + classes.join(' ') + '" data-cal-idx="' + idx + '" ' +
                   'style="grid-column:' + (item.colStart + 1) + ' / ' + (item.colEnd + 2) + ';' +
                     'grid-row:' + (item.lane + 2) + ';--bar-color:' + color.hex + ';--bar-rgb:' + color.rgb + ';" ' +
                   'title="' + esc(label) + '">' + esc(item.ev.title) + '</button>';
        }).join('');

        return '<div class="cal__week" style="grid-template-rows:auto repeat(' + lanes + ', 22px);">' +
                 cells + daynums + bars +
               '</div>';
      }).join('');

      gridEl.setAttribute('aria-label', CAL_MONTH_FORMAT.format(new Date(view.year, view.month, 1)) +
        (anyThisMonth && !anyVisibleThisMonth ? ' — all events hidden by filters' : ''));

      if (cardsEl) drawCards(visible, view);
    }

    // Mobile agenda view (see the responsive block in style.css) — the same
    // events as the grid above, but as readable cards instead of tiny bars.
    // Multi-day events (the FF14-wide seasonal ones, currently) are pinned
    // into their own group above the day-by-day list, since they're the
    // ones most likely to still be relevant whenever this gets checked.
    function cardRange(ev) {
      return calSameDay(ev.start, ev.end)
        ? DAY_FORMAT.format(ev.start)
        : DAY_FORMAT.format(ev.start) + ' – ' + DAY_FORMAT.format(ev.end);
    }

    function cardMarkup(ev, featured) {
      var color     = calTypeColor(ev.type);
      var localTime = calLocalTime(ev);
      return '<article class="cal__card' + (featured ? ' cal__card--featured' : '') + '" ' +
               'style="--bar-color:' + color.hex + ';--bar-rgb:' + color.rgb + '">' +
               '<div class="cal__card-head">' +
                 '<span class="cal__card-date' + (calSameDay(ev.start, today) ? ' cal__card-date--today' : '') + '">' +
                   esc(cardRange(ev)) +
                 '</span>' +
                 '<span class="tag" style="color:' + color.hex + ';border-color:' + color.hex + '">' + esc(ev.type) + '</span>' +
               '</div>' +
               '<h3>' + esc(ev.title) + '</h3>' +
               (ev.time ? '<p class="cal__card-time">' + esc(ev.time) +
                 (localTime ? ' <small>(' + esc(localTime) + ' your time)</small>' : '') + '</p>' : '') +
               (ev.detail ? '<p class="cal__card-detail">' + esc(ev.detail) + '</p>' : '') +
             '</article>';
    }

    function drawCards(visible, view) {
      var monthStart = new Date(view.year, view.month, 1);
      var monthEnd   = new Date(view.year, view.month + 1, 0);
      var overlapsMonth = function (ev) { return ev.start <= monthEnd && ev.end >= monthStart; };

      var featured = visible
        .filter(function (ev) { return !calSameDay(ev.start, ev.end) && overlapsMonth(ev); })
        .sort(function (a, b) { return a.start - b.start; });

      var single = visible
        .filter(function (ev) { return calSameDay(ev.start, ev.end) && overlapsMonth(ev); })
        .sort(function (a, b) { return a.start - b.start; });

      if (!featured.length && !single.length) {
        var anyThisMonthAtAll = events.some(overlapsMonth);
        cardsEl.innerHTML = '<div class="empty-state">' +
          (anyThisMonthAtAll ? 'All events hidden by filters.' : 'No events this month.') +
        '</div>';
        return;
      }

      cardsEl.innerHTML =
        (featured.length ? '<div class="cal__cards-label">Ongoing</div>' +
          featured.map(function (ev) { return cardMarkup(ev, true); }).join('') : '') +
        (single.length ? '<div class="cal__cards-label">This month</div>' +
          single.map(function (ev) { return cardMarkup(ev, false); }).join('') : '');
    }

    host.addEventListener('click', function (e) {
      var navBtn = e.target.closest('[data-cal-nav]');
      if (navBtn) {
        var action = navBtn.getAttribute('data-cal-nav');
        if (action === 'today') { view.year = today.getFullYear(); view.month = today.getMonth(); }
        if (action === 'prev')  { view.month--; if (view.month < 0)  { view.month = 11; view.year--; } }
        if (action === 'next')  { view.month++; if (view.month > 11) { view.month = 0;  view.year++; } }
        closeDetail();
        draw();
        return;
      }

      var filterBtn = e.target.closest('[data-cal-filter]');
      if (filterBtn) {
        var t = filterBtn.getAttribute('data-cal-filter');
        active[t] = !active[t];
        calSaveFilters(active);
        drawFilters();
        closeDetail();
        draw();
        return;
      }

      var bar = e.target.closest('[data-cal-idx]');
      if (bar) {
        showDetail(rendered[+bar.getAttribute('data-cal-idx')]);
        return;
      }

      if (e.target.closest('.cal__detail-close')) closeDetail();
    });

    drawFilters();
    draw();
  }

  /* ---- Reveal on scroll ------------------------------------------------ */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- Footer year ----------------------------------------------------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---- Boot ------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initFcBindings();
    initLiveFc();
    renderActivities();
    renderRoster();
    renderAllMembers();
    renderMaintenance();
    renderCalendar();
    initYear();
    initReveal();   // last: everything rendered above is now in the DOM
  });
})();
