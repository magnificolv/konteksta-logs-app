(function() {
  'use strict';

  /* ─── Constants ─────────────────────────────────────────────────── */
  var STORAGE_KEY = 'kontekstalogas-data';
  var APP_VERSION = '1.6.16';
  var BUILD_ENV = (function() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return '🧪 dev';
    if (location.hostname.includes('tail')) return '🧪 beta';
    return '🚀 production';
  })();
  var BUILD_HASH = 'dev'; // auto-updated on deploy
  var TOKEN_KEY = 'kontekstalogas-gh-token';
  var DELETED_KEY = 'kontekstalogas-deleted';
  var SERVER_URL = 'http://localhost:8765';
  var GH_OWNER = 'magnificolv';
  var GH_REPO = 'kontesksta-logs-standalone';
  var GH_BRANCH = 'master';
  var GH_RAW_URL = 'https://raw.githubusercontent.com/' + GH_OWNER + '/' + GH_REPO + '/' + GH_BRANCH + '/data.json';
  var GH_PROXY_URL = 'https://kontekstalogas-gh-proxy.magnificox.workers.dev';

  /* ─── Icon Pack (Grok Imagine emoji replacements) ─────────────── */
  var ICON_PACK = [
    {id:'ai',label:'AI'},{id:'anchor',label:'Enkurs'},{id:'archive',label:'Arhīvs'},{id:'atom',label:'Atoms'},
    {id:'balloon',label:'Balons'},{id:'basketball',label:'Basketbols'},{id:'battery',label:'Enerģija'},{id:'bike',label:'Velosipēds'},
    {id:'books',label:'Grāmatas'},{id:'brush',label:'Ota'},{id:'cake',label:'Kūka'},{id:'calendar',label:'Kalendārs'},
    {id:'camera',label:'Media'},{id:'candle',label:'Svece'},{id:'castle',label:'Pils'},{id:'cat',label:'Kaķis'},
    {id:'chat',label:'Čats'},{id:'chess',label:'Šahs'},{id:'clock',label:'Laiks'},{id:'cloud',label:'Mākonis'},
    {id:'code',label:'Kods'},{id:'coffee',label:'Kafija'},{id:'compass',label:'Kompass'},{id:'crown',label:'Kronis'},
    {id:'crystalball',label:'Kristāla bumba'},{id:'diamond',label:'Dimants'},{id:'dice',label:'Kauliņi'},{id:'dna',label:'DNS'},
    {id:'dragon',label:'Pūķis'},{id:'family',label:'Ģimene'},{id:'film',label:'Filmas'},{id:'fire',label:'Uguns'},
    {id:'fish',label:'Zivs'},{id:'fitness',label:'Sports'},{id:'flask',label:'Kolba'},{id:'flower',label:'Zieds'},
    {id:'food',label:'Ēdiens'},{id:'football',label:'Futbols'},{id:'fox',label:'Lapsa'},{id:'game',label:'Spēles'},
    {id:'gemini',label:'Dvīņi'},{id:'gift',label:'Dāvana'},{id:'goals',label:'Mērķi'},{id:'guitar',label:'Ģitāra'},
    {id:'headphones',label:'Austiņas'},{id:'health',label:'Veselība'},{id:'helicopter',label:'Helikopters'},{id:'home',label:'Māja'},
    {id:'hotair',label:'Gaisa balons'},{id:'hourglass',label:'Smilšu pulkstenis'},{id:'idea',label:'Ideja'},{id:'key',label:'Atslēga'},
    {id:'learn',label:'Mācības'},{id:'lightning',label:'Zibens'},{id:'lock',label:'Privāts'},{id:'love',label:'Mīlestība'},
    {id:'magnifier',label:'Lupa'},{id:'map',label:'Karte'},{id:'mic',label:'Mikrofons'},{id:'mind',label:'Prāts'},
    {id:'money',label:'Nauda'},{id:'moon',label:'Miegs'},{id:'mountain',label:'Kalns'},{id:'mtb',label:'Kalnu ritenis'},
    {id:'music',label:'Mūzika'},{id:'nature',label:'Daba'},{id:'notes',label:'Piezīmes'},{id:'owl',label:'Pūce'},
    {id:'palette',label:'Palete'},{id:'party',label:'Ballīte'},{id:'people',label:'Cilvēki'},{id:'pet',label:'Mīlulis'},
    {id:'phoenix',label:'Fēnikss'},{id:'phone',label:'Tel'},{id:'piano',label:'Klavieres'},{id:'pizza',label:'Pica'},
    {id:'polaroid',label:'Polaroid'},{id:'potion',label:'Eliksīrs'},{id:'puzzle',label:'Puzle'},{id:'robot',label:'Robots'},
    {id:'rocket',label:'Projekti'},{id:'satellite',label:'Satelīts'},{id:'shield',label:'Vairogs'},{id:'ship',label:'Kuģis'},
    {id:'shop',label:'Iepirkumi'},{id:'skate',label:'Skeitbords'},{id:'snowflake',label:'Sniegpārsla'},{id:'speed',label:'Ātrums'},
    {id:'star',label:'Favorīti'},{id:'submarine',label:'Zemūdene'},{id:'sun',label:'Saule'},{id:'surf',label:'Sērfings'},
    {id:'sword',label:'Zobens'},{id:'telescope',label:'Teleskops'},{id:'tent',label:'Telts'},{id:'tools',label:'Rīki'},
    {id:'train',label:'Vilciens'},{id:'travel',label:'Ceļojumi'},{id:'tree',label:'Koks'},{id:'trophy',label:'Sasniegumi'},
    {id:'ufo',label:'NLO'},{id:'umbrella',label:'Lietussargs'},{id:'unicorn',label:'Vienradzis'},{id:'water',label:'Ūdens'},
    {id:'window',label:'Logs'},{id:'wolf',label:'Vilks'},{id:'work',label:'Darbs'},{id:'yoga',label:'Joga'},
    {id:'conductor',label:'Konduktors'},
    {id:'railway',label:'Sliedes'},
    {id:'ticket',label:'Biļete'},
    {id:'caduceus',label:'Hermes'},
    {id:'neural',label:'Neirons'},
    {id:'copilot',label:'Copilot'},
    {id:'highfive',label:'High five'},
    {id:'cheers',label:'Cheers'},
    {id:'bracelet',label:'Draudzība'},
    {id:'wallet',label:'Maks'},
    {id:'creditcard',label:'Karte'},
    {id:'piggy',label:'Krājkasīte'},
    {id:'baby',label:'Bērns'},
    {id:'rings',label:'Gredzeni'},
    {id:'househeart',label:'Mājas sirds'},
    {id:'racecar',label:'Sacīkšu auto'},
    {id:'steering',label:'Stūre'},
    {id:'helmet',label:'Ķivere'},
    {id:'temple',label:'Templis'},
    {id:'incense',label:'Vīraks'},
    {id:'om',label:'Om'},
    {id:'grapes',label:'Vīnogas'},
    {id:'cottage',label:'Mājiņa'},
    {id:'river',label:'Upe'},
    {id:'laptop',label:'Portatīvais'},
    {id:'server',label:'Serveris'},
    {id:'wifi',label:'Wi‑Fi'},
    {id:'journal',label:'Dienasgrāmata'},
    {id:'pen',label:'Pildspalva'},
    {id:'sticky',label:'Līmlapiņa'},
    {id:'cart',label:'Ratiņi'},
    {id:'basket',label:'Grozs'},
    {id:'receipt',label:'Čeks'},
    {id:'checklist',label:'Saraksts'},
    {id:'kanban',label:'Kanban'},
    {id:'target',label:'Mērķis'},
    {id:'meditate',label:'Meditācija'},
    {id:'meditate2',label:'Meditācija 2'},
    {id:'agentbot',label:'AI aģents'},
    {id:'agentbadge',label:'Agent badge'},
    {id:'agentcube',label:'AI companion'},
    {id:'friendshug',label:'Draugu apskāviens'},
    {id:'friendslaugh',label:'Smiekli'},
    {id:'friendscoffee',label:'Kafija ar draugiem'},
    {id:'uifocus',label:'Fokuss'},
    {id:'uisoon',label:'Drīz'},
    {id:'uiidea',label:'Ideja'},
    {id:'uifolder',label:'Mape'},
    {id:'uifile',label:'Fails'},
    {id:'uiedit',label:'Rediģēt'},
    {id:'uitrash',label:'Dzēst'},
    {id:'uigear',label:'Iestatījumi'},
    {id:'uisave',label:'Saglabāt'},
    {id:'uiadd',label:'Pievienot'}
  ];
  var CLASSIC_EMOJIS = [
    '📝','📄','📋','📌','📎','📁','📂','🗂️',
    '📅','📆','⏰','🔔','🔒','🔓','🔑','🔧',
    '💡','💭','💬','🗨️','💼','📊','📈','📉',
    '🎯','🎨','🎬','🎮','🎲','🎭','🎪','🎤',
    '🏠','🏢','🏫','🏥','🏦','🏪','🏗️','🏔️',
    '❤️','💙','💚','💛','💜','🧡','🖤','🤍',
    '⭐','🌟','✨','🔥','💧','🌈','🌍','🌱',
    '🚀','✈️','🚗','🚲','🚢','🚃','🛸','🛵',
    '👤','👥','🤝','👨‍👩‍👧‍👦','💑','🎉','🎊','🏆'
  ];
  var _iconPickerMode = 'modern'; // modern | emoji

  function isPackIcon(icon) {
    return typeof icon === 'string' && icon.indexOf('pack:') === 0;
  }

  function packIconPath(icon) {
    return 'icons/pack/' + String(icon).slice(5) + '.png';
  }

  function packIconLabel(icon) {
    if (!isPackIcon(icon)) return '';
    var id = String(icon).slice(5);
    for (var i = 0; i < ICON_PACK.length; i++) {
      if (ICON_PACK[i].id === id) return ICON_PACK[i].label;
    }
    return id;
  }

  /** HTML for tab cards / titles. Safe escaped. */
  function renderIconHtml(icon) {
    var ic = icon || '📄';
    if (isPackIcon(ic)) {
      return '<img class="pack-icon" src="' + escAttr(packIconPath(ic)) + '" alt="' + escAttr(packIconLabel(ic) || 'icon') + '" draggable="false">';
    }
    return escHtml(ic);
  }

  /** Plain fallback for markdown headings (no pack: ids in text). */

  /** Small UI pack icon <img> for chrome buttons */
  function uiIconHtml(id, cls) {
    var c = cls ? ('ui-icon ' + cls) : 'ui-icon';
    return '<img class="' + c + '" src="icons/pack/' + id + '.png" width="20" height="20" alt="" draggable="false">';
  }

  /** Section heading: map legacy emoji headings → modern pack icons */
  function renderSectionHeadingHtml(raw) {
    var h = String(raw || '').trim();
    var icon = null;
    var label = h;

    if (/šobrīd\s*svarīg/i.test(h) || /^🎯/.test(h)) {
      icon = 'uifocus';
      label = 'Šobrīd svarīgi';
    } else if (/tuvākaj/i.test(h) || /^⏰/.test(h) || /^⌚/.test(h)) {
      icon = 'uisoon';
      label = 'Tuvākajā laikā';
    } else if (/piezīmes|idejas/i.test(h) || /^💡/.test(h)) {
      icon = 'uiidea';
      label = 'Piezīmes / Idejas';
    } else {
      // Drop a leading emoji token (non-word) if present
      var m = h.match(/^(\S+)\s+(.+)$/);
      if (m && !/[A-Za-zĀČĒĢĪĶĻŅŠŪŽāčēģīķļņšūž0-9]/.test(m[1])) {
        label = m[2];
      }
    }

    if (icon) {
      return '<span class="section-h-with-icon">' + renderIconHtml('pack:' + icon) +
        '<span class="section-h-text">' + escHtml(label) + '</span></span>';
    }
    return escHtml(label);
  }

  function iconForMarkdown(icon) {
    if (isPackIcon(icon)) return '✨';
    return icon || '📄';
  }

  function setIconPreview(icon) {
    var preview = document.getElementById('emojiPreview');
    if (!preview) return;
    preview.innerHTML = renderIconHtml(icon || '📝');
  }

  function clearIconPickerSelection() {
    var root = document.getElementById('emojiPicker');
    if (!root) return;
    root.querySelectorAll('.emoji-picker-btn').forEach(function(b) {
      b.classList.remove('selected');
    });
  }

  function highlightIconInPicker(icon) {
    clearIconPickerSelection();
    if (!icon) return;
    var root = document.getElementById('emojiPicker');
    if (!root) return;
    root.querySelectorAll('.emoji-picker-btn').forEach(function(b) {
      if (b.getAttribute('data-icon') === icon) b.classList.add('selected');
    });
  }

  function applyIconSelection(value) {
    var iconInput = document.getElementById('editIcon');
    if (iconInput) iconInput.value = value;
    setIconPreview(value);
    highlightIconInPicker(value);
  }

  var _apiAvailable = null; // null = nav pārbaudīts, true/false
  var _saveTimer = null;    // debounce priekš servera saglabāšanas

  var INITIAL_DATA_JSON = '{"version": 1, "tabs": [{"id": "piemers", "name": "Piem\u0113rs", "color": "#6366f1", "icon": "\ud83d\udcdd", "description": "Tavs pirmais konteksta logs. Redi\u0123\u0113 vai izdz\u0113s!", "summary": "# \ud83d\udcdd Tavs pirmais tabs\\n\\n## \ud83c\udfaf \u0160obr\u012bd svar\u012bgi\\n\\n- [ ] Izm\u0113\u0123ini pievienot ierakstu\\n- [ ] Nospied \u2601\ufe0f Push lai saglab\u0101tu GitHub\\n\\n## \u23f0 Tuv\u0101kaj\u0101 laik\u0101\\n\\n\\n## \ud83d\udca1 Piez\u012bmes / Idejas\\n", "files": [], "updated": "2026-05-27"}]}';

  var currentTabId = null;
  var _editingTabId = null;
  var _tempBgImage = null;

  /* ─── Helper Functions ──────────────────────────────────────────── */

  function escHtml(text) {
    if (typeof text !== 'string') return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function escAttr(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    var d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function generateId() {
    return 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
  }

  function getDefaultData() {
    return { version: 1, tabs: [] };
  }

  function showModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function hideModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  /* ─── Core App ──────────────────────────────────────────────────── */

  var app = {};

  app.loadData = function() {
    // If data was already loaded from server this session, use cached
    // Otherwise, localStorage is the immediate source, server syncs in background
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {
      console.warn('Failed to parse localStorage data:', e);
    }
    return getDefaultData();
  };

  app.loadDataAsync = function(callback) {
    // Telefons/remote: VIENMĒR localStorage (nekad no PC servera — būtu stale)
    var isLocalPC = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocalPC) {
      var localData = app.loadData();
      if (localData.tabs && localData.tabs.length > 0) {
        callback(localData);
      } else {
        // Pirmā palaišana — tukša, pull no Git būs manuāli
        callback(getDefaultData());
      }
      return;
    }

    // PC: mēģina no servera, tad localStorage
    if (_apiAvailable === true) {
      _fetchFromServer(callback);
    } else if (_apiAvailable === null) {
      _checkApi(function(available) {
        if (available) {
          _fetchFromServer(callback);
        } else {
          _fetchDataJson(callback);
        }
      });
    } else {
      _fetchDataJson(callback);
    }
  };

  function _fetchDataJson(callback) {
    // Mēģina ielādēt data.json — der GitHub Pages vai tiešai atvēršanai
    fetch('data.json', { cache: 'no-cache' })
      .then(function(res) {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(function(data) {
        if (data && data.tabs) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
          callback(data);
        } else {
          callback(app.loadData());
        }
      })
      .catch(function() {
        // Fallback: localStorage → default
        callback(app.loadData());
      });
  }

  function _fetchFromServer(callback) {
    fetch(SERVER_URL + '/api/data', { cache: 'no-cache' })
      .then(function(res) {
        if (!res.ok) throw new Error('Server returned ' + res.status);
        return res.json();
      })
      .then(function(data) {
        if (data && data.tabs) {
          // Saglabā arī localStorage kā backup
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
          callback(data);
        } else {
          callback(app.loadData());
        }
      })
      .catch(function() {
        _apiAvailable = false;
        callback(app.loadData());
      });
  }

  function _checkApi(callback) {
    fetch(SERVER_URL + '/api/data', { method: 'HEAD', cache: 'no-cache' })
      .then(function(res) {
        _apiAvailable = res.ok;
        callback(res.ok);
      })
      .catch(function() {
        _apiAvailable = false;
        callback(false);
      });
  }

  app.saveData = function(data) {
    if (!data) data = app.loadData();

    // Vienmēr saglabā localStorage kā backup
    try {
      var jsonStr = JSON.stringify(data);
      var sizeMB = jsonStr.length / (1024 * 1024);
      if (sizeMB > 4.5) {
        alert('⚠️ Datu apjoms pārāk liels (' + sizeMB.toFixed(1) + 'MB)! Lokālās bildes aizņem pārāk daudz vietas. Izmanto URL bildes vai izdēs dažus tabus.');
        return false;
      }
      localStorage.setItem(STORAGE_KEY, jsonStr);
    } catch(e) {
      alert('⚠️ Neizdevās saglabāt! Iespējams, pārāk liela bilde. Izmanto URL vai mazāku bildi.');
      console.error('saveData localStorage error:', e);
    }

    // Debounced save uz serveri (tikai ja esam uz PC localhost)
    var isLocalPC = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocalPC && _apiAvailable !== false) {
      _saveToServer(data);
    }
    return true;
  };

  function _saveToServer(data) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function() {
      fetch(SERVER_URL + '/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (result.ok) _apiAvailable = true;
        console.log('💾 Server save:', result.ok ? 'OK' : 'FAIL');
      })
      .catch(function(err) {
        console.warn('⚠️ Server save failed, using localStorage only:', err.message);
        _apiAvailable = false;
      });
    }, 500);
  }

  app.renderAll = function() {
    var loader = document.getElementById('windowLoader');
    if (loader) loader.style.display = 'none';
    app.renderTabs();
    app.updateTimestamps();
  };

  app.updateTimestamps = function() {
    var els = document.querySelectorAll('[data-timestamp]');
    els.forEach(function(el) {
      var ts = el.getAttribute('data-timestamp');
      if (ts) el.textContent = formatDate(ts);
    });
  };

  /* ─── Tab Grid — Flask stilā ──────────────────────────────────── */

  app.renderTabs = function() {
    var grid = document.getElementById('tabGrid');
    if (!grid) return;
    var data = app.loadData();
    var html = data.tabs.map(function(tab, index) {
      var hasImage = !!(tab.image && String(tab.image).length > 0);
      var color = escAttr(tab.color || '#6366f1');
      var id = escAttr(tab.id);
      var name = escHtml(tab.name || 'Untitled');
      var classes = 'tab-card' + (hasImage ? ' has-image' : '');
      var style = '--tab-color: ' + color;
      if (hasImage) {
        // Single-quoted CSS url() so outer HTML style="..." stays valid
        var safeBg = String(tab.image)
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/\)/g, '\\)')
          .replace(/\n/g, '')
          .replace(/\r/g, '');
        style += "; --tab-bg-image: url('" + safeBg + "')";
      }
      return '<div class="' + classes + '" style="' + style + '" onclick="app.openTab(\'' + id + '\')" data-tab-id="' + id + '" data-tab-index="' + index + '" draggable="true">' +
        '<div class="tab-card-body">' +
          '<div class="tab-card-icon">' + renderIconHtml(tab.icon || '📄') + '</div>' +
          '<div class="tab-card-title">' + name + '</div>' +
        '</div>' +
        '<div class="tab-drag-handle" title="Vilkt lai pārkārtotu">⠿</div>' +
      '</div>';
    }).join('');
    grid.innerHTML = html;
  };

  /* ─── Tab Drag & Drop ──────────────────────────────────────────── */

  var _tabDragData = null; // { tabId, sourceIndex }
  var _tabWasDragged = false; // prevent click after drag

  app._handleTabDragStart = function(e) {
    var card = e.target.closest('.tab-card');
    if (!card) return;
    // Don't start drag if clicking buttons/inputs inside
    if (e.target.closest('button, input, a')) return;

    var tabId = card.getAttribute('data-tab-id');
    var sourceIndex = parseInt(card.getAttribute('data-tab-index'));
    _tabDragData = { tabId: tabId, sourceIndex: sourceIndex };

    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);

    // Create a semi-transparent clone as drag image
    var clone = card.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.opacity = '0.7';
    clone.style.width = card.offsetWidth + 'px';
    clone.style.transform = 'none';
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, 20);
    setTimeout(function() { document.body.removeChild(clone); }, 0);
  };

  app._handleTabDragOver = function(e) {
    e.preventDefault();
    if (!_tabDragData) return;
    e.dataTransfer.dropEffect = 'move';

    // Clear previous indicators
    var prev = document.querySelector('.tab-drop-indicator');
    if (prev) prev.remove();

    var card = e.target.closest('.tab-card');
    if (!card || card.classList.contains('dragging')) return;

    var rect = card.getBoundingClientRect();
    var midX = rect.left + rect.width / 2;
    var midY = rect.top + rect.height / 2;
    var after = false;

    // Determine if dropping before or after based on drag direction
    if (Math.abs(e.clientX - midX) > Math.abs(e.clientY - midY)) {
      after = e.clientX > midX;
    } else {
      after = e.clientY > midY;
    }

    var indicator = document.createElement('div');
    indicator.className = 'tab-drop-indicator';
    if (after) {
      card.after(indicator);
    } else {
      card.before(indicator);
    }
  };

  app._handleTabDragLeave = function(e) {
    // Only remove indicator when truly leaving the grid
    if (!e.target.closest('#tabGrid')) {
      var prev = document.querySelector('.tab-drop-indicator');
      if (prev) prev.remove();
    }
  };

  app._handleTabDrop = function(e) {
    e.preventDefault();
    var indicator = document.querySelector('.tab-drop-indicator');
    if (indicator) indicator.remove();

    var card = document.querySelector('.tab-card.dragging');
    if (card) card.classList.remove('dragging');

    if (!_tabDragData) return;

    var dropCard = e.target.closest('.tab-card');
    if (!dropCard || dropCard.classList.contains('dragging')) {
      _tabDragData = null;
      return;
    }

    var targetIndex = parseInt(dropCard.getAttribute('data-tab-index'));
    var sourceId = _tabDragData.tabId;
    var sourceIndex = _tabDragData.sourceIndex;
    _tabDragData = null;

    if (sourceIndex === targetIndex) return;

    _tabWasDragged = true;

    var data = app.loadData();
    var tabs = data.tabs;

    // Determine insert position
    var rect = dropCard.getBoundingClientRect();
    var midY = rect.top + rect.height / 2;
    var midX = rect.left + rect.width / 2;
    var insertAfter = (Math.abs(e.clientX - midX) > Math.abs(e.clientY - midY))
      ? e.clientX > midX
      : e.clientY > midY;

    // Find the dragged tab
    var draggedTab = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === sourceId) {
        draggedTab = tabs.splice(i, 1)[0];
        break;
      }
    }
    if (!draggedTab) return;

    // Recalculate target (array may have shifted)
    var insertIdx = insertAfter ? targetIndex + 1 : targetIndex;
    if (sourceIndex < insertIdx) insertIdx--; // adjustment after removal

    tabs.splice(insertIdx, 0, draggedTab);
    data.updated = new Date().toISOString();
    app.saveData(data);
    app.renderTabs();
    app.updateTimestamps();
  };

  app._handleTabDragEnd = function(e) {
    var card = document.querySelector('.tab-card.dragging');
    if (card) card.classList.remove('dragging');
    var indicator = document.querySelector('.tab-drop-indicator');
    if (indicator) indicator.remove();
    _tabDragData = null;
  };

  /* ─── Item Drag & Drop (starp sekcijām) ───────────────────────── */

  var _itemDragData = null; // { sourceSection, itemEl }

  app._handleItemDragStart = function(e) {
    var item = e.target.closest('.section-item');
    if (!item) return;
    // Don't start drag from inputs/buttons
    if (e.target.closest('input, textarea, button')) {
      e.preventDefault();
      return;
    }

    var sourceSection = item.closest('.section-block');
    if (!sourceSection) return;

    _itemDragData = {
      sourceSection: sourceSection,
      itemEl: item
    };

    item.classList.add('item-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'item');

    // Create a semi-transparent clone as drag image for visual feedback
    var clone = item.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.opacity = '0.7';
    clone.style.width = item.offsetWidth + 'px';
    clone.style.transform = 'none';
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, 20);
    setTimeout(function() { document.body.removeChild(clone); }, 0);
  };

  app._handleItemDragOver = function(e) {
    if (!_itemDragData) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Find the target section-items container
    var sectionBlock = e.target.closest('.section-block');
    if (!sectionBlock) return;

    var itemsContainer = sectionBlock.querySelector('.section-items');
    if (!itemsContainer) return;

    // Remove previous indicators
    var prev = document.querySelector('.item-drop-indicator');
    if (prev) prev.remove();

    // Don't show indicator if same as source and only one item
    if (sectionBlock === _itemDragData.sourceSection &&
        itemsContainer.querySelectorAll('.section-item:not(.item-dragging)').length === 0) {
      return;
    }

    // Find insert position
    var items = itemsContainer.querySelectorAll('.section-item:not(.item-dragging)');
    var indicator = document.createElement('div');
    indicator.className = 'item-drop-indicator';

    if (items.length === 0) {
      itemsContainer.appendChild(indicator);
      return;
    }

    // Find the closest item to cursor
    var closestItem = null;
    var closestDist = Infinity;
    items.forEach(function(item) {
      var rect = item.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      var dist = Math.abs(e.clientY - midY);
      if (dist < closestDist) {
        closestDist = dist;
        closestItem = item;
      }
    });

    if (closestItem) {
      var rect = closestItem.getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      if (e.clientY > midY) {
        closestItem.after(indicator);
      } else {
        closestItem.before(indicator);
      }
    }
  };

  app._handleItemDrop = function(e) {
    e.preventDefault();
    var indicator = document.querySelector('.item-drop-indicator');
    if (!indicator || !_itemDragData) {
      if (indicator) indicator.remove();
      _itemDragData = null;
      return;
    }

    var item = _itemDragData.itemEl;
    item.classList.remove('item-dragging');

    // Move the item element to before the indicator
    indicator.parentNode.insertBefore(item, indicator);
    indicator.remove();

    // Clear data attributes (will be rebuilt on save)
    item.setAttribute('data-section-dirty', '1');

    // Auto-save immediately after drop
    _triggerStructuredSave();

    _itemDragData = null;
  };

  app._handleItemDragEnd = function(e) {
    var item = document.querySelector('.section-item.item-dragging');
    if (item) item.classList.remove('item-dragging');
    var indicator = document.querySelector('.item-drop-indicator');
    if (indicator) indicator.remove();
    _itemDragData = null;
  };

  function _triggerStructuredSave() {
    // Trigger save from structured editor without closing it
    if (!currentTabId) return;
    var editor = document.getElementById('structuredEditor');
    if (!editor) return;

    var data = app.loadData();
    var tab = null;
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === currentTabId) { tab = data.tabs[i]; break; }
    }
    if (!tab) return;

    var sectionBlocks = editor.querySelectorAll('.section-block');
    var sections = [];
    sectionBlocks.forEach(function(block) {
      var headingEl = block.querySelector('h3');
      if (!headingEl) return;
      var heading = headingEl.textContent || '';
      var items = [];
      var itemEls = block.querySelectorAll('.section-item');
      itemEls.forEach(function(itemEl) {
        var checkbox = itemEl.querySelector('.section-item-checkbox');
        var titleInput = itemEl.querySelector('.section-item-title');
        var descInput = itemEl.querySelector('.section-item-desc');
        var tagEl = itemEl.querySelector('.section-tag');
        var file = itemEl.getAttribute('data-file') || '';
        if (!file && tagEl) {
          file = tagEl.textContent.replace('✕', '').trim();
        }
        items.push({
          checked: checkbox ? checkbox.checked : false,
          text: titleInput ? titleInput.value : '',
          desc: descInput ? descInput.value : '',
          file: file
        });
      });
      sections.push({ heading: heading, items: items });
    });

    // Parse current title from summary
    var title = tab.name || '';
    var summaryLines = (tab.summary || '').split('\n');
    if (summaryLines.length > 0) {
      var fmt = summaryLines[0].trim();
      if (fmt.match(/^# /)) title = fmt.replace(/^# /, '').trim();
    }

    tab.summary = sectionsToMarkdown({ title: title, sections: sections });
    tab.updated = new Date().toISOString();
    app.saveData(data);
  }

  /* ─── Tab Detail — Flask stilā ───────────────────────────────── */

  app.openTab = function(tabId) {
    // Ignore if we just completed a drag
    if (_tabWasDragged) {
      _tabWasDragged = false;
      return;
    }
    var data = app.loadData();
    var tab = null;
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === tabId) { tab = data.tabs[i]; break; }
    }
    if (!tab) return;

    currentTabId = tabId;

    var grid = document.getElementById('tabGrid');
    if (grid) grid.classList.add('hidden');

    var panel = document.getElementById('expandedPanel');
    if (!panel) return;
    panel.classList.add('visible');
    panel.setAttribute('data-current-tab', currentTabId);

    var titleEl = document.getElementById('expandedTitle');
    if (titleEl) titleEl.innerHTML = renderIconHtml(tab.icon || '📄') + ' <span class="expanded-title-text">' + escHtml(tab.name || '') + '</span>';

    var updatedEl = document.getElementById('expandedUpdated');
    if (updatedEl) updatedEl.textContent = 'Atjaunināts: ' + formatDate(tab.updated);

    var contentEl = document.getElementById('expandedContent');
    if (contentEl) contentEl.innerHTML = app.renderSummaryHtml(tab);

    // Files section
    var filesSection = document.getElementById('fullFilesSection');
    if (filesSection) {
      var fileList = document.getElementById('fileList');
      if (fileList) {
        fileList.innerHTML = '';
        if (tab.files && tab.files.length > 0) {
          tab.files.forEach(function(file) {
            var li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = '<span class="file-item-name">' + uiIconHtml('uifile') + ' ' + escHtml(file.name) + '</span>' +
              '<span class="file-item-actions">' +
                '<button class="file-edit-btn" title="Rediģēt">' + uiIconHtml('uiedit') + '</button>' +
                '<button class="file-delete-btn" title="Dzēst">' + uiIconHtml('uitrash') + '</button>' +
              '</span>';
            // Click on name → view file
            li.querySelector('.file-item-name').onclick = function() { app.viewFile(tab.id, file.name); };
            // Edit → open in editor
            li.querySelector('.file-edit-btn').onclick = function(e) { e.stopPropagation(); app.editExistingFile(tab.id, file); };
            // Delete
            li.querySelector('.file-delete-btn').onclick = function(e) {
              e.stopPropagation();
              if (!confirm('Dzēst failu ' + file.name + '?')) return;
              var d = app.loadData();
              for (var i = 0; i < d.tabs.length; i++) {
                if (d.tabs[i].id === tab.id) {
                  d.tabs[i].files = d.tabs[i].files.filter(function(f) { return f.name !== file.name; });
                  d.tabs[i].updated = new Date().toISOString();
                  break;
                }
              }
              app.saveData(d);
              app.openTab(tab.id); // re-render
            };
            fileList.appendChild(li);
          });
          filesSection.style.display = 'block';
        } else {
          filesSection.style.display = 'none';
        }
      }
    }

    // Hide file viewer if open
    var viewer = document.getElementById('fileViewer');
    if (viewer) viewer.style.display = 'none';

    // Hide quick note form
    var qnForm = document.getElementById('quickNoteForm');
    if (qnForm) qnForm.style.display = 'none';

    // Hide edit mode (prevent cross-tab edit leak)
    var editMode = document.getElementById('editMode');
    if (editMode) editMode.style.display = 'none';
    var expandedContent = document.getElementById('expandedContent');
    if (expandedContent) expandedContent.style.display = '';

    // QoL (mobile): open every tab the same way with Atpakaļ ~ mid-screen
    // (comfortable thumb zone). Lower grid cards used to keep scrollY so Back
    // was off-screen; scroll-to-top alone put Back too high under the notch.
    document.body.classList.add('tab-open');
    app._positionOpenTabForThumb();
  };

  /** Put expanded-header / Atpakaļ around ~42% viewport height on phones. */
  app._positionOpenTabForThumb = function() {
    var panel = document.getElementById('expandedPanel');
    if (!panel) return;

    // Clear previous offset
    panel.style.marginTop = '';

    var isMobile = window.innerWidth <= 600;
    try {
      window.scrollTo(0, 0);
    } catch (e) {}

    if (!isMobile) return;

    var place = function() {
      try { window.scrollTo(0, 0); } catch (e0) {}
      var back = document.getElementById('backBtn');
      var anchor = back || panel.querySelector('.expanded-header') || panel;
      if (!anchor) return;

      // Target: back control roughly at mid-screen (slightly above true center)
      var desiredTop = Math.round(window.innerHeight * 0.42);
      var rect = anchor.getBoundingClientRect();
      var deficit = desiredTop - rect.top;
      // Only push panel DOWN (never negative margin that overlaps header awkwardly)
      if (deficit > 4) {
        panel.style.marginTop = Math.round(deficit) + 'px';
      } else {
        panel.style.marginTop = '';
      }
      try { window.scrollTo(0, 0); } catch (e1) {}
    };

    // After layout: grid hidden, panel visible, fonts/icons settled
    requestAnimationFrame(function() {
      requestAnimationFrame(place);
    });
    // One more pass shortly after images/pack icons may shift layout
    setTimeout(place, 50);
    setTimeout(place, 200);
  };

  app.closeTab = function() {
    var grid = document.getElementById('tabGrid');
    if (grid) grid.classList.remove('hidden');

    var panel = document.getElementById('expandedPanel');
    if (panel) {
      panel.classList.remove('visible');
      panel.style.marginTop = '';
    }

    document.body.classList.remove('tab-open');
    currentTabId = null;
    app.renderAll();

    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  };

  /* ─── Summary Rendering ───────────────────────────────────────── */

  app.renderSummaryHtml = function(tab) {
    if (!tab || !tab.summary) return '';
    var text = tab.summary;
    // Panel header already shows tab name — skip redundant markdown H1 ("# Name — Aktuālais")
    text = text.replace(/^#\s+.+(?:\n+|$)/m, '');
    var tabId = tab.id;
    var parts = text.split(/(?=^## )/m);
    var html = '';
    var sectionsRendered = 0;

    parts.forEach(function(part) {
      part = part.trim();
      if (!part) return;

      // Skip leftover bare H1 lines if any
      if (/^#\s+/.test(part) && !/^##\s+/.test(part)) {
        part = part.replace(/^#\s+.+$/m, '').trim();
        if (!part) return;
      }

      var headingMatch = part.match(/^## (.+)$/m);
      if (headingMatch) {
        html += '<h3 class="summary-section-h">' + renderSectionHeadingHtml(headingMatch[1]) + '</h3>';

        // Content after heading
        var rest = part.replace(/^## .+$/m, '').trim();
        var lines = rest.split('\n');
        var inList = false;
        var listItems = [];
        var sectionIdx = sectionsRendered;
        var itemIdx = 0;
        sectionsRendered++;

        lines.forEach(function(line) {
          line = line.trim();
          if (!line) return;

          // Checkbox item: - [ ] text
          var cbMatch = line.match(/^- \[(.)\] (.+)$/);
          if (cbMatch) {
            var checked = cbMatch[1];
            var itemText = cbMatch[2];
            var isChecked = (checked === 'x' || checked === 'X');
            var cbHtml = '<span class="cb-icon' + (isChecked ? ' cb-checked' : ' cb-unchecked') + '" data-section="' + sectionIdx + '" data-item="' + itemIdx + '" onclick="app.toggleSummaryCheckbox(\'' + escAttr(tabId) + '\',' + sectionIdx + ',' + itemIdx + ')"></span>';
            itemIdx++;
            var rendered = renderInlineLinks(itemText, tabId);
            listItems.push('<li class="summary-item">' + cbHtml + '<span class="summary-item-text">' + rendered + '</span></li>');
            inList = true;
            return;
          }

          // Plain list item: - text
          var listMatch = line.match(/^- (.+)$/);
          if (listMatch) {
            listItems.push('<li>' + renderInlineLinks(listMatch[1], tabId) + '</li>');
            inList = true;
            return;
          }

          // If we were in a list, flush it
          if (inList && listItems.length > 0) {
            html += '<ul>' + listItems.join('') + '</ul>';
            listItems = [];
            inList = false;
          }

          // Horizontal rule
          if (line.match(/^---+$/)) {
            html += '<hr>';
            return;
          }

          // Blockquote
          var bqMatch = line.match(/^&gt; (.+)$/);
          if (bqMatch) {
            html += '<blockquote>' + renderInlineMarkdown(bqMatch[1]) + '</blockquote>';
            return;
          }

          // Paragraph
          html += '<p>' + renderInlineMarkdown(line) + '</p>';
        });

        // Flush remaining list items
        if (inList && listItems.length > 0) {
          html += '<ul>' + listItems.join('') + '</ul>';
        }
      } else {
        // No heading — just content lines
        var lines = part.split('\n');
        lines.forEach(function(line) {
          line = line.trim();
          if (!line) return;
          if (line.match(/^---+$/)) {
            html += '<hr>';
          } else if (line.match(/^&gt; /)) {
            html += '<blockquote>' + renderInlineMarkdown(line.replace(/^&gt; /, '')) + '</blockquote>';
          } else {
            html += '<p>' + renderInlineMarkdown(line) + '</p>';
          }
        });
      }
    });

    return html;
  };

  // Toggle checkbox directly from summary view
  app.toggleSummaryCheckbox = function(tabId, sectionIndex, itemIndex) {
    var data = app.loadData();
    var tab = null;
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === tabId) { tab = data.tabs[i]; break; }
    }
    if (!tab || !tab.summary) return;

    var parsed = parseSummaryToSections(tab.summary);
    if (sectionIndex === -1) {
      // Orphan items — find the section-less content
      // Re-parse differently: find all - [x] items outside ## headings
      var lines = tab.summary.split('\n');
      var inSection = false;
      var orphanCount = 0;
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li].trim();
        if (line.match(/^## /)) { inSection = true; continue; }
        if (!inSection) {
          var cbMatch = line.match(/^- \[([ x])\] (.+)$/);
          if (cbMatch) {
            if (orphanCount === itemIndex) {
              var newChecked = (cbMatch[1] === 'x' || cbMatch[1] === 'X') ? ' ' : 'x';
              lines[li] = '- [' + newChecked + '] ' + cbMatch[2];
              tab.summary = lines.join('\n');
              tab.updated = new Date().toISOString();
              app.saveData(data);
              var contentEl = document.getElementById('expandedContent');
              if (contentEl) contentEl.innerHTML = app.renderSummaryHtml(tab);
              return;
            }
            orphanCount++;
          }
        }
      }
      return;
    }

    // Normal section items
    if (sectionIndex >= parsed.sections.length) return;
    var section = parsed.sections[sectionIndex];
    if (itemIndex >= section.items.length) return;
    section.items[itemIndex].checked = !section.items[itemIndex].checked;

    tab.summary = sectionsToMarkdown(parsed);
    tab.updated = new Date().toISOString();
    app.saveData(data);

    // Re-render
    var contentEl = document.getElementById('expandedContent');
    if (contentEl) contentEl.innerHTML = app.renderSummaryHtml(tab);
  };

  function renderInlineLinks(text, tabId) {
    // [text](path) → summary-link (clickable) or regular link
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, linkText, url) {
      var escapedText = escHtml(linkText);
      // If it's a full file path like full/fails.md or ../full/fails.md
      var fileMatch = url.match(/(?:full\/|\.\.\/full\/)?(.+\.md)$/);
      if (fileMatch) {
        var filename = escAttr(fileMatch[1]);
        return '<span class="summary-link" data-file="' + filename + '" onclick="app.viewFile(\'' + escAttr(tabId) + '\',\'' + filename + '\')">' + escapedText + '</span>';
      }
      // External link
      return '<a href="' + escAttr(url) + '" target="_blank" rel="noopener">' + escapedText + '</a>';
    });
  }

  function renderInlineMarkdown(text) {
    var html = escHtml(text);
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return html;
  }

  /* ─── Quick Notes ──────────────────────────────────────────────── */

  app.addQuickNote = function(tabId) {
    var input = document.getElementById('quickNoteInput');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;

    var data = app.loadData();
    var tab = null;
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === tabId) { tab = data.tabs[i]; break; }
    }
    if (!tab) return;

    // Add under 💡 Piezīmes / Idejas section (or append at end)
    var lines = tab.summary.split('\n');
    var pieSectionIdx = -1;
    for (var j = 0; j < lines.length; j++) {
      if (lines[j].match(/^## 💡/)) { pieSectionIdx = j; break; }
    }
    if (pieSectionIdx >= 0) {
      // Insert after the section heading
      lines.splice(pieSectionIdx + 1, 0, '', '- [ ] ' + text);
    } else {
      // No section found — append at end
      lines.push('- [ ] ' + text);
    }
    tab.summary = lines.join('\n');
    tab.updated = new Date().toISOString();
    app.saveData(data);
    input.value = '';

    var qnForm = document.getElementById('quickNoteForm');
    if (qnForm) qnForm.style.display = 'none';

    app.openTab(tabId);
  };

  /* ─── File Viewer ──────────────────────────────────────────────── */

  app.viewFile = function(tabId, filename) {
    var data = app.loadData();
    var tab = null;
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === tabId) { tab = data.tabs[i]; break; }
    }
    if (!tab || !tab.files) return;

    var file = null;
    for (var j = 0; j < tab.files.length; j++) {
      if (tab.files[j].name === filename) { file = tab.files[j]; break; }
    }
    if (!file) return;

    var modal = document.getElementById('fileViewerModal');
    if (!modal) return;

    document.getElementById('fileViewerModalTitle').textContent = file.name;
    document.getElementById('fileViewerModalContent').innerHTML = markdownToHtmlFull(file.content || '');
    modal.style.display = 'flex';
  };

  app.closeFileViewer = function() {
    var modal = document.getElementById('fileViewerModal');
    if (modal) modal.style.display = 'none';
  };

  function markdownToHtmlFull(text) {
    if (typeof text !== 'string') return '';
    var html = escHtml(text);

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold & italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Checkbox list items (orphan — outside sections)
    var orphanIdx = 0;
    html = html.replace(/^- \[(.)\] (.+)$/gm, function(match, checked, text) {
      var isChecked = (checked === 'x' || checked === 'X');
      var idx = orphanIdx++;
      return '<li class="summary-item"><span class="cb-icon' + (isChecked ? ' cb-checked' : ' cb-unchecked') + '" data-section="-1" data-item="' + idx + '" onclick="app.toggleSummaryCheckbox(\'' + escAttr(tabId) + '\',-1,' + idx + ')"></span><span class="summary-item-text">' + text + '</span></li>';
    });

    // Plain list items
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li.*?><\/li>\n?)+)/g, '<ul>$1</ul>');
    html = html.replace(/((?:<li.*?>\n?)+)/g, '<ul>$1</ul>');
    // More robust li wrapping
    html = html.replace(/((?:<li[^>]*>.*?(?:<\/li>)?\n?)+)/g, function(match) {
      if (match.indexOf('<ul>') !== -1) return match;
      return '<ul>' + match + '</ul>';
    });

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Tables (basic)
    html = html.replace(/\|(.+)\|/g, '<td>$1</td>');
    html = html.replace(/((?:<td>.*?<\/td>\n?)+)/g, '<tr>$1</tr>');
    html = html.replace(/((?:<tr>.*?<\/tr>\n?)+)/g, '<table>$1</table>');

    // Newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /* ─── Structured Editor — Parse / Serialize / Render ──────────── */

  function parseSummaryToSections(md) {
    if (!md) md = '';
    var sections = [];
    var title = '';

    // Extract title from first line
    var lines = md.split('\n');
    if (lines.length > 0) {
      var firstLine = lines[0].trim();
      if (firstLine.match(/^# /)) {
        title = firstLine.replace(/^# /, '').trim();
      }
    }

    // Helper: normalize ANY heading → canonical 🎯/⏰/💡 format
    function normalizeHeading(raw) {
      var h = (raw || '').trim();
      // Strip leading emoji/icon token(s) for keyword matching
      var cleaned = h.replace(/^[^\wĀ-ū\s,;:]+(\s*)/, '');
      if (/šobrīd\s*svarīg/i.test(h) || /šobrīd\s*svarīg/i.test(cleaned) || /^🎯/.test(h)) {
        return '🎯 Šobrīd svarīgi';
      } else if (/tuvākaj/i.test(h) || /tuvākaj/i.test(cleaned) || /^⏰/.test(h) || /^⌚/.test(h)) {
        return '⏰ Tuvākajā laikā';
      } else if (/piezīmes|idejas/i.test(h) || /piezīmes|idejas/i.test(cleaned) || /^💡/.test(h)) {
        return '💡 Piezīmes / Idejas';
      }
      // Unknown heading — keep as-is (user-defined section)
      return h;
    }

    // Split by ANY ## heading (flexible — handles legacy formats)
    var sectionRegex = /^## (.+)$/gm;
    var parts = [];
    var lastIndex = 0;
    var match;
    while ((match = sectionRegex.exec(md)) !== null) {
      if (lastIndex < match.index) {
        parts.push({ type: 'content', text: md.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'heading', text: match[1], index: match.index });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < md.length) {
      parts.push({ type: 'content', text: md.slice(lastIndex) });
    }

    var currentSection = null;
    var orphanItems = [];
    var itemRegex = /^- \[([ x])\] (?:\[([^\]]+)\]\(full\/([^\)]+)\)(?:\s*—\s*(.+))?|(.+))$/gm;

    parts.forEach(function(part) {
      if (part.type === 'heading') {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: normalizeHeading(part.text),
          items: []
        };
      } else if (part.type === 'content') {
        var text = part.text;
        var itemMatch;
        // Reset lastIndex on the regex
        itemRegex.lastIndex = 0;
        while ((itemMatch = itemRegex.exec(text)) !== null) {
          var checked = itemMatch[1] === 'x' || itemMatch[1] === 'X';
          var item = { checked: checked, text: '', desc: '', file: '' };
          if (itemMatch[2] !== undefined) {
            // Has link
            item.text = itemMatch[2];
            item.file = itemMatch[3];
            item.desc = itemMatch[4] || '';
          } else if (itemMatch[5] !== undefined) {
            // Plain text
            item.text = itemMatch[5];
          }
          if (currentSection) {
            currentSection.items.push(item);
          } else {
            // Orphan item (before any ## heading) — preserve it
            orphanItems.push(item);
          }
        }
      }
    });
    if (currentSection) {
      sections.push(currentSection);
    }

    // If orphan items exist but no sections, add them to a default section
    if (orphanItems.length > 0 && sections.length === 0) {
      sections.push({
        heading: '🎯 Šobrīd svarīgi',
        items: orphanItems
      });
    } else if (orphanItems.length > 0 && sections.length > 0) {
      // Prepend orphans to the first section
      sections[0].items = orphanItems.concat(sections[0].items);
    }

    return { title: title, sections: sections };
  }

  function sectionsToMarkdown(sections) {
    var md = '# ' + (sections.title || '') + '\n\n';
    sections.sections.forEach(function(section) {
      md += '## ' + section.heading + '\n\n';
      section.items.forEach(function(item) {
        var checkbox = item.checked ? 'x' : ' ';
        if (item.file) {
          md += '- [' + checkbox + '] [' + item.text + '](full/' + item.file + ')';
          if (item.desc) {
            md += ' — ' + item.desc;
          }
          md += '\n';
        } else {
          md += '- [' + checkbox + '] ' + item.text + '\n';
        }
      });
      md += '\n';
    });
    return md;
  }

  function renderSectionItemHTML(item, sectionIndex, itemIndex) {
    var checkedAttr = item.checked ? 'checked' : '';
    var checkedClass = item.checked ? ' checked' : '';
    var file = item.file || '';
    var desc = item.desc || '';
    return '<div class="section-item' + checkedClass + '" data-section="' + sectionIndex + '" data-item="' + itemIndex + '" data-file="' + escAttr(file) + '" draggable="true">' +
      '<div class="section-item-drag-handle" title="Vilkt lai pārvietotu">⠿</div>' +
      '<div class="section-item-header">' +
        '<input type="checkbox" class="section-item-checkbox" ' + checkedAttr + '>' +
        '<input type="text" class="section-item-title" value="' + escAttr(item.text) + '" placeholder="Ieraksta virsraksts">' +
        '<button class="section-item-delete" title="Dzēst ierakstu">' + uiIconHtml('uitrash') + '</button>' +
      '</div>' +
      '<button class="add-context-btn">' + uiIconHtml('uifile') + ' Paplašināts konteksts' + (file ? ' <span class="file-check" title="Pievienots paplašināts konteksts: ' + escAttr(file) + '">✅</span>' : '') + '</button>' +
    '</div>';
  }

  function renderStructuredEditor(sections) {
    var editor = document.getElementById('structuredEditor');
    if (!editor) return;

    // Inline styles for structured editor
    var styleId = 'structured-editor-styles';
    if (!document.getElementById(styleId)) {
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent =
        '.section-block { border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 20px; background: var(--bg-card); }' +
        '.section-block h3 { margin: 0 0 12px 0; font-size: 16px; color: var(--text-primary); }' +
        '.section-item { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; background: var(--bg-secondary); position: relative; transition: transform 0.15s ease, box-shadow 0.15s ease; }' +
        '.section-item-header { display: flex; align-items: center; gap: 8px; }' +
        '.section-item-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); flex-shrink: 0; }' +
        '.section-item-title { flex: 1; background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 14px; color: var(--text-primary); outline: none; }' +
        '.section-item-title:focus { border-color: var(--accent); }' +
        '.section-item-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }' +
        '.section-tag { display: inline-flex; align-items: center; gap: 4px; background: var(--accent); color: #fff; font-size: 12px; padding: 3px 10px; border-radius: 12px; }' +
        '.section-tag .tag-remove { background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 12px; padding: 0; line-height: 1; }' +
        '.section-tag .tag-remove:hover { color: #fff; }' +
        '.add-item-btn { display: block; width: 100%; border: 2px dashed var(--border); border-radius: 8px; padding: 10px; background: transparent; color: var(--text-muted); font-size: 13px; cursor: pointer; transition: all 0.2s; margin-top: 4px; }' +
        '.add-item-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,0.05); }' +
        '.add-context-btn { background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 12px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }' +
        '.add-context-btn:hover { border-color: var(--accent); color: var(--accent); }' +
        '.file-check { font-size: 12px; margin-left: 4px; opacity: 0.8; }' +
        '.section-item.checked .section-item-title { text-decoration: line-through; opacity: 0.6; }' +
        '.edit-mode-actions { display: flex; gap: 12px; margin-top: 16px; justify-content: flex-end; }' +
        '.edit-mode-actions .save-note-btn { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }' +
        '.edit-mode-actions .cancel-note-btn { background: transparent; border: 1px solid var(--border); border-radius: 8px; padding: 10px 20px; font-size: 14px; color: var(--text-muted); cursor: pointer; }' +
        '.edit-mode-toolbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; margin: -16px -16px 12px -16px; background: var(--bg-card); border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); }' +
        '.edit-mode-toolbar .toolbar-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }' +
        '.edit-mode-toolbar .toolbar-actions { display: flex; gap: 8px; }' +
        '.edit-mode-toolbar .save-note-btn { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; cursor: pointer; }' +
        '.edit-mode-toolbar .cancel-note-btn { background: transparent; border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; font-size: 13px; color: var(--text-muted); cursor: pointer; }' +
        '.structured-editor { max-height: 70vh; overflow-y: auto; padding-right: 4px; }' +
        '.structured-editor::-webkit-scrollbar { width: 6px; }' +
        '.structured-editor::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }' +
        '/* Checkbox icons (skata režīmam) */' +
        '.cb-icon { display: inline-flex; width: 24px; height: 24px; min-width: 24px; border-radius: 6px; border: 2px solid var(--border); align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease; cursor: pointer; }' +
        '.cb-icon.cb-unchecked { border-color: var(--border); background: transparent; }' +
        '.cb-icon.cb-unchecked::after { content: ""; opacity: 0; transition: opacity 0.15s; }' +
        '.cb-icon.cb-checked { border-color: var(--accent); background: var(--accent); }' +
        '.cb-icon.cb-checked::after { content: "✓"; color: #fff; font-size: 14px; font-weight: 700; line-height: 1; }' +
        '.cb-icon:hover { border-color: var(--accent); transform: scale(1.1); }' +
        '.cb-icon.cb-checked:hover { background: var(--accent-hover, #5558e3); }' +
        '.summary-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; line-height: 1.5; }' +
        '.summary-item-text { flex: 1; padding-top: 2px; }' +
        '/* Section item iekš edit režīma — patur akcenta krāsu checkboxiem */' +
        '.section-item-checkbox { width: 22px; height: 22px; cursor: pointer; accent-color: var(--accent); flex-shrink: 0; margin: 0; }';
      document.head.appendChild(style);
    }

    var html = '';
    sections.sections.forEach(function(section, si) {
      html += '<div class="section-block" data-section-index="' + si + '">';
      html += '<h3 class="summary-section-h">' + renderSectionHeadingHtml(section.heading) + '</h3>';
      html += '<div class="section-items">';
      section.items.forEach(function(item, ii) {
        html += renderSectionItemHTML(item, si, ii);
      });
      html += '</div>';
      html += '<button class="add-item-btn" data-section-index="' + si + '">+ Pievienot ierakstu</button>';
      html += '</div>';
    });

    editor.innerHTML = html;
  }

  /* ─── Create / Edit / Delete Tab ───────────────────────────────── */

  app.createTab = function(data) {
    var allData = app.loadData();
    var tab = {
      id: generateId(),
      name: data.name || 'Jauns tabs',
      color: data.color || '#6366f1',
      icon: data.icon || '📄',
      image: data.image || '',
      description: data.description || '',
      summary: data.summary || '## 🎯 Šobrīd svarīgi\n\n' +
        '## ⏰ Tuvākajā laikā\n\n' +
        '## 💡 Piezīmes / Idejas\n\n',
      files: data.files || [],
      updated: new Date().toISOString()
    };
    allData.tabs.push(tab);
    app.saveData(allData);
    app.renderAll();
    return tab;
  };

  app.editTab = function(id, data) {
    var allData = app.loadData();
    for (var i = 0; i < allData.tabs.length; i++) {
      if (allData.tabs[i].id === id) {
        var tab = allData.tabs[i];
        if (data.name !== undefined) tab.name = data.name;
        if (data.color !== undefined) tab.color = data.color;
        if (data.icon !== undefined) tab.icon = data.icon;
        if (data.image !== undefined) tab.image = data.image;
        if (data.description !== undefined) tab.description = data.description;
        if (data.summary !== undefined) tab.summary = data.summary;
        tab.updated = new Date().toISOString();
        app.saveData(allData);
        app.renderAll();
        return;
      }
    }
  };

  app.deleteTab = function(id) {
    if (!confirm('⚠️ Tiešām dzēst? Šis tabs pazudīs pavisam.')) return;
    var allData = app.loadData();
    for (var i = 0; i < allData.tabs.length; i++) {
      if (allData.tabs[i].id === id) {
        allData.tabs.splice(i, 1);
        break;
      }
    }
    app.saveData(allData);
    // Track deletion for sync
    var deletedIds = [];
    try { deletedIds = JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'); } catch(e) {}
    if (deletedIds.indexOf(id) === -1) deletedIds.push(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
    app.closeTab();
    app.renderAll();
  };

  /* ─── Modal ────────────────────────────────────────────────────── */

  app.showCreateModal = function() {
    _editingTabId = null;
    _tempBgImage = null;

    var modal = document.getElementById('editModal');
    if (!modal) return;

    var title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Izveidot jaunu tabu';

    var nameInput = document.getElementById('editName');
    if (nameInput) nameInput.value = '';

    var iconInput = document.getElementById('editIcon');
    if (iconInput) iconInput.value = '📝';

    setIconPreview('📝');

    var colorInput = document.getElementById('editColor');
    if (colorInput) colorInput.value = '#6366f1';

    var bgInput = document.getElementById('editBgImage');
    if (bgInput) bgInput.value = '';

    var descInput = document.getElementById('editDesc');
    if (descInput) descInput.value = '';

    var bgPreview = document.getElementById('editBgPreview');
    if (bgPreview) { bgPreview.src = ''; bgPreview.style.display = 'none'; }

    // Reset icon picker selection
    clearIconPickerSelection();
    // Default tab: modern pack
    _iconPickerMode = 'modern';
    renderIconPickerGrid();

    var saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Izveidot';

    showModal('editModal');
  };

  app.showEditModal = function(tabId) {
    _editingTabId = tabId;
    _tempBgImage = null;

    var data = app.loadData();
    var tab = null;
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === tabId) { tab = data.tabs[i]; break; }
    }
    if (!tab) return;

    var modal = document.getElementById('editModal');
    if (!modal) return;

    var title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Rediģēt tabu';

    var nameInput = document.getElementById('editName');
    if (nameInput) nameInput.value = tab.name || '';

    var iconInput = document.getElementById('editIcon');
    if (iconInput) iconInput.value = tab.icon || '📝';

    setIconPreview(tab.icon || '📝');

    var colorInput = document.getElementById('editColor');
    if (colorInput) colorInput.value = tab.color || '#6366f1';

    var bgInput = document.getElementById('editBgImage');
    if (bgInput) bgInput.value = tab.image || '';

    var descInput = document.getElementById('editDesc');
    if (descInput) descInput.value = tab.description || '';

    var bgPreview = document.getElementById('editBgPreview');
    if (bgPreview) {
      if (tab.image) {
        bgPreview.src = tab.image;
        bgPreview.style.display = 'block';
      } else {
        bgPreview.src = '';
        bgPreview.style.display = 'none';
      }
    }

    // Switch picker mode based on current icon type
    _iconPickerMode = isPackIcon(tab.icon) ? 'modern' : 'emoji';
    renderIconPickerGrid();
    highlightIconInPicker(tab.icon || '📝');
    // Sync tab buttons UI
    document.querySelectorAll('.icon-picker-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === _iconPickerMode);
    });

    var saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Saglabāt';

    showModal('editModal');
  };

  app.saveTabFromModal = function() {
    var nameInput = document.getElementById('editName');
    var iconInput = document.getElementById('editIcon');
    var colorInput = document.getElementById('editColor');
    var bgInput = document.getElementById('editBgImage');
    var descInput = document.getElementById('editDesc');

    var name = nameInput ? nameInput.value.trim() : '';
    var icon = iconInput ? iconInput.value.trim() : '📝';
    var color = colorInput ? colorInput.value.trim() : '#6366f1';
    var bgValue = bgInput ? bgInput.value.trim() : '';
    var description = descInput ? descInput.value.trim() : '';

    if (!name) {
      alert('Lūdzu ievadiet taba nosaukumu.');
      return;
    }

    // If icon picker has a selected item, use that (pack:id or emoji)
    var selectedIcon = document.querySelector('#emojiPicker .emoji-picker-btn.selected');
    if (selectedIcon) icon = selectedIcon.getAttribute('data-icon') || selectedIcon.textContent;

    // _tempBgImage overrides editBgImage if set (from file upload)
    var image = _tempBgImage !== null ? _tempBgImage : bgValue;

    if (_editingTabId) {
      app.editTab(_editingTabId, {
        name: name,
        icon: icon,
        color: color,
        image: image,
        description: description
      });
      app.openTab(_editingTabId);
    } else {
      app.createTab({
        name: name,
        icon: icon,
        color: color,
        image: image || '',
        description: description,
        summary: '# ' + iconForMarkdown(icon) + ' ' + name + '\n\n'
      });
    }

    hideModal('editModal');
    _editingTabId = null;
    _tempBgImage = null;
  };

  app.hideTabModal = function() {
    hideModal('editModal');
    _editingTabId = null;
    _tempBgImage = null;
  };

  /* ─── Icon Picker (Modern pack + classic emoji) ─────────────────── */

  function renderIconPickerGrid() {
    var container = document.getElementById('emojiPicker');
    if (!container) return;

    // Sync mode tabs
    document.querySelectorAll('.icon-picker-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === _iconPickerMode);
    });

    var html = '';
    if (_iconPickerMode === 'modern') {
      html = ICON_PACK.map(function(item) {
        var val = 'pack:' + item.id;
        return '<button class="emoji-picker-btn pack-picker-btn" type="button" data-icon="' + escAttr(val) + '" title="' + escAttr(item.label) + '">' +
          '<img class="pack-icon" src="icons/pack/' + escAttr(item.id) + '.png" alt="' + escAttr(item.label) + '" draggable="false">' +
          '</button>';
      }).join('');
    } else {
      html = CLASSIC_EMOJIS.map(function(e) {
        return '<button class="emoji-picker-btn" type="button" data-icon="' + escAttr(e) + '">' + escHtml(e) + '</button>';
      }).join('');
    }
    container.innerHTML = html;

    // Restore selection highlight from input
    var iconInput = document.getElementById('editIcon');
    var current = iconInput ? iconInput.value.trim() : '';
    if (current) highlightIconInPicker(current);

    container.querySelectorAll('.emoji-picker-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var val = btn.getAttribute('data-icon') || btn.textContent;
        applyIconSelection(val);
      });
    });
  }

  function initEmojiPicker() {
    // Mode tabs
    document.querySelectorAll('.icon-picker-tab').forEach(function(tabBtn) {
      tabBtn.addEventListener('click', function() {
        _iconPickerMode = tabBtn.getAttribute('data-tab') || 'modern';
        renderIconPickerGrid();
      });
    });
    _iconPickerMode = 'modern';
    renderIconPickerGrid();
  }

  /* Public wrapper for HTML onclick */
  app.selectEmoji = function(emoji) {
    applyIconSelection(emoji);
  };

  /* ─── Image Management ─────────────────────────────────────────── */

  app.uploadImage = function(tabId) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var base64 = ev.target.result;
        var data = app.loadData();
        for (var i = 0; i < data.tabs.length; i++) {
          if (data.tabs[i].id === tabId) {
            data.tabs[i].image = base64;
            data.tabs[i].updated = new Date().toISOString();
            break;
          }
        }
        app.saveData(data);
        app.openTab(tabId);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  app.removeImage = function(tabId) {
    var data = app.loadData();
    for (var i = 0; i < data.tabs.length; i++) {
      if (data.tabs[i].id === tabId) {
        data.tabs[i].image = '';
        data.tabs[i].updated = new Date().toISOString();
        break;
      }
    }
    app.saveData(data);
    app.openTab(tabId);
  };

  app.handleBgImageUpload = function(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      _tempBgImage = e.target.result;
      var preview = document.getElementById('editBgPreview');
      if (preview) {
        preview.src = _tempBgImage;
        preview.style.display = 'block';
      }
      var bgInput = document.getElementById('editBgImage');
      if (bgInput) bgInput.value = _tempBgImage;
    };
    reader.readAsDataURL(file);
  };

  /* ─── Search ───────────────────────────────────────────────────── */

  app.search = function(query) {
    query = query.trim().toLowerCase();
    var resultsEl = document.getElementById('searchResults');
    if (!resultsEl) return [];

    if (!query) {
      resultsEl.style.display = 'none';
      resultsEl.innerHTML = '';
      return [];
    }

    var data = app.loadData();
    var results = [];

    data.tabs.forEach(function(tab) {
      // Search in tab name
      if ((tab.name || '').toLowerCase().indexOf(query) !== -1) {
        results.push({
          tabId: tab.id,
          tabName: tab.name,
          color: tab.color,
          location: '📋 Taba nosaukums',
          snippet: highlightMatch(tab.name, query),
          openAction: null  // just open the tab
        });
      }

      // Split summary by ## headings, search each section
      var summaryParts = (tab.summary || '').split(/(?=^## )/m);
      summaryParts.forEach(function(part) {
        part = part.trim();
        if (!part) return;
        var lowerPart = part.toLowerCase();
        var idx = lowerPart.indexOf(query);
        if (idx !== -1) {
          var heading = '';
          var hMatch = part.match(/^## (.+)$/m);
          if (hMatch) heading = hMatch[1].trim();
          var loc = heading ? '📝 ' + heading : '📝 summary';
          results.push({
            tabId: tab.id,
            tabName: tab.name,
            color: tab.color,
            location: loc,
            snippet: getSnippet(part, idx, query),
            openAction: null
          });
        }
      });

      // Search in each file
      if (tab.files && tab.files.length > 0) {
        tab.files.forEach(function(file) {
          var lowerFile = (file.content || '').toLowerCase();
          var fIdx = lowerFile.indexOf(query);
          if (fIdx !== -1) {
            results.push({
              tabId: tab.id,
              tabName: tab.name,
              color: tab.color,
              location: '📄 ' + file.name,
              snippet: getSnippet(file.content || '', fIdx, query),
              openAction: file.name  // open this specific file
            });
          }
        });
      }
    });

    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="search-result-item" style="color:var(--text-muted);padding:14px 20px;">Nekas nav atrasts</div>';
    } else {
      resultsEl.innerHTML = results.map(function(r) {
        return '<div class="search-result-item" data-tab-id="' + escAttr(r.tabId) + '"' +
          (r.openAction ? ' data-open-file="' + escAttr(r.openAction) + '"' : '') + '>' +
          '<div class="search-result-header">' +
            '<span class="search-result-tab" style="background:' + escAttr(r.color || '#6366f1') + '">' + escHtml(r.tabName) + '</span>' +
            '<span class="search-result-location">' + escHtml(r.location) + '</span>' +
          '</div>' +
          '<div class="search-result-snippet">' + r.snippet + '</div>' +
        '</div>';
      }).join('');
    }

    resultsEl.style.display = 'block';

    // Bind click events on search results
    resultsEl.querySelectorAll('.search-result-item').forEach(function(item) {
      var tabId = item.getAttribute('data-tab-id');
      var openFile = item.getAttribute('data-open-file');
      item.addEventListener('click', function() {
        app.openTab(tabId);
        if (openFile) {
          // Open specific file after a brief delay for tab to render
          setTimeout(function() { app.viewFile(tabId, openFile); }, 300);
        }
        var input = document.getElementById('searchInput');
        if (input) input.value = '';
        resultsEl.style.display = 'none';
        resultsEl.innerHTML = '';
      });
    });

    return results;
  };

  // Helper: extract snippet around match position
  function getSnippet(text, matchIdx, query) {
    var ctx = 60; // characters of context on each side
    var start = Math.max(0, matchIdx - ctx);
    var end = Math.min(text.length, matchIdx + query.length + ctx);
    var snip = text.substring(start, end);
    if (start > 0) snip = '...' + snip;
    if (end < text.length) snip = snip + '...';
    return highlightMatch(snip, query);
  }

  // Helper: wrap matching text in <mark>
  function highlightMatch(text, query) {
    var idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escHtml(text);
    var before = escHtml(text.substring(0, idx));
    var match = escHtml(text.substring(idx, idx + query.length));
    var after = escHtml(text.substring(idx + query.length));
    return before + '<mark>' + match + '</mark>' + after;
  }

  /* ─── GitHub Push / Pull ────────────────────────────────────────── */

  // PUSH: telefons → GitHub (overwrite, nevis merge!)
  app.pushPhoneData = function(callback) {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      callback({icon:'🔑',msg:'Nav GitHub tokena. Iestati Settings!'});
      return;
    }

    var data = app.loadData();
    if (!data.tabs || data.tabs.length === 0) {
      callback({icon:'⚠️',msg:'Nav datu ko pushot'});
      return;
    }

    app.saveData(data); // pārliecinās ka localStorage ir aktuāls

    // Push caur Worker — base64 encoded
    var jsonStr = JSON.stringify(data, null, 2);
    var content = btoa(unescape(encodeURIComponent(jsonStr)));

    // Vispirms dabū SHA, tad PUT
    fetch(GH_PROXY_URL + '?sha=1', {
      headers: { Authorization: 'Bearer ' + token },
    })
    .then(function(r) {
      if (!r.ok) throw new Error('GET SHA: ' + r.status);
      return r.json();
    })
    .then(function(gh) {
      if (!gh.sha) throw new Error('Nav SHA');
      return fetch(GH_PROXY_URL, {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'push: ' + new Date().toISOString().slice(0,16),
          content: content,
          sha: gh.sha,
        }),
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('PUT: ' + r.status);
      return r.json();
    })
    .then(function() {
      localStorage.removeItem(DELETED_KEY);
      callback({icon:'✅',msg:'Push veiksmīgs! ☁️'});
    })
    .catch(function(e) {
      callback({icon:'❌',msg:'Push neizdevās: ' + (e.message || '?')});
    });
  };

  // PULL: GitHub → telefons (overwrite localStorage, tikai atjaunošanai)
  app.pullPhoneData = function(callback) {
    var token = localStorage.getItem(TOKEN_KEY);
    var headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;

    // DL: raw data.json caur Worker — GitHub Accept: application/vnd.github.raw
    // Worker neapstrādā, tikai izlaiž cauri → 0 CPU time, nekad netaimo
    fetch(GH_PROXY_URL + '?dl=1', {
      headers: headers,
      cache: 'no-cache'
    })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(ghResponse) {
      // Default handler returns { sha, content } where content is parsed JSON directly
      var remoteData = ghResponse.content || ghResponse;
      if (!remoteData || !remoteData.tabs) throw new Error('Nederīgs formāts no GitHub');

      // Overwrite localStorage ar GitHub versiju
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
      callback({icon:'✅',msg:'Atjaunots no GitHub ⬇️ (' + remoteData.tabs.length + ' tabi)',reload:true});
    })
    .catch(function(e) {
      callback({icon:'❌',msg:'Pull neizdevās: ' + (e.message || '?')});
    });
  };

  /* ─── Export / Import ──────────────────────────────────────────── */

  app.exportData = function() {
    var data = app.loadData();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'kontekstalogas-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  app.importData = function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var imported = JSON.parse(ev.target.result);
          if (!imported.tabs || !Array.isArray(imported.tabs)) {
            alert('Nederīgs datu formāts — trūkst "tabs" masīva.');
            return;
          }
          if (confirm('Pievienot importētos tabus esošajiem? Spied "OK" pievienot, "Atcelt" lai aizvietotu visus.')) {
            var existing = app.loadData();
            imported.tabs.forEach(function(t) {
              existing.tabs.push(t);
            });
            app.saveData(existing);
          } else {
            app.saveData(imported);
          }
          app.renderAll();
          alert('Dati importēti veiksmīgi!');
        } catch(err) {
          alert('Kļūda importējot datus: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  /* ─── Init ─────────────────────────────────────────────────────── */

  function initEmojiPickerBind() {
    // Also bind editIcon input to update preview
    var iconInput = document.getElementById('editIcon');
    if (iconInput) {
      iconInput.addEventListener('input', function() {
        setIconPreview(this.value || '📝');
        highlightIconInPicker(this.value || '');
      });
    }

    // Bind editBgImage input to update preview via URL
    var bgInput = document.getElementById('editBgImage');
    if (bgInput) {
      bgInput.addEventListener('input', function() {
        var preview = document.getElementById('editBgPreview');
        if (preview) {
          if (this.value) {
            preview.src = this.value;
            preview.style.display = 'block';
          } else {
            preview.src = '';
            preview.style.display = 'none';
          }
        }
      });
    }
  }

  function init() {
    // Lock portrait — works mainly for installed PWA / fullscreen (browser tabs often ignore)
    function lockPortrait() {
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('portrait').catch(function() {});
          screen.orientation.lock('portrait-primary').catch(function() {});
        }
        if (screen.lockOrientation) screen.lockOrientation('portrait');
        if (screen.mozLockOrientation) screen.mozLockOrientation('portrait');
        if (screen.msLockOrientation) screen.msLockOrientation('portrait');
      } catch (e) {}
    }
    lockPortrait();
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) lockPortrait();
    });
    // Some Android WebViews only allow lock after a user gesture
    document.addEventListener('touchstart', function once() {
      lockPortrait();
      document.removeEventListener('touchstart', once, true);
    }, true);

    // Ielādē datus — vispirms localStorage (ātrs), tad mēģina serveri fonā
    var raw = localStorage.getItem(STORAGE_KEY);
    var hasLocalData = !!raw;

    if (hasLocalData) {
      // Tūlītējs render no localStorage
      app.renderAll();
      // Fonā mēģina dabūt jaunākos no servera
      app.loadDataAsync(function(serverData) {
        if (serverData && serverData.tabs) {
          // Pārbauda vai servera dati ir jaunāki/atšķirīgi
          var localData = null;
          try { localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) {}
          if (localData && JSON.stringify(localData.tabs) !== JSON.stringify(serverData.tabs)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            app.renderAll();
          }
        }
      });
    } else {
      // Nav localStorage — mēģina no servera, tad data.json, tad embedded
      app.loadDataAsync(function(serverData) {
        if (serverData && serverData.tabs && serverData.tabs.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
          app.renderAll();
        } else {
          // Fallback: data.json → embedded INITIAL_DATA_JSON
          fetch('data.json')
            .then(function(res) {
              if (!res.ok) throw new Error('Failed to load data.json: ' + res.status);
              return res.json();
            })
            .then(function(data) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
              app.renderAll();
            })
            .catch(function(err) {
              console.error('Init error:', err);
              try {
                var fallbackData = JSON.parse(INITIAL_DATA_JSON);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackData));
              } catch(e2) {
                console.error('Fallback parse error:', e2);
                app.saveData(getDefaultData());
              }
              app.renderAll();
            });
        }
      });
    }

    // Initialize emoji picker
    initEmojiPicker();
    initEmojiPickerBind();

    // ─── Event Listeners ─────────────────────────────────────────

    // Add tab button
    var addTabBtn = document.getElementById('addTabBtn');
    if (addTabBtn) addTabBtn.addEventListener('click', function() { app.showCreateModal(); });

    // Push button — telefona/PC dati → privātais GitHub repo (PRODUCTION only)
    var pushBtn = document.getElementById('pushBtn');
    if (pushBtn) {
      pushBtn.addEventListener('click', function() {
        pushBtn.textContent = '⏳ Push...';
        pushBtn.disabled = true;

        var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocal) {
          // PC DEV: git pull + push caur serveri (parasti nav Production)
          fetch('/api/sync', { method: 'POST' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.pushed) {
                pushBtn.textContent = '✅ Push OK';
                setTimeout(function() { pushBtn.textContent = '☁️ Push'; pushBtn.disabled = false; }, 3000);
              } else {
                pushBtn.textContent = '⚠️ ' + (data.message || 'Neizdevās');
                setTimeout(function() { pushBtn.textContent = '☁️ Push'; pushBtn.disabled = false; }, 3000);
              }
            })
            .catch(function() {
              pushBtn.textContent = '❌ Kļūda';
              setTimeout(function() { pushBtn.textContent = '☁️ Push'; pushBtn.disabled = false; }, 3000);
            });
        } else {
          // Production (GitHub Pages): push caur Cloudflare Worker
          app.pushPhoneData(function(result) {
            pushBtn.textContent = result.icon + ' ' + result.msg;
            setTimeout(function() { pushBtn.textContent = '☁️ Push'; pushBtn.disabled = false; }, 3000);
          });
        }
      });
    }

    // ─── Settings Modal ──────────────────────────────────────────

    var settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        // Ielādē esošo tokenu
        var tokenInput = document.getElementById('settingsToken');
        if (tokenInput) tokenInput.value = localStorage.getItem(TOKEN_KEY) || '';
        showModal('settingsModal');
      });
    }

    // Settings: Saglabāt tokenu
    var settingsSaveBtn = document.getElementById('settingsSaveBtn');
    if (settingsSaveBtn) {
      settingsSaveBtn.addEventListener('click', function() {
        var tokenInput = document.getElementById('settingsToken');
        if (tokenInput && tokenInput.value.trim()) {
          localStorage.setItem(TOKEN_KEY, tokenInput.value.trim());
        }
        hideModal('settingsModal');
      });
    }

    var settingsCloseBtn = document.getElementById('settingsCloseBtn');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', function() {
        hideModal('settingsModal');
      });
    }

    // Settings: Pull
    var settingsPullBtn = document.getElementById('settingsPullBtn');
    if (settingsPullBtn) {
      settingsPullBtn.addEventListener('click', function() {
        hideModal('settingsModal');
        var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocal) {
          fetch('/api/pull', { method: 'POST' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.pulled) location.reload();
              else alert('✅ Viss aktuāls');
            })
            .catch(function() { alert('❌ Pull neizdevās'); });
        } else {
          app.pullPhoneData(function(result) {
            if (result.reload) location.reload();
            else alert(result.icon + ' ' + result.msg);
          });
        }
      });
    }

    // Settings: Import
    var settingsImportBtn = document.getElementById('settingsImportBtn');
    if (settingsImportBtn) {
      settingsImportBtn.addEventListener('click', function() {
        hideModal('settingsModal');
        app.importData();
      });
    }

    // Settings: Export
    var settingsExportBtn = document.getElementById('settingsExportBtn');
    if (settingsExportBtn) {
      settingsExportBtn.addEventListener('click', function() {
        hideModal('settingsModal');
        app.exportData();
      });
    }

    // Settings: Update app — notīra kešu + SW + reload
    var settingsUpdateBtn = document.getElementById('settingsUpdateBtn');
    if (settingsUpdateBtn) {
      settingsUpdateBtn.addEventListener('click', function() {
        hideModal('settingsModal');
        if (confirm('Atjaunināt aplikāciju uz jaunāko versiju?\\n\\nKešs tiks notīrīts un lapa pārlādēta.')) {
          settingsUpdateBtn.textContent = '⏳ Atjaunina...';
          settingsUpdateBtn.disabled = true;
          _forceUpdate();
        }
      });
    }

    // Back button
    var backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', function() { app.closeTab(); });

    // Quick note toggle
    var quickNoteBtn = document.getElementById('quickNoteBtn');
    if (quickNoteBtn) {
      quickNoteBtn.addEventListener('click', function() {
        var qnForm = document.getElementById('quickNoteForm');
        if (qnForm) {
          if (qnForm.style.display === 'none' || qnForm.style.display === '') {
            qnForm.style.display = 'block';
            var input = document.getElementById('quickNoteInput');
            if (input) input.focus();
          } else {
            qnForm.style.display = 'none';
          }
        }
      });
    }

    // Save quick note
    var saveNoteBtn = document.getElementById('saveNoteBtn');
    if (saveNoteBtn) {
      saveNoteBtn.addEventListener('click', function() {
        if (currentTabId) app.addQuickNote(currentTabId);
      });
    }

    // Cancel quick note
    var cancelNoteBtn = document.getElementById('cancelNoteBtn');
    if (cancelNoteBtn) {
      cancelNoteBtn.addEventListener('click', function() {
        var qnForm = document.getElementById('quickNoteForm');
        if (qnForm) qnForm.style.display = 'none';
        var input = document.getElementById('quickNoteInput');
        if (input) input.value = '';
      });
    }

    // Edit tab button (⚙️)
    var editTabBtn = document.getElementById('editTabBtn');
    if (editTabBtn) {
      editTabBtn.addEventListener('click', function() {
        if (currentTabId) app.showEditModal(currentTabId);
      });
    }

    // Delete tab button (🗑️)
    var deleteTabBtn = document.getElementById('deleteTabBtn');
    if (deleteTabBtn) {
      deleteTabBtn.addEventListener('click', function() {
        if (currentTabId) app.deleteTab(currentTabId);
      });
    }

    // Modal save
    var modalSaveBtn = document.getElementById('modalSaveBtn');
    if (modalSaveBtn) modalSaveBtn.addEventListener('click', function() { app.saveTabFromModal(); });

    // Modal cancel
    var modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', function() { app.hideTabModal(); });

    // Modal overlay click to close
    var editModal = document.getElementById('editModal');
    if (editModal) {
      editModal.addEventListener('click', function(e) {
        if (e.target === editModal) app.hideTabModal();
      });
    }

    // File viewer modal close
    var fileViewerModalClose = document.getElementById('fileViewerModalClose');
    if (fileViewerModalClose) {
      fileViewerModalClose.addEventListener('click', function() { app.closeFileViewer(); });
    }
    var fileViewerModal = document.getElementById('fileViewerModal');
    if (fileViewerModal) {
      fileViewerModal.addEventListener('click', function(e) {
        if (e.target === fileViewerModal) app.closeFileViewer();
      });
    }

    // Search input — debounced
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      var searchTimer = null;
      searchInput.addEventListener('input', function() {
        var self = this;
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
          app.search(self.value);
        }, 250);
      });
      searchInput.addEventListener('focus', function() {
        if (this.value.trim()) {
          app.search(this.value);
        }
      });
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          var results = document.getElementById('searchResults');
          if (results) { results.style.display = 'none'; results.innerHTML = ''; }
          this.value = '';
        }
      });
    }

    // Close search results on click outside
    document.addEventListener('click', function(e) {
      var results = document.getElementById('searchResults');
      var searchContainer = document.querySelector('.search-bar');
      if (results && searchContainer) {
        if (!searchContainer.contains(e.target)) {
          results.style.display = 'none';
        }
      }
    });

    // Background image upload handler
    var bgImageUpload = document.getElementById('bgImageUpload');
    if (bgImageUpload) {
      bgImageUpload.addEventListener('change', function(event) {
        app.handleBgImageUpload(event);
      });
    }

    // Modal bg image upload button
    var editBgUploadBtn = document.getElementById('editBgUploadBtn');
    if (editBgUploadBtn) {
      editBgUploadBtn.addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
          var file = e.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function(ev) {
            _tempBgImage = ev.target.result;
            var preview = document.getElementById('editBgPreview');
            if (preview) {
              preview.src = _tempBgImage;
              preview.style.display = 'block';
            }
            var bgInput = document.getElementById('editBgImage');
            if (bgInput) bgInput.value = '[lokāla bilde]';
          };
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }

    // Clear optional custom background in edit modal
    var editBgClearBtn = document.getElementById('editBgClearBtn');
    if (editBgClearBtn) {
      editBgClearBtn.addEventListener('click', function() {
        _tempBgImage = '';
        var bgInput = document.getElementById('editBgImage');
        if (bgInput) bgInput.value = '';
        var preview = document.getElementById('editBgPreview');
        if (preview) { preview.src = ''; preview.style.display = 'none'; }
      });
    }

    // Quick note Enter key
    var quickNoteInput = document.getElementById('quickNoteInput');
    if (quickNoteInput) {
      quickNoteInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (currentTabId) app.addQuickNote(currentTabId);
        }
      });
    }

    // Edit content button (✏️) — structured editor
    var editContentBtn = document.getElementById('editContentBtn');
    if (editContentBtn) {
      editContentBtn.addEventListener('click', function() {
        var editMode = document.getElementById('editMode');
        var expandedContent = document.getElementById('expandedContent');
        if (!editMode || !expandedContent || !currentTabId) return;

        if (editMode.style.display === 'none' || !editMode.style.display) {
          // Enter edit mode — structured editor
          var data = app.loadData();
          var tab = null;
          for (var i = 0; i < data.tabs.length; i++) {
            if (data.tabs[i].id === currentTabId) { tab = data.tabs[i]; break; }
          }
          if (!tab) return;

          var sections = parseSummaryToSections(tab.summary || '');

          // Fallback: if no sections found, create default ones
          if (!sections.sections || sections.sections.length === 0) {
            sections.sections = [
              { heading: '🎯 Šobrīd svarīgi', items: [] },
              { heading: '⏰ Tuvākajā laikā', items: [] },
              { heading: '💡 Piezīmes / Idejas', items: [] }
            ];
            if (!sections.title) sections.title = tab.name || 'Jauns tabs';
          }

          renderStructuredEditor(sections);
          expandedContent.style.display = 'none';
          editMode.style.display = 'block';
        } else {
          // Exit edit mode
          editMode.style.display = 'none';
          expandedContent.style.display = '';
        }
      });
    }

    // Edit mode save — collect from structured editor
    var editSaveBtn = document.getElementById('editSaveBtn');
    if (editSaveBtn) {
      editSaveBtn.addEventListener('click', function() {
        if (!currentTabId) return;
        var editMode = document.getElementById('editMode');
        if (!editMode) return;

        var data = app.loadData();
        var tab = null;
        for (var i = 0; i < data.tabs.length; i++) {
          if (data.tabs[i].id === currentTabId) { tab = data.tabs[i]; break; }
        }
        if (!tab) return;

        // Collect data from structured editor
        var editor = document.getElementById('structuredEditor');
        if (!editor) return;

        var sectionBlocks = editor.querySelectorAll('.section-block');
        var sections = [];
        sectionBlocks.forEach(function(block) {
          var headingEl = block.querySelector('h3');
          if (!headingEl) return;
          var heading = headingEl.textContent || '';
          var items = [];
          var itemEls = block.querySelectorAll('.section-item');
          itemEls.forEach(function(itemEl) {
            var checkbox = itemEl.querySelector('.section-item-checkbox');
            var titleInput = itemEl.querySelector('.section-item-title');
            var descInput = itemEl.querySelector('.section-item-desc');
            var tagEl = itemEl.querySelector('.section-tag');
            var file = itemEl.getAttribute('data-file') || '';
            // If tag exists but data-file is empty, use tag text
            if (!file && tagEl) {
              file = tagEl.textContent.replace('✕', '').trim();
            }
            items.push({
              checked: checkbox ? checkbox.checked : false,
              text: titleInput ? titleInput.value : '',
              desc: descInput ? descInput.value : '',
              file: file
            });
          });
          sections.push({ heading: heading, items: items });
        });

        // Restore title from existing summary or tab name
        var title = tab.name || '';
        var parsed = parseSummaryToSections(tab.summary || '');
        if (parsed.title) title = parsed.title;

        var newSummary = sectionsToMarkdown({ title: title, sections: sections });
        tab.summary = newSummary;
        tab.updated = new Date().toISOString();
        app.saveData(data);

        editMode.style.display = 'none';
        var expandedContent = document.getElementById('expandedContent');
        if (expandedContent) expandedContent.style.display = '';
        var expandedUpdated = document.getElementById('expandedUpdated');
        if (expandedUpdated) expandedUpdated.textContent = 'Atjaunināts: ' + formatDate(new Date().toISOString());
        app.openTab(currentTabId); // re-render
      });
    }

    // Edit mode cancel
    var editCancelBtn = document.getElementById('editCancelBtn');
    if (editCancelBtn) {
      editCancelBtn.addEventListener('click', function() {
        var editMode = document.getElementById('editMode');
        if (editMode) editMode.style.display = 'none';
        var expandedContent = document.getElementById('expandedContent');
        if (expandedContent) expandedContent.style.display = '';
      });
    }

    // Wire top toolbar buttons to trigger the same handlers
    var editSaveTopBtn = document.getElementById('editSaveTopBtn');
    if (editSaveTopBtn) {
      editSaveTopBtn.addEventListener('click', function() {
        var bottomSave = document.getElementById('editSaveBtn');
        if (bottomSave) bottomSave.click();
      });
    }
    var editCancelTopBtn = document.getElementById('editCancelTopBtn');
    if (editCancelTopBtn) {
      editCancelTopBtn.addEventListener('click', function() {
        var bottomCancel = document.getElementById('editCancelBtn');
        if (bottomCancel) bottomCancel.click();
      });
    }

    // Structured editor — event delegation for dynamic elements
    var structuredEditor = document.getElementById('structuredEditor');
    
    // Module-level variables for file editing context (prevent listener accumulation)
    var _fileEditContext = null; // { itemEl, currentFile, currentTabId }

    // Exposed on app for onclick access
    app.editExistingFile = function(tabId, file) {
      var fileEditMode = document.getElementById('fileEditMode');
      var fileEditTitle = document.getElementById('fileEditTitle');
      var fileEditContent = document.getElementById('fileEditContent');
      if (!fileEditMode || !fileEditTitle || !fileEditContent) return;

      // Ensure parent section is visible
      var filesSection = document.getElementById('fullFilesSection');
      if (filesSection) filesSection.style.display = 'block';

      fileEditTitle.value = file.name;
      fileEditContent.value = file.content || '';
      fileEditMode.style.display = 'block';

      _fileEditContext = {
        itemEl: null,
        currentFile: file.name,
        currentTabId: tabId
      };
    }

    // File save/cancel handlers — defined ONCE, reuse context
    function saveFileHandler() {
      if (!_fileEditContext) return;
      var ctx = _fileEditContext;
      // Resolve real tabId from DOM to prevent cross-tab data leak
      var detail = document.getElementById('expandedPanel') || document.getElementById('tabDetail');
      var realTabId = (detail && detail.getAttribute('data-current-tab')) || ctx.currentTabId;
      var fileEditTitle = document.getElementById('fileEditTitle');
      var fileEditContent = document.getElementById('fileEditContent');
      var fileEditMode = document.getElementById('fileEditMode');
      
      var newTitle = fileEditTitle ? fileEditTitle.value.trim() : '';
      var newContent = fileEditContent ? fileEditContent.value : '';
      if (!newTitle) { alert('Faila nosaukums ir obligāts.'); return; }
      
      var tabData = app.loadData();
      var currentTab = null;
      for (var i = 0; i < tabData.tabs.length; i++) {
        if (tabData.tabs[i].id === realTabId) { currentTab = tabData.tabs[i]; break; }
      }
      if (!currentTab) return;
      if (!currentTab.files) currentTab.files = [];
      
      var found = false;
      for (var j = 0; j < currentTab.files.length; j++) {
        if (currentTab.files[j].name === ctx.currentFile) {
          currentTab.files[j].content = newContent;
          if (newTitle !== ctx.currentFile) {
            currentTab.files[j].name = newTitle;
          }
          found = true;
          break;
        }
      }
      if (!found) {
        currentTab.files.push({ name: newTitle, content: newContent });
      }

      // Update tag if title changed AND we have an editor item
      if (newTitle !== ctx.currentFile && ctx.itemEl) {
        ctx.itemEl.setAttribute('data-file', newTitle);
        var tagsContainer = ctx.itemEl.querySelector('.section-item-tags');
        if (tagsContainer) {
          tagsContainer.innerHTML = '<span class="section-tag">' + escHtml(newTitle) + ' <button class="tag-remove" title="Noņemt tagu">✕</button></span>';
        }
      }
      // Even if title didn't change, ensure data-file is set on the item
      if (ctx.itemEl && newTitle === ctx.currentFile) {
        ctx.itemEl.setAttribute('data-file', newTitle);
      }
      
      currentTab.updated = new Date().toISOString();
      app.saveData(tabData);
      if (fileEditMode) fileEditMode.style.display = 'none';
      
      // Refresh expanded content + file list immediately
      _refreshExpandedView(realTabId, tabData);
      
      _fileEditContext = null;
    }
    
    function cancelFileHandler() {
      var fileEditMode = document.getElementById('fileEditMode');
      if (fileEditMode) fileEditMode.style.display = 'none';
      _fileEditContext = null;
    }

    function _refreshExpandedView(tabId, tabData) {
      // Atjaunina expanded content (ja ir redzams) un full-files sekciju
      var contentEl = document.getElementById('expandedContent');
      var filesSection = document.getElementById('fullFilesSection');
      var fileList = document.getElementById('fileList');
      
      var tab = null;
      for (var i = 0; i < tabData.tabs.length; i++) {
        if (tabData.tabs[i].id === tabId) { tab = tabData.tabs[i]; break; }
      }
      if (!tab) return;
      
      // Refresh summary view (ja nav edit režīmā)
      var editMode = document.getElementById('editMode');
      if (contentEl && (!editMode || editMode.style.display === 'none' || !editMode.style.display)) {
        contentEl.innerHTML = app.renderSummaryHtml(tab);
      }
      
      // Refresh file list
      if (filesSection && fileList) {
        fileList.innerHTML = '';
        if (tab.files && tab.files.length > 0) {
          tab.files.forEach(function(file) {
            var li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = '<span class="file-item-name">📄 ' + escHtml(file.name) + '</span>' +
              '<span class="file-item-actions">' +
                '<button class="file-edit-btn" title="Rediģēt">✏️</button>' +
                '<button class="file-delete-btn" title="Dzēst">🗑️</button>' +
              '</span>';
            li.querySelector('.file-item-name').onclick = function() { app.viewFile(tab.id, file.name); };
            li.querySelector('.file-edit-btn').onclick = function(e) { e.stopPropagation(); app.editExistingFile(tab.id, file); };
            li.querySelector('.file-delete-btn').onclick = function(e) {
              e.stopPropagation();
              if (!confirm('⚠️ Dzēst failu ' + file.name + '?')) return;
              var d = app.loadData();
              for (var i = 0; i < d.tabs.length; i++) {
                if (d.tabs[i].id === tab.id) {
                  d.tabs[i].files = d.tabs[i].files.filter(function(f) { return f.name !== file.name; });
                  d.tabs[i].updated = new Date().toISOString();
                  break;
                }
              }
              app.saveData(d);
              _refreshExpandedView(tab.id, d);
            };
            fileList.appendChild(li);
          });
          filesSection.style.display = 'block';
        } else {
          filesSection.style.display = 'none';
        }
      }
      
      // Update timestamp
      var updatedEl = document.getElementById('expandedUpdated');
      if (updatedEl) updatedEl.textContent = 'Atjaunināts: ' + formatDate(tab.updated || new Date().toISOString());
    }
    
    if (structuredEditor) {
      // Add item
      structuredEditor.addEventListener('click', function(e) {
        var addBtn = e.target.closest('.add-item-btn');
        if (addBtn) {
          e.preventDefault();
          var sectionBlock = addBtn.closest('.section-block');
          if (!sectionBlock) return;
          var sectionIndex = sectionBlock.getAttribute('data-section-index');
          var itemsContainer = sectionBlock.querySelector('.section-items');
          if (!itemsContainer) return;

          var itemCount = itemsContainer.querySelectorAll('.section-item').length;
          var emptyItem = { checked: false, text: '', desc: '', file: '' };
          var itemHtml = renderSectionItemHTML(emptyItem, parseInt(sectionIndex), itemCount);
          // Use insertAdjacentHTML to add before the add button
          itemsContainer.insertAdjacentHTML('beforeend', itemHtml);

          // Focus the title input of the new item
          var newItem = itemsContainer.lastElementChild;
          if (newItem) {
            var titleInput = newItem.querySelector('.section-item-title');
            if (titleInput) setTimeout(function() { titleInput.focus(); }, 50);
          }
          return;
        }

        // Delete item
        var deleteBtn = e.target.closest('.section-item-delete');
        if (deleteBtn) {
          e.preventDefault();
          var itemEl = deleteBtn.closest('.section-item');
          if (itemEl) itemEl.remove();
          return;
        }

        // Remove tag
        var tagRemove = e.target.closest('.tag-remove');
        if (tagRemove) {
          e.preventDefault();
          var itemEl = tagRemove.closest('.section-item');
          if (itemEl) {
            var tagsContainer = itemEl.querySelector('.section-item-tags');
            if (tagsContainer) tagsContainer.innerHTML = '';
            itemEl.setAttribute('data-file', '');
          }
          return;
        }

        // Add context button — open full file editor
        var contextBtn = e.target.closest('.add-context-btn');
        if (contextBtn) {
          e.preventDefault();
          var itemEl = contextBtn.closest('.section-item');
          if (!itemEl) return;

          var titleInput = itemEl.querySelector('.section-item-title');
          var title = titleInput ? titleInput.value.trim() : '';
          if (!title) {
            alert('Vispirms ievadi ieraksta virsrakstu.');
            return;
          }

          var currentFile = itemEl.getAttribute('data-file') || '';

          if (!currentFile) {
            // Generate filename from title
            var filename = title.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/^-+|-+$/g, '') + '.md';
            if (!filename || filename === '.md') filename = 'konteksts-' + Date.now() + '.md';

            itemEl.setAttribute('data-file', filename);
            // Update button to show green checkmark
            contextBtn.innerHTML = uiIconHtml('uifile') + ' Paplašināts konteksts <span class="file-check" title="Pievienots paplašināts konteksts: ' + escAttr(filename) + '">✅</span>';
            currentFile = filename;
          }

          // Open file edit mode
          var fileEditMode = document.getElementById('fileEditMode');
          var fileEditTitle = document.getElementById('fileEditTitle');
          var fileEditContent = document.getElementById('fileEditContent');
          if (!fileEditMode || !fileEditTitle || !fileEditContent) return;

          // Load existing content if file exists
          var tabData = app.loadData();
          var currentTab = null;
          for (var i = 0; i < tabData.tabs.length; i++) {
            if (tabData.tabs[i].id === currentTabId) { currentTab = tabData.tabs[i]; break; }
          }

          var existingContent = '';
          if (currentTab && currentTab.files) {
            for (var j = 0; j < currentTab.files.length; j++) {
              if (currentTab.files[j].name === currentFile) {
                existingContent = currentTab.files[j].content || '';
                break;
              }
            }
          }

          fileEditTitle.value = currentFile;
          fileEditContent.value = existingContent;
          // Ensure parent section is visible
          var fs = document.getElementById('fullFilesSection');
          if (fs) fs.style.display = 'block';
          fileEditMode.style.display = 'block';

          // Smooth scroll to the file editor
          setTimeout(function() {
            fileEditMode.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);

          // Set context for the shared save/cancel handlers
          _fileEditContext = {
            itemEl: itemEl,
            currentFile: currentFile,
            currentTabId: currentTabId
          };
        }
      });

      // Checkbox change — toggle .checked class on section-item
      structuredEditor.addEventListener('change', function(e) {
        var checkbox = e.target.closest('.section-item-checkbox');
        if (checkbox) {
          var itemEl = checkbox.closest('.section-item');
          if (itemEl) {
            if (checkbox.checked) {
              itemEl.classList.add('checked');
            } else {
              itemEl.classList.remove('checked');
            }
          }
        }
      });

      // Item drag & drop event delegation
      structuredEditor.addEventListener('dragstart', function(e) { app._handleItemDragStart(e); });
      structuredEditor.addEventListener('dragover', function(e) { app._handleItemDragOver(e); });
      structuredEditor.addEventListener('drop', function(e) { app._handleItemDrop(e); });
      structuredEditor.addEventListener('dragend', function(e) { app._handleItemDragEnd(e); });
    }

    // Add file button
    var addFileBtn = document.getElementById('addFileBtn');
    if (addFileBtn) {
      addFileBtn.addEventListener('click', function() {
        var name = prompt('Faila nosaukums (ar .md):');
        if (!name) return;
        var content = prompt('Faila saturs (markdown):');
        if (content === null) return;
        var data = app.loadData();
        for (var i = 0; i < data.tabs.length; i++) {
          if (data.tabs[i].id === currentTabId) {
            if (!data.tabs[i].files) data.tabs[i].files = [];
            data.tabs[i].files.push({ name: name, content: content || '' });
            data.tabs[i].updated = new Date().toISOString();
            break;
          }
        }
        app.saveData(data);
        app.openTab(currentTabId);
      });
    }

    // File edit save/cancel buttons — wired ONCE
    var fileEditSaveBtn = document.getElementById('fileEditSaveBtn');
    var fileEditCancelBtn = document.getElementById('fileEditCancelBtn');
    if (fileEditSaveBtn) fileEditSaveBtn.addEventListener('click', saveFileHandler);
    if (fileEditCancelBtn) fileEditCancelBtn.addEventListener('click', cancelFileHandler);

    // Tab grid drag & drop event delegation
    var tabGrid = document.getElementById('tabGrid');
    if (tabGrid) {
      tabGrid.addEventListener('dragstart', function(e) { app._handleTabDragStart(e); });
      tabGrid.addEventListener('dragover', function(e) { app._handleTabDragOver(e); });
      tabGrid.addEventListener('dragleave', function(e) { app._handleTabDragLeave(e); });
      tabGrid.addEventListener('drop', function(e) { app._handleTabDrop(e); });
      tabGrid.addEventListener('dragend', function(e) { app._handleTabDragEnd(e); });
    }

    // Version display
    var vf = document.getElementById('versionFooter');
    if (vf) vf.textContent = 'Konteksta logs v' + APP_VERSION + ' ' + BUILD_ENV;

    // Auto-check for new version (compare with version.txt on server)
    fetch('version.txt?t=' + Date.now(), { cache: 'no-cache' })
      .then(function(r) { return r.text(); })
      .then(function(remoteVer) {
        remoteVer = remoteVer.trim();
        if (remoteVer && remoteVer !== APP_VERSION) {
          if (vf) {
            vf.textContent = 'Konteksta logs v' + APP_VERSION + ' ' + BUILD_ENV + '  ⚡ v' + remoteVer + ' — spied lai atjauninātu!';
            vf.style.color = '#f59e0b';
            vf.style.cursor = 'pointer';
            vf.title = 'Spied lai atjauninātu uz v' + remoteVer;
            vf.onclick = function() {
              vf.textContent = '⏳ Atjaunina...';
              vf.style.color = '#f59e0b';
              _forceUpdate();
            };
          }
        }
      })
      .catch(function() { /* klusām */ });
  }

  // Force update: clear all caches + unregister SW + hard reload
  function _forceUpdate() {
    var done = 0;
    function reload() {
      done++;
      if (done >= 2) {
        // Hard reload — bypass browser cache
        var url = location.href.split('#')[0];
        if (url.indexOf('?') === -1) url += '?v=' + Date.now();
        else url += '&v=' + Date.now();
        location.replace(url);
      }
    }
    // Clear SW caches
    if ('caches' in window) {
      caches.keys().then(function(names) {
        Promise.all(names.map(function(n) { return caches.delete(n); })).then(reload);
      }).catch(reload);
    } else { reload(); }
    // Unregister Service Workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        Promise.all(regs.map(function(r) { return r.unregister(); })).then(reload);
      }).catch(reload);
    } else { reload(); }
  }

  /* ─── Export ───────────────────────────────────────────────────── */

  window.app = app;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
