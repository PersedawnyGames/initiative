/* ==========================================================================
   Initiative — live Lodestone data
   --------------------------------------------------------------------------
   The Lodestone has no API and doesn't let browsers on other sites read its
   pages, so FC pages are fetched through a public CORS proxy and parsed here.
   Maintenance notices come from lodestonenews.com, a community JSON API for
   the Lodestone news feeds that browsers can call directly.

   In-game events and official news are switched off for now (see below) —
   the fetching/parsing calls for them have been removed, not just hidden.

   - Results are cached in the visitor's browser (see the *_MINUTES values).
   - If a source fails, the site keeps showing the saved copy in data.js, or
     hides the maintenance section.
   - Everything fetched is treated as untrusted: text is escaped when
     rendered, IDs must be digits, links and images must be Square Enix URLs.
   ========================================================================== */

var Lodestone = (function () {
  'use strict';

  var CACHE_MINUTES      = 60;
  var NEWS_CACHE_MINUTES = 30;
  var CACHE_PREFIX       = 'initiative:lodestone:';

  var NEWS_API     = 'https://lodestonenews.com/news/';
  var NEWS_LINK    = /^https:\/\/(eu|na|jp|fr|de)\.finalfantasyxiv\.com\/lodestone\//;

  // Tried in order until one returns a page that parses.
  var PROXIES = [
    {
      name: 'jina',
      url: function (u) { return 'https://r.jina.ai/' + u; },
      headers: { 'X-Return-Format': 'html' },
      timeout: 12000
    },
    {
      name: 'allorigins',
      url: function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
      timeout: 25000
    },
    {
      name: 'cors.lol',
      url: function (u) { return 'https://api.cors.lol/?url=' + encodeURIComponent(u); },
      timeout: 12000
    }
  ];

  // Lodestone face thumbnails and full portraits share a URL apart from fc0/fl0.
  var FACE = /^https:\/\/img2\.finalfantasyxiv\.com\/f\/[0-9a-f]+_[0-9a-f]+fc0\.jpg(\?\d+)?$/;

  function fcUrl(path) {
    var base = String(FC.lodestone || '');
    if (base.slice(-1) !== '/') base += '/';
    return base + (path || '');
  }

  /* ---- Fetching -------------------------------------------------------- */
  function fetchText(url, headers, ms) {
    var ctrl  = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms) : null;

    return fetch(url, { headers: headers || {}, signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      }, function (err) {
        clearTimeout(timer);
        throw err;
      });
  }

  // Fetch a Lodestone page through each proxy in turn. A proxy's own error
  // page won't parse, so the parser returning null moves on to the next one.
  function load(url, parse) {
    var i = 0;

    function next(lastError) {
      if (i >= PROXIES.length) {
        return Promise.reject(lastError || new Error('No proxy could reach the Lodestone'));
      }
      var proxy = PROXIES[i++];

      return fetchText(proxy.url(url), proxy.headers, proxy.timeout)
        .then(function (html) {
          var result = parse(new DOMParser().parseFromString(html, 'text/html'));
          if (!result) throw new Error(proxy.name + ': not a Lodestone page');
          return result;
        })
        .catch(next);
    }

    return next();
  }

  /* ---- Parsing --------------------------------------------------------- */
  function text(el) {
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  // The FC page labels each value with an <h3>; the value is the next element.
  function afterHeading(doc, label) {
    var headings = doc.querySelectorAll('h3.heading--lead');
    for (var i = 0; i < headings.length; i++) {
      if (text(headings[i]) === label) return headings[i].nextElementSibling;
    }
    return null;
  }

  function parseFreeCompany(doc) {
    var members = parseInt(text(afterHeading(doc, 'Active Members')), 10);
    if (!members) return null;

    var data = { members: members };

    var rank = parseInt(text(afterHeading(doc, 'Rank')), 10);
    if (rank) data.rank = rank;

    // "Formed" is written by an inline script: ldst_strftime(<unix time>, ...)
    var formed = afterHeading(doc, 'Formed');
    var stamp  = formed && formed.innerHTML.match(/ldst_strftime\((\d+)/);
    if (stamp) data.founded = String(new Date(stamp[1] * 1000).getUTCFullYear());

    var tag = text(doc.querySelector('p.freecompany__text__tag')).replace(/[«»]/g, '');
    if (tag) data.tag = tag;

    var estateName    = text(doc.querySelector('.freecompany__estate__name'));
    var estateAddress = text(doc.querySelector('.freecompany__estate__text'));
    if (estateName)    data.estateName = estateName;
    if (estateAddress) data.estateAddress = estateAddress;

    var recruitment = text(doc.querySelector('.freecompany__recruitment'));
    if (recruitment) data.recruitment = recruitment;

    return data;
  }

  // Page 1 of the member list is enough: the Lodestone sorts it by rank, so
  // the leadership ranks always come first.
  function parseMembers(doc) {
    var links = doc.querySelectorAll('a.entry__bg[href*="/lodestone/character/"]');
    var list  = [];

    for (var i = 0; i < links.length; i++) {
      var a    = links[i];
      var id   = (a.getAttribute('href').match(/\/character\/(\d+)\//) || [])[1] || '';
      var img  = a.querySelector('.entry__chara__face img');
      var face = img ? img.getAttribute('src') : '';
      var name = text(a.querySelector('.entry__name'));
      var rank = text(a.querySelector('.entry__freecompany__info span'));

      if (!name || !rank) continue;
      list.push({
        name: name,
        rank: rank,
        id: id,
        portrait: FACE.test(face) ? face.replace('fc0.jpg', 'fl0.jpg') : ''
      });
    }

    return list.length ? list : null;
  }

  // The Lodestone shows up to 50 members per page — a full page back means
  // there's likely another one after it, so the whole-roster fetch below
  // keeps going until a page comes back short.
  var MEMBER_PAGE_SIZE = 50;
  var MEMBER_MAX_PAGES = 20;

  // Every member across the whole FC, not just the first page — used by the
  // Members page. Pages through the member list until one comes back short
  // (the last page) or a page fails outright, so a mid-way hiccup still
  // returns everything fetched so far instead of nothing.
  function loadAllMembers() {
    var all  = [];
    var seen = {};

    function addPage(list) {
      list.forEach(function (m) {
        var key = m.id || m.name;
        if (!seen[key]) { seen[key] = true; all.push(m); }
      });
    }

    function next(page) {
      return load(fcUrl('member/?page=' + page), parseMembers).then(function (list) {
        if (!list || !list.length) return all;
        addPage(list);
        if (list.length < MEMBER_PAGE_SIZE || page >= MEMBER_MAX_PAGES) return all;
        return next(page + 1);
      });
    }

    return next(1).then(function (result) {
      if (!result.length) throw new Error('No members parsed');
      return result;
    }, function (err) {
      if (all.length) return all;
      throw err;
    });
  }

  /* ---- Class/Job levels (Combat/Gatherer/Crafter tags on the Members
     page) ------------------------------------------------------------------
     A member's FC entry doesn't include job levels, so this fetches their
     own character page separately, one at a time, in the background. Jobs
     are matched by name rather than by position in the page, since that's
     stable even if the Lodestone's layout isn't. */
  var GATHERER_JOBS = ['Miner', 'Botanist', 'Fisher'];
  var CRAFTER_JOBS = [
    'Carpenter', 'Blacksmith', 'Armorer', 'Goldsmith',
    'Leatherworker', 'Weaver', 'Alchemist', 'Culinarian'
  ];
  var COMBAT_JOBS = [
    'Gladiator', 'Marauder', 'Dark Knight', 'Gunbreaker', 'Paladin', 'Warrior',
    'Conjurer', 'White Mage', 'Scholar', 'Astrologian', 'Sage',
    'Pugilist', 'Lancer', 'Rogue', 'Monk', 'Dragoon', 'Ninja', 'Samurai', 'Reaper', 'Viper', 'Beastmaster',
    'Archer', 'Bard', 'Machinist', 'Dancer',
    'Thaumaturge', 'Summoner', 'Arcanist', 'Red Mage', 'Pictomancer', 'Blue Mage', 'Black Mage'
  ];
  // Longest name first, so "Dark Knight" is matched before a shorter name
  // that might otherwise be found inside it.
  var TRACKED_JOBS = GATHERER_JOBS.concat(CRAFTER_JOBS, COMBAT_JOBS)
    .sort(function (a, b) { return b.length - a.length; });

  function characterUrl(id) {
    var m = /^(https:\/\/[a-z]+\.finalfantasyxiv\.com\/lodestone\/)/.exec(String(FC.lodestone || ''));
    var base = m ? m[1] : 'https://eu.finalfantasyxiv.com/lodestone/';
    return base + 'character/' + id + '/class_job/';
  }

  // The Lodestone lists each job as "<level> <job name> <exp>" inside its
  // own list item — the level always comes right before the job's name.
  function parseJobLevels(doc) {
    var items = doc.querySelectorAll('li');
    if (!items.length) return null;   // not a real page — a proxy error, most likely

    var levels = {};
    for (var i = 0; i < items.length; i++) {
      var t = text(items[i]);
      if (!t) continue;

      for (var j = 0; j < TRACKED_JOBS.length; j++) {
        var job = TRACKED_JOBS[j];
        var idx = t.indexOf(job);
        if (idx === -1) continue;

        var m = /(\d{1,3})\s*$/.exec(t.slice(0, idx).trim());
        if (!m) break;

        var level = parseInt(m[1], 10);
        if (level > (levels[job] || 0)) levels[job] = level;
        break;
      }
    }

    return levels;
  }

  function classifyJobLevels(levels) {
    return {
      combat90:   COMBAT_JOBS.some(function (j) { return (levels[j] || 0) >= 90; }),
      gatherer90: GATHERER_JOBS.some(function (j) { return (levels[j] || 0) >= 90; }),
      crafter90:  CRAFTER_JOBS.some(function (j) { return (levels[j] || 0) >= 90; })
    };
  }

  /* ---- Official news + maintenance (lodestonenews.com) ----------------- */
  function fetchNews(feed) {
    return fetchText(NEWS_API + feed + '?locale=eu', null, 10000).then(function (body) {
      var list = JSON.parse(body);
      if (!Array.isArray(list)) throw new Error('Unexpected ' + feed + ' response');
      return list;
    });
  }

  function cleanMaintenance(list) {
    var byTitle = {};

    list.forEach(function (m) {
      var item = {
        title: String(m.title || '').replace(/:\s*Follow-up\s*$/i, '').trim(),
        url: NEWS_LINK.test(m.url) ? m.url : '',
        published: Date.parse(m.time) || 0,
        start: Date.parse(m.start) || 0,
        end: Date.parse(m.end) || 0
      };
      if (!item.title || !item.url || !item.start || !item.end) return;

      // A follow-up replaces the original notice: it carries the final times.
      var seen = byTitle[item.title];
      if (!seen || item.published > seen.published) byTitle[item.title] = item;
    });

    return Object.keys(byTitle).map(function (k) { return byTitle[k]; });
  }

  /* ---- Cache ----------------------------------------------------------- */
  function readCache(key) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ time: Date.now(), data: data }));
    } catch (e) { /* private mode or storage full — just skip caching */ }
  }

  // Calls onData(data, fetchedAt) straight away with any cached copy, then
  // again with fresh data if the cache was missing or older than `minutes`
  // (a number, or a function of the cached data). The loader receives the
  // cached data so it can build on the previous result.
  function get(key, minutes, loader, onData, onError) {
    var cached = readCache(key);
    var data   = cached && cached.data;
    var maxAge = typeof minutes === 'function' ? minutes(data) : minutes;

    if (data) onData(data, cached.time);
    if (data && Date.now() - cached.time < maxAge * 60000) return;

    loader(data).then(function (data) {
      writeCache(key, data);
      onData(data, Date.now());
    }, function (err) {
      if (onError) onError(err, cached);
    });
  }

  return {
    freeCompany: function (onData, onError) {
      get('fc', CACHE_MINUTES, function () { return load(fcUrl(), parseFreeCompany); }, onData, onError);
    },
    members: function (onData, onError) {
      get('members', CACHE_MINUTES, function () { return load(fcUrl('member/'), parseMembers); }, onData, onError);
    },
    // The whole FC roster in one go (paged through internally), for the
    // Members page — which then paginates the display of it client-side.
    allMembers: function (onData, onError) {
      get('members-all', CACHE_MINUTES, function () { return loadAllMembers(); }, onData, onError);
    },
    // A single character's job levels, classified down to the three
    // booleans the Members page tags need. Cached per character.
    classJob: function (id, onData, onError) {
      get('classjob-' + id, CACHE_MINUTES, function () {
        return load(characterUrl(id), parseJobLevels).then(classifyJobLevels);
      }, onData, onError);
    },
    maintenance: function (onData, onError) {
      get('maintenance', NEWS_CACHE_MINUTES, function () { return fetchNews('maintenance').then(cleanMaintenance); }, onData, onError);
    }
  };
})();
