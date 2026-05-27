(function() {
  'use strict';

  /* ─── Constants ─────────────────────────────────────────────────── */
  var STORAGE_KEY = 'kontekstalogas-data';
  var APP_VERSION = '1.3.2';
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
    var html = data.tabs.map(function(tab) {
      var hasImage = tab.image && tab.image.length > 0;
      var noImgClass = hasImage ? '' : ' no-image';
      var color = escAttr(tab.color || '#6366f1');
      var id = escAttr(tab.id);
      var icon = escHtml(tab.icon || '📄');
      var name = escHtml(tab.name || 'Untitled');
      var imgHtml = '';
      if (hasImage) {
        imgHtml = '<div class="tab-card-image" style="background-image:url(' + escAttr(tab.image) + ')"></div>';
      }
      return '<div class="tab-card' + noImgClass + '" style="--tab-color: ' + color + '" onclick="app.openTab(\'' + id + '\')" data-tab-id="' + id + '">' +
        '<div class="tab-card-header">' +
          '<div class="tab-card-icon">' + icon + '</div>' +
          '<div class="tab-card-title">' + name + '</div>' +
        '</div>' +
        imgHtml +
      '</div>';
    }).join('');
    grid.innerHTML = html;
  };

  /* ─── Tab Detail — Flask stilā ───────────────────────────────── */

  app.openTab = function(tabId) {
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
    if (titleEl) titleEl.textContent = (tab.icon || '📄') + ' ' + (tab.name || '');

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
            li.innerHTML = '<span class="file-item-name">📄 ' + escHtml(file.name) + '</span>' +
              '<span class="file-item-actions">' +
                '<button class="file-edit-btn" title="Rediģēt">✏️</button>' +
                '<button class="file-delete-btn" title="Dzēst">🗑️</button>' +
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
  };

  app.closeTab = function() {
    var grid = document.getElementById('tabGrid');
    if (grid) grid.classList.remove('hidden');

    var panel = document.getElementById('expandedPanel');
    if (panel) panel.classList.remove('visible');

    currentTabId = null;
    app.renderAll();
  };

  /* ─── Summary Rendering ───────────────────────────────────────── */

  app.renderSummaryHtml = function(tab) {
    if (!tab || !tab.summary) return '';
    var text = tab.summary;
    var tabId = tab.id;
    var parts = text.split(/(?=^## )/m);
    var html = '';

    parts.forEach(function(part) {
      part = part.trim();
      if (!part) return;

      var headingMatch = part.match(/^## (.+)$/m);
      if (headingMatch) {
        var heading = escHtml(headingMatch[1]);
        html += '<h3>' + heading + '</h3>';

        // Content after heading
        var rest = part.replace(/^## .+$/m, '').trim();
        var lines = rest.split('\n');
        var inList = false;
        var listItems = [];

        lines.forEach(function(line) {
          line = line.trim();
          if (!line) return;

          // Checkbox item: - [ ] text
          var cbMatch = line.match(/^- \[(.)\] (.+)$/);
          if (cbMatch) {
            var checked = cbMatch[1];
            var itemText = cbMatch[2];
            var isChecked = (checked === 'x' || checked === 'X');
            var cbHtml = '<span class="cb-icon' + (isChecked ? ' cb-checked' : ' cb-unchecked') + '"></span>';
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

    // Checkbox list items
    html = html.replace(/^- \[(.)\] (.+)$/gm, function(match, checked, text) {
      var isChecked = (checked === 'x' || checked === 'X');
      return '<li class="summary-item"><span class="cb-icon' + (isChecked ? ' cb-checked' : ' cb-unchecked') + '"></span><span class="summary-item-text">' + text + '</span></li>';
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

    // Split by section headings
    var sectionRegex = /^## (🎯|⏰|💡) (.+)$/gm;
    var parts = [];
    var lastIndex = 0;
    var match;
    while ((match = sectionRegex.exec(md)) !== null) {
      if (lastIndex < match.index) {
        parts.push({ type: 'content', text: md.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'heading', icon: match[1], text: match[2], index: match.index });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < md.length) {
      parts.push({ type: 'content', text: md.slice(lastIndex) });
    }

    var currentSection = null;
    var itemRegex = /^- \[([ x])\] (?:\[([^\]]+)\]\(full\/([^\)]+)\)(?:\s*—\s*(.+))?|(.+))$/gm;

    parts.forEach(function(part) {
      if (part.type === 'heading') {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: part.icon + ' ' + part.text,
          items: []
        };
      } else if (part.type === 'content' && currentSection) {
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
          currentSection.items.push(item);
        }
      }
    });
    if (currentSection) {
      sections.push(currentSection);
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
    return '<div class="section-item' + checkedClass + '" data-section="' + sectionIndex + '" data-item="' + itemIndex + '" data-file="' + escAttr(file) + '">' +
      '<div class="section-item-header">' +
        '<input type="checkbox" class="section-item-checkbox" ' + checkedAttr + '>' +
        '<input type="text" class="section-item-title" value="' + escAttr(item.text) + '" placeholder="Ieraksta virsraksts">' +
        '<button class="section-item-delete" title="Dzēst ierakstu">🗑️</button>' +
      '</div>' +
      '<input type="text" class="section-item-desc" value="' + escAttr(desc) + '" placeholder="Apraksts (pēc izvēles)...">' +
      '<div class="section-item-tags">' +
        (file ? '<span class="section-tag">' + escHtml(file) + ' <button class="tag-remove" title="Noņemt tagu">✕</button></span>' : '') +
      '</div>' +
      '<button class="add-context-btn">📄 Paplašināts konteksts</button>' +
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
        '.section-item { border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 8px; background: var(--bg-secondary); }' +
        '.section-item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }' +
        '.section-item-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); flex-shrink: 0; }' +
        '.section-item-title { flex: 1; background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 14px; color: var(--text-primary); outline: none; }' +
        '.section-item-title:focus { border-color: var(--accent); }' +
        '.section-item-desc { width: 100%; background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; color: var(--text-secondary); outline: none; box-sizing: border-box; margin-bottom: 8px; }' +
        '.section-item-desc:focus { border-color: var(--accent); }' +
        '.section-item-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; min-height: 26px; }' +
        '.section-tag { display: inline-flex; align-items: center; gap: 4px; background: var(--accent); color: #fff; font-size: 12px; padding: 3px 10px; border-radius: 12px; }' +
        '.section-tag .tag-remove { background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 12px; padding: 0; line-height: 1; }' +
        '.section-tag .tag-remove:hover { color: #fff; }' +
        '.add-item-btn { display: block; width: 100%; border: 2px dashed var(--border); border-radius: 8px; padding: 10px; background: transparent; color: var(--text-muted); font-size: 13px; cursor: pointer; transition: all 0.2s; margin-top: 4px; }' +
        '.add-item-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,0.05); }' +
        '.add-context-btn { background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }' +
        '.add-context-btn:hover { border-color: var(--accent); color: var(--accent); }' +
        '.section-item.checked .section-item-title { text-decoration: line-through; opacity: 0.6; }' +
        '.section-item.checked .section-item-desc { opacity: 0.6; }' +
        '.edit-mode-actions { display: flex; gap: 12px; margin-top: 16px; justify-content: flex-end; }' +
        '.edit-mode-actions .save-note-btn { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }' +
        '.edit-mode-actions .cancel-note-btn { background: transparent; border: 1px solid var(--border); border-radius: 8px; padding: 10px 20px; font-size: 14px; color: var(--text-muted); cursor: pointer; }' +
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
      html += '<h3>' + escHtml(section.heading) + '</h3>';
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
      summary: data.summary || '# ' + (data.name || 'Jauns tabs') + ' — Aktuālais\\n\\n' +
        '## 🎯 Šobrīd svarīgi\\n\\n' +
        '## ⏰ Tuvākajā laikā\\n\\n' +
        '## 💡 Piezīmes / Idejas\\n\\n',
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

    var preview = document.getElementById('emojiPreview');
    if (preview) preview.textContent = '📝';

    var colorInput = document.getElementById('editColor');
    if (colorInput) colorInput.value = '#6366f1';

    var bgInput = document.getElementById('editBgImage');
    if (bgInput) bgInput.value = '';

    var descInput = document.getElementById('editDesc');
    if (descInput) descInput.value = '';

    var bgPreview = document.getElementById('editBgPreview');
    if (bgPreview) { bgPreview.src = ''; bgPreview.style.display = 'none'; }

    // Reset emoji picker selection
    var emojiBtns = document.querySelectorAll('#emojiPicker .emoji-picker-btn');
    emojiBtns.forEach(function(b) { b.classList.remove('selected'); });

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

    var preview = document.getElementById('emojiPreview');
    if (preview) preview.textContent = tab.icon || '📝';

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

    // Highlight selected emoji in picker
    var emojiBtns = document.querySelectorAll('#emojiPicker .emoji-picker-btn');
    emojiBtns.forEach(function(b) { b.classList.remove('selected'); });
    if (tab.icon) {
      emojiBtns.forEach(function(b) {
        if (b.textContent === tab.icon) b.classList.add('selected');
      });
    }

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

    // If emoji picker has a selected item, use that
    var selectedEmoji = document.querySelector('#emojiPicker .emoji-picker-btn.selected');
    if (selectedEmoji) icon = selectedEmoji.textContent;

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
        summary: '# ' + icon + ' ' + name + '\n\n'
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

  /* ─── Emoji Picker ─────────────────────────────────────────────── */

  function initEmojiPicker() {
    var container = document.getElementById('emojiPicker');
    if (!container) return;

    var emojis = [
      '📝', '📄', '📋', '📌', '📎', '📁', '📂', '🗂️',
      '📅', '📆', '⏰', '🔔', '🔒', '🔓', '🔑', '🔧',
      '💡', '💭', '💬', '🗨️', '💼', '📊', '📈', '📉',
      '🎯', '🎨', '🎬', '🎮', '🎲', '🎭', '🎪', '🎤',
      '🏠', '🏢', '🏫', '🏥', '🏦', '🏪', '🏗️', '🏔️',
      '❤️', '💙', '💚', '💛', '💜', '🧡', '🖤', '🤍',
      '⭐', '🌟', '✨', '🔥', '💧', '🌈', '🌍', '🌱',
      '🚀', '✈️', '🚗', '🚲', '🚢', '🚃', '🛸', '🛵',
      '👤', '👥', '🤝', '👨‍👩‍👧‍👦', '💑', '🎉', '🎊', '🏆'
    ];

    container.innerHTML = emojis.map(function(e) {
      return '<button class="emoji-picker-btn" type="button" data-emoji="' + escAttr(e) + '">' + escHtml(e) + '</button>';
    }).join('');

    container.querySelectorAll('.emoji-picker-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        container.querySelectorAll('.emoji-picker-btn').forEach(function(b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        var preview = document.getElementById('emojiPreview');
        if (preview) preview.textContent = btn.textContent;
        var iconInput = document.getElementById('editIcon');
        if (iconInput) iconInput.value = btn.textContent;
      });
    });
  }

  /* Public wrapper for HTML onclick */
  app.selectEmoji = function(emoji) {
    var container = document.getElementById('emojiPicker');
    if (!container) return;
    var btns = container.querySelectorAll('.emoji-picker-btn');
    btns.forEach(function(b) { b.classList.remove('selected'); });
    btns.forEach(function(b) {
      if (b.textContent === emoji) b.classList.add('selected');
    });
    var preview = document.getElementById('emojiPreview');
    if (preview) preview.textContent = emoji;
  };

  app.selectColor = function(color) {
    var input = document.getElementById('editColor');
    if (input) input.value = color;
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

    // Default GET (bez ?raw=1) — Worker atgriež izparsētu JSON
    fetch(GH_PROXY_URL, {
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
        var preview = document.getElementById('emojiPreview');
        if (preview) preview.textContent = this.value || '📝';
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

    // Push button — telefona dati → GitHub
    var pushBtn = document.getElementById('pushBtn');
    if (pushBtn) {
      pushBtn.addEventListener('click', function() {
        pushBtn.textContent = '⏳ Push...';
        pushBtn.disabled = true;

        var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocal) {
          // PC: git pull + push caur serveri
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
          // Telefons: push caur Worker
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
        if (confirm('Atjaunināt aplikāciju uz jaunāko versiju?\\n\\nTiks notīrīts kešs un pārlādēta lapa. Dati localStorage saglabāsies.')) {
          // Notīra visus SW kešus
          if ('caches' in window) {
            caches.keys().then(function(names) {
              names.forEach(function(name) { caches.delete(name); });
            });
          }
          // Noņem Service Worker
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(reg) { reg.unregister(); });
            });
          }
          // Pārlādē
          setTimeout(function() { location.reload(true); }, 500);
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

            // Set the file tag on the item
            var tagsContainer = itemEl.querySelector('.section-item-tags');
            if (tagsContainer) {
              tagsContainer.innerHTML = '<span class="section-tag">' + escHtml(filename) + ' <button class="tag-remove" title="Noņemt tagu">✕</button></span>';
            }
            itemEl.setAttribute('data-file', filename);
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

    // Version display
    var vf = document.getElementById('versionFooter');
    if (vf) vf.textContent = 'Konteksta logs v' + APP_VERSION + ' ' + BUILD_ENV;

    // Auto-check for new version (compare with version.txt on server)
    fetch('version.txt?t=' + Date.now(), { cache: 'no-cache' })
      .then(function(r) { return r.text(); })
      .then(function(remoteVer) {
        remoteVer = remoteVer.trim();
        if (remoteVer && remoteVer !== APP_VERSION) {
          if (vf) vf.textContent = 'Konteksta logs v' + APP_VERSION + ' ' + BUILD_ENV + '  ⚡ v' + remoteVer + ' pieejama!';
          vf.style.color = '#f59e0b';
          vf.style.cursor = 'pointer';
          vf.title = 'Spied lai atjauninātu uz v' + remoteVer;
          vf.onclick = function() {
            if (confirm('Atjaunināt uz v' + remoteVer + '?')) {
              caches.keys().then(function(names) { names.forEach(function(n) { caches.delete(n); }); });
              navigator.serviceWorker.getRegistrations().then(function(regs) { regs.forEach(function(r) { r.unregister(); }); });
              setTimeout(function() { location.reload(true); }, 300);
            }
          };
        }
      })
      .catch(function() { /* klusām — nav kritiski */ });
  }

  /* ─── Export ───────────────────────────────────────────────────── */

  window.app = app;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
