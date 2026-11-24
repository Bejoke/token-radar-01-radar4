// Token Radar dashboard (radar-4): renders window.RADAR with no network. Board, detail
// drawer with the five-multiplier breakdown, Not-a-launch, Live tokens, methodology.
// URL state for screenshots and sharing: ?detail=<slug>, ?category=, ?chain=, ?watchlist=1,
// ?band=mega|large|mid|small, ?sort=value|tvl|growth|age|name, ?tab=board|excluded|live|model.
(function () {
  'use strict';
  var R = window.RADAR;
  if (!R) { document.body.textContent = 'No radar data.'; return; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    if (n == null) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function moneyFull(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function pct(n) {
    if (n == null) return '—';
    var s = (n > 0 ? '+' : '') + n.toFixed(1) + '%';
    return '<span class="' + (n > 0 ? 'pos' : n < 0 ? 'neg' : '') + '">' + s + '</span>';
  }
  function age(n) {
    if (n == null) return '—';
    if (n < 30) return n + 'd';
    if (n < 365) return Math.round(n / 30) + 'mo';
    return (n / 365).toFixed(1) + 'y';
  }
  function $(id) { return document.getElementById(id); }

  var watch = {};
  R.watchlist.forEach(function (s) { watch[s] = true; });

  /* stats strip */
  var total = R.rows.reduce(function (a, r) { return a + r.implied_value_usd; }, 0);
  $('stats').innerHTML =
    '<div><dt>Protocols scanned</dt><dd>758</dd></div>' +
    '<div><dt>Ranked pre-token</dt><dd>' + R.board_size + '</dd></div>' +
    '<div><dt>Watchlist</dt><dd>' + R.watchlist_size + '</dd></div>' +
    '<div><dt>Not a launch</dt><dd>' + R.excluded_size + '</dd></div>' +
    '<div><dt>Total implied value</dt><dd>' + money(total) + '</dd></div>';

  /* movers strip */
  $('movers').innerHTML = '<h2>Fastest rising this week</h2>' + R.movers.map(function (m) {
    return '<div class="mover"><b>' + esc(m.name) + '</b><span class="up">' + pct(m.change_7d) +
      '</span> <span>· rank #' + m.rank + ' · ' + money(m.tvl_usd) + ' TVL</span></div>';
  }).join('');

  /* tabs */
  var tabs = document.querySelectorAll('.tabs button');
  function showTab(name) {
    tabs.forEach(function (b) {
      var on = b.getAttribute('data-tab') === name;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + name; });
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); }); });

  /* filter controls */
  var cats = {}, chains = {};
  R.rows.forEach(function (r) {
    if (r.category) cats[r.category] = 1;
    r.chains.forEach(function (c) { chains[c] = 1; });
  });
  Object.keys(cats).sort().forEach(function (c) {
    var o = document.createElement('option'); o.value = c; o.textContent = c; $('category').appendChild(o);
  });
  Object.keys(chains).sort().forEach(function (c) {
    var o = document.createElement('option'); o.value = c; o.textContent = c; $('chain').appendChild(o);
  });

  var state = { q: '', category: '', chain: '', band: '', watchlist: false, sort: 'value' };
  var params = new URLSearchParams(window.location.search);
  if (params.get('category')) { state.category = params.get('category'); $('category').value = state.category; }
  if (params.get('chain')) { state.chain = params.get('chain'); $('chain').value = state.chain; }
  if (params.get('band')) { state.band = params.get('band'); $('band').value = state.band; }
  if (params.get('watchlist') === '1') { state.watchlist = true; $('watchlist').checked = true; }
  if (params.get('sort')) { state.sort = params.get('sort'); $('sort').value = state.sort; }
  if (params.get('tab')) showTab(params.get('tab'));

  function bandOf(r) {
    if (r.tvl_usd >= 1e9) return 'mega';
    if (r.tvl_usd >= 1e8) return 'large';
    if (r.tvl_usd >= 1e7) return 'mid';
    return 'small';
  }
  function filtered() {
    var q = state.q.trim().toLowerCase();
    var rows = R.rows.filter(function (r) {
      if (state.category && r.category !== state.category) return false;
      if (state.chain && r.chains.indexOf(state.chain) < 0) return false;
      if (state.band && bandOf(r) !== state.band) return false;
      if (state.watchlist && !watch[r.slug]) return false;
      if (q && (r.name + ' ' + r.slug + ' ' + (r.category || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var s = state.sort;
    rows.sort(function (a, b) {
      if (s === 'tvl') return b.tvl_usd - a.tvl_usd;
      if (s === 'growth') return (b.change_7d == null ? -1e9 : b.change_7d) - (a.change_7d == null ? -1e9 : a.change_7d);
      if (s === 'age') return (b.age_days == null ? -1 : b.age_days) - (a.age_days == null ? -1 : a.age_days);
      if (s === 'name') return a.name < b.name ? -1 : 1;
      return b.implied_value_usd - a.implied_value_usd;
    });
    return rows;
  }

  function renderBoard() {
    var rows = filtered();
    $('count').textContent = rows.length + ' of ' + R.rows.length + ' ranked protocols';
    $('rows').innerHTML = rows.map(function (r) {
      return '<tr data-slug="' + esc(r.slug) + '">' +
        '<td class="num">' + r.rank + '</td>' +
        '<td>' + esc(r.name) + (watch[r.slug] ? '<span class="badge">WATCHLIST</span>' : '') + '</td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.slice(0, 2).join(', ')) + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + age(r.age_days) + '</td>' +
        '<td class="num"><b>' + money(r.implied_value_usd) + '</b></td></tr>';
    }).join('');
  }

  /* detail drawer */
  function barRow(label, mult, max) {
    var w = Math.max(2, Math.min(100, (mult / max) * 100));
    return '<div class="bar-row"><span class="lbl">' + label + '</span>' +
      '<span class="bar-track"><span class="bar-fill" style="width:' + w.toFixed(0) + '%"></span></span>' +
      '<span class="val">' + mult.toFixed(2) + '×</span></div>';
  }
  function openDetail(slug) {
    var r = null;
    R.rows.forEach(function (x) { if (x.slug === slug) r = x; });
    var d = $('detail');
    if (!r) { d.hidden = true; d.innerHTML = ''; return; }
    var b = (r.tvl_usd * r.category_multiple * r.sector_multiple * r.growth_multiplier * r.maturity_multiplier * r.chain_multiplier);
    d.innerHTML =
      '<button type="button" class="close" id="detail-close">Close</button>' +
      '<h3>#' + r.rank + ' · ' + esc(r.name) + (watch[r.slug] ? '<span class="badge">WATCHLIST</span>' : '') + '</h3>' +
      '<p class="sub">' + esc(r.category || 'Uncategorised') + ' · ' + esc(r.chains.join(', ')) +
      ' · listed ' + (r.listed_at || 'date unknown') + ' · records no token</p>' +
      '<div class="grid">' +
      '<div class="cell"><dt>Implied value</dt><dd>' + moneyFull(r.implied_value_usd) + '</dd></div>' +
      '<div class="cell"><dt>TVL</dt><dd>' + money(r.tvl_usd) + '</dd></div>' +
      '<div class="cell"><dt>7-day change</dt><dd>' + pct(r.change_7d) + '</dd></div>' +
      '<div class="cell"><dt>Age with no token</dt><dd>' + age(r.age_days) + '</dd></div>' +
      '</div>' +
      '<h4>Why this value — the five multipliers</h4><div class="bars">' +
      barRow('Category (' + r.category_peers + ' peer' + (r.category_peers === 1 ? '' : 's') + ')', r.category_multiple, 1) +
      barRow('Sector momentum', r.sector_multiple, 1.1) +
      barRow('Growth (7d)', r.growth_multiplier, 1.55) +
      barRow('Maturity (age)', r.maturity_multiplier, 1) +
      barRow('Breadth (chains)', r.chain_multiplier, 1.2) +
      '</div>' +
      '<p class="sub">TVL ' + money(r.tvl_usd) + ' × ' + r.category_multiple.toFixed(2) + ' × ' +
      r.sector_multiple.toFixed(2) + ' × ' + r.growth_multiplier.toFixed(2) + ' × ' +
      r.maturity_multiplier.toFixed(2) + ' × ' + r.chain_multiplier.toFixed(2) + ' = ' +
      moneyFull(Math.round(b)) + ' before rounding.</p>' +
      '<h4>Farm plan — seven steps</h4><ol class="steps">' +
      r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="budget">Plan budget: <b>$' + r.farm_budget_usd + ' total</b> ($' +
      (r.farm_budget_usd - r.farm_gas_usd) + ' capital + $' + r.farm_gas_usd + ' gas) · hold at least <b>' +
      r.farm_time_days + ' days</b>.</p>';
    d.hidden = false;
    $('detail-close').addEventListener('click', function () { d.hidden = true; d.innerHTML = ''; });
    d.scrollIntoView({ block: 'start' });
  }
  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr');
    if (tr) openDetail(tr.getAttribute('data-slug'));
  });
  document.querySelectorAll('#board th[data-sort]').forEach(function (th) {
    th.style.cursor = 'pointer';
    th.addEventListener('click', function () {
      state.sort = th.getAttribute('data-sort');
      $('sort').value = state.sort;
      document.querySelectorAll('#board th').forEach(function (x) { x.classList.remove('sorted'); });
      th.classList.add('sorted');
      renderBoard();
    });
  });

  /* controls */
  $('q').addEventListener('input', function () { state.q = $('q').value; renderBoard(); });
  $('category').addEventListener('change', function () { state.category = $('category').value; renderBoard(); });
  $('chain').addEventListener('change', function () { state.chain = $('chain').value; renderBoard(); });
  $('band').addEventListener('change', function () { state.band = $('band').value; renderBoard(); });
  $('watchlist').addEventListener('change', function () { state.watchlist = $('watchlist').checked; renderBoard(); });
  $('sort').addEventListener('change', function () { state.sort = $('sort').value; renderBoard(); });

  /* excluded view */
  $('exrows').innerHTML = R.excluded.map(function (x) {
    return '<tr><td>' + esc(x.name) + '</td><td>' + esc(x.category || '—') + '</td>' +
      '<td class="num">' + money(x.tvl_usd) + '</td><td class="wrapcell">' + esc(x.reason) + '</td></tr>';
  }).join('');

  /* live view */
  $('liverows').innerHTML = R.live.map(function (x) {
    return '<tr><td>' + esc(x.name) + '</td><td>' + esc(x.category || '—') + '</td>' +
      '<td class="num">' + money(x.tvl_usd) + '</td><td class="num">' + money(x.mcap_usd) + '</td>' +
      '<td class="num">' + (x.mcap_per_tvl == null ? '—' : x.mcap_per_tvl.toFixed(2) + '×') + '</td>' +
      '<td class="num">' + pct(x.change_7d) + '</td></tr>';
  }).join('');

  /* peer table */
  $('peerrows').innerHTML = R.peers.map(function (p) {
    return '<tr><td>' + esc(p.category) + '</td><td class="num">' + p.peers + '</td>' +
      '<td class="num">' + p.median.toFixed(2) + '×</td><td class="num">' + p.multiple.toFixed(2) + '×</td>' +
      '<td class="num">' + pct(p.sector_median_7d) + '</td></tr>';
  }).join('');

  renderBoard();
  var detailSlug = params.get('detail');
  if (params.get('shot') === 'detail') document.body.classList.add('shot-detail');
  if (detailSlug) openDetail(detailSlug);
})();
