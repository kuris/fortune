/* ============================================================
   운세야 놀자! - 내 정보 & 운세 기록 계정 동기화 (fortune-sync.js)

   [이 파일이 하는 일]
     로그인하면 생년월일·음양력·성별·관심사·띠·별자리와 저장한 운세가
     계정에 보관되어, 폰에서 입력한 생일로 PC에서도 바로 운세가 열립니다.

   [기존 코드를 건드리지 않는 이유]
     script.js 는 2,500줄짜리 IIFE 이고 운세 계산 로직이 전부 들어 있습니다.
     그래서 이 파일은 script.js 를 수정하는 대신, script.js 가 이미 쓰고 있는
     localStorage 키를 "가로채서" 서버에도 함께 저장하는 방식으로 동작합니다.
     → 비로그인 사용자는 지금까지와 100% 동일하게 동작합니다.
        (서버 호출이 아예 일어나지 않습니다)

   의존성: cg-auth.js (window.CGAuth)
   ============================================================ */

(function () {
  'use strict';

  var SERVICE = 'fortune';

  // localStorage 키 → public.fortune_profile 컬럼
  var PROFILE_MAP = {
    'fortune_user_birth':    'birth_date',
    'fortune_user_calendar': 'calendar_type',
    'fortune_user_gender':   'gender',
    'fortune_user_focus':    'focus',
    'fortune_user_zodiac':   'favorite_zodiac'
  };
  var SAVED_KEY = 'fortune_saved_records';
  var PREFS_KEY = 'fortune_user_prefs';

  function CG() { return window.CGAuth || null; }
  function loggedIn() { return !!(CG() && CG().isLoggedIn()); }
  function warn(m, e) { try { console.warn('[운세 동기화] ' + m, e && (e.message || e)); } catch (_) {} }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var rawSetItem = localStorage.setItem.bind(localStorage);
  function lsSetRaw(k, v) { try { rawSetItem(k, v); } catch (e) {} }

  function parseJSON(s, fallback) {
    try { return JSON.parse(s); } catch (e) { return fallback; }
  }

  // 빈 문자열은 date 컬럼에 들어갈 수 없으므로 null 로 바꿉니다
  function orNull(v) {
    if (v == null) return null;
    v = String(v).trim();
    return v === '' ? null : v;
  }

  // ---------- 1) 내 정보 (생년월일 등) ----------
  function collectLocalProfile() {
    var row = {};
    for (var k in PROFILE_MAP) {
      if (!Object.prototype.hasOwnProperty.call(PROFILE_MAP, k)) continue;
      var v = orNull(lsGet(k));
      if (v !== null) row[PROFILE_MAP[k]] = v;
    }
    var prefs = parseJSON(lsGet(PREFS_KEY), {}) || {};
    if (prefs.favoriteZodiac) row.favorite_zodiac = prefs.favoriteZodiac;
    if (prefs.favoriteStar)   row.favorite_star   = prefs.favoriteStar;
    return row;
  }

  var pushTimer = null;
  function schedulePushProfile() {
    if (!loggedIn()) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushProfile, 800);
  }

  async function pushProfile() {
    if (!loggedIn()) return;
    var row = collectLocalProfile();
    if (!Object.keys(row).length) return;
    try {
      await CG().upsertRecord('fortune_profile', row, 'user_id');
    } catch (e) {
      warn('내 정보 저장 실패', e);
    }
  }

  // 서버 값을 기기와 화면에 반영합니다
  function applyProfileToLocal(row) {
    if (!row) return false;
    var changed = false;
    var inv = { birth_date: 'fortune_user_birth', calendar_type: 'fortune_user_calendar',
                gender: 'fortune_user_gender', focus: 'fortune_user_focus',
                favorite_zodiac: 'fortune_user_zodiac' };
    for (var col in inv) {
      if (!Object.prototype.hasOwnProperty.call(inv, col)) continue;
      var v = row[col];
      if (v === null || v === undefined || v === '') continue;
      if (lsGet(inv[col]) !== String(v)) { lsSetRaw(inv[col], String(v)); changed = true; }
    }
    var prefs = parseJSON(lsGet(PREFS_KEY), {}) || {};
    if (row.favorite_zodiac) prefs.favoriteZodiac = row.favorite_zodiac;
    if (row.favorite_star)   prefs.favoriteStar   = row.favorite_star;
    lsSetRaw(PREFS_KEY, JSON.stringify(prefs));
    return changed;
  }

  // 이미 그려진 입력 폼에 값을 채워 넣습니다 (페이지를 새로고침하지 않기 위해)
  function fillFormFromLocal() {
    try {
      var birth = lsGet('fortune_user_birth');
      var cal   = lsGet('fortune_user_calendar');
      var gen   = lsGet('fortune_user_gender');
      var foc   = lsGet('fortune_user_focus');

      var birthInput = document.getElementById('user-birthdate');
      if (birthInput && birth && !birthInput.value) birthInput.value = birth;

      var calSel = document.getElementById('user-calendar-type');
      if (calSel && cal) calSel.value = cal;

      function activate(groupId, val) {
        if (!val) return;
        var group = document.getElementById(groupId);
        if (!group) return;
        var pills = group.querySelectorAll('.option-pill');
        var hit = false;
        pills.forEach(function (p) {
          if (p.getAttribute('data-val') === val) hit = true;
        });
        if (!hit) return;
        pills.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-val') === val);
        });
      }
      activate('gender-pill-group', gen);
      activate('focus-pill-group', foc);
    } catch (e) {
      warn('입력값 채우기 실패', e);
    }
  }

  // ---------- 2) 저장한 운세 기록 ----------
  function localRecords() {
    var arr = parseJSON(lsGet(SAVED_KEY), []);
    return Array.isArray(arr) ? arr : [];
  }

  function recKey(r) {
    return [r.date || '', r.type || r.kind || '', r.title || ''].join('|');
  }

  async function syncRecords() {
    if (!loggedIn()) return;
    try {
      var remote = await CG().listRecords('fortune_logs', { orderBy: 'created_at', limit: 200 });
      var local = localRecords();

      var seen = {};
      remote.forEach(function (r) {
        seen[[r.created_at ? String(r.created_at).slice(0, 10) : '', r.kind || '', r.summary || ''].join('|')] = true;
      });

      // 서버 기록을 로컬 형식으로 바꿔 합칩니다
      var merged = local.slice();
      var localKeys = {};
      local.forEach(function (r) { localKeys[recKey(r)] = true; });

      remote.forEach(function (r) {
        var m = (r.result && typeof r.result === 'object') ? r.result : {};
        var row = {
          date: m.date || (r.created_at ? String(r.created_at).slice(0, 10) : ''),
          type: r.kind,
          title: m.title || r.summary || r.kind,
          summary: m.summary || r.summary || '',
          link: m.link || (r.kind + '.html'),
          timestamp: m.timestamp || (r.created_at ? new Date(r.created_at).getTime() : Date.now())
        };
        if (!localKeys[recKey(row)]) { merged.push(row); localKeys[recKey(row)] = true; }
      });

      merged.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      if (merged.length > 50) merged = merged.slice(0, 50);
      lsSetRaw(SAVED_KEY, JSON.stringify(merged));

      // 서버에 없는 로컬 기록을 올립니다
      var remoteKeys = {};
      remote.forEach(function (r) {
        var m = (r.result && typeof r.result === 'object') ? r.result : {};
        remoteKeys[[m.date || '', r.kind || '', m.title || ''].join('|')] = true;
      });
      for (var i = 0; i < local.length; i++) {
        var r0 = local[i];
        if (remoteKeys[recKey(r0)]) continue;
        await CG().saveRecord('fortune_logs', {
          kind: r0.type || 'today',
          key: r0.date || null,
          summary: r0.title || '',
          result: r0
        });
      }
    } catch (e) {
      warn('운세 기록 동기화 실패', e);
    }
  }

  async function pushOneRecord(rec) {
    if (!loggedIn() || !rec) return;
    try {
      await CG().saveRecord('fortune_logs', {
        kind: rec.type || 'today',
        key: rec.date || null,
        summary: rec.title || '',
        result: rec
      });
    } catch (e) {
      warn('운세 기록 저장 실패', e);
    }
  }

  // ---------- 3) localStorage 가로채기 ----------
  // script.js 가 값을 저장하는 순간을 붙잡아 서버에도 함께 보냅니다.
  // 관련 없는 키는 그대로 통과시키므로 다른 기능에 영향이 없습니다.
  var lastSavedLen = localRecords().length;
  try {
    localStorage.setItem = function (key, value) {
      rawSetItem(key, value);
      try {
        if (!loggedIn()) return;
        if (PROFILE_MAP[key] || key === PREFS_KEY) {
          schedulePushProfile();
        } else if (key === SAVED_KEY) {
          var arr = parseJSON(value, []);
          if (Array.isArray(arr) && arr.length > lastSavedLen) pushOneRecord(arr[0]);
          lastSavedLen = Array.isArray(arr) ? arr.length : lastSavedLen;
        }
      } catch (e) { /* 저장 자체는 이미 끝났으므로 무시 */ }
    };
  } catch (e) {
    warn('동기화 후크 설치 실패 - 로컬 저장만 사용합니다', e);
  }

  // ---------- 4) 최근 본 운세 ----------
  var PAGE_LABEL = {
    'today':  '오늘의 운세',
    'zodiac': '띠별 운세',
    'star':   '별자리 운세',
    'tarot':  '오늘의 타로',
    'love':   '연애운'
  };

  function currentPageKind() {
    var p = (location.pathname || '').toLowerCase();
    for (var k in PAGE_LABEL) {
      if (Object.prototype.hasOwnProperty.call(PAGE_LABEL, k) && p.indexOf(k) !== -1) return k;
    }
    return null;
  }

  function markVisited() {
    if (!loggedIn()) return;
    var kind = currentPageKind();
    if (!kind) return;
    CG().touchRecent({
      kind: 'fortune',
      id: kind,
      title: PAGE_LABEL[kind],
      url: kind + '.html'
    });
  }

  // ---------- 5) 로그인 시 서버 → 기기 반영 ----------
  var pulled = false;
  async function pullOnLogin() {
    if (!loggedIn() || pulled) return;
    pulled = true;
    try {
      var rows = await CG().listRecords('fortune_profile', { orderBy: 'updated_at', limit: 1 });
      var server = rows && rows[0];
      if (server) {
        if (applyProfileToLocal(server)) fillFormFromLocal();
        else fillFormFromLocal();
      } else {
        await pushProfile();   // 서버가 비어 있으면 이 기기 값을 올립니다
      }
      await syncRecords();
      if (window.CGAuth && CGAuth.refreshPanels) CGAuth.refreshPanels();
    } catch (e) {
      warn('로그인 동기화 실패', e);
    }
  }

  // ---------- 6) 「최근 본 운세」 패널 ----------
  function mountPanel() {
    var host = document.getElementById('fortune-recent');
    if (!host || !CG() || !CGAuth.mountRecentPanel) return;
    CGAuth.mountRecentPanel(host, {
      title: '📂 최근 본 운세',
      moreUrl: 'login.html',
      guestText: 'Google 로그인하면 생년월일을 다시 입력하지 않아도 되고, 저장한 운세를 어느 기기에서나 다시 볼 수 있어요.',
      emptyText: '아직 본 운세가 없어요. 오늘의 운세부터 확인해 보세요.',
      limit: 8,
      showFrequent: true,
      loader: async function () {
        var rows = await CGAuth.listRecent({ limit: 8 });
        return rows.map(function (r) {
          return {
            title: r.title || r.item_id,
            subtitle: r.hit_count > 1 ? (r.hit_count + '회') : '',
            url: r.url,
            updated_at: r.updated_at
          };
        });
      }
    });
  }

  // ---------- 7) 시작 ----------
  function start() {
    if (!CG()) return;
    mountPanel();
    CGAuth.onChange(function (s) {
      if (s.isLoggedIn) {
        pullOnLogin();
        markVisited();
      } else {
        pulled = false;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.FortuneSync = {
    pushProfile: pushProfile,
    syncRecords: syncRecords,
    fillFormFromLocal: fillFormFromLocal
  };
})();
