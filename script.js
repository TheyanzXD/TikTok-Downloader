/**
 * TikTok Downloader Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const downloadForm = document.getElementById('downloadForm');
  const urlInput = document.getElementById('urlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('spinner');
  const themeToggle = document.getElementById('themeToggle');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const resultContainer = document.getElementById('resultContainer');
  const toastContainer = document.getElementById('toast-container');

  // TikTok URL Validation Regex
  const TIKTOK_REGEX = /^https?:\/\/(www\.|v[mt]\.|t\.)?tiktok\.com\/.*$/i;

  // Initialize Theme
  initTheme();
  // Load History
  loadHistory();

  // Event Listeners
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (pasteBtn) {
    pasteBtn.addEventListener('click', handlePaste);
  }

  if (downloadForm) {
    downloadForm.addEventListener('submit', handleFormSubmit);
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
  }

  // Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
      themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (themeToggle) {
      themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    }
    showToast(`Switched to ${newTheme} mode`, 'info');
  }

  // Clipboard Paste Handler
  async function handlePaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text.trim();
          showToast('URL pasted from clipboard', 'info');
        } else {
          showToast('Clipboard is empty', 'warning');
        }
      } else {
        showToast('Clipboard access not supported by browser', 'warning');
      }
    } catch (err) {
      showToast('Failed to read clipboard', 'error');
    }
  }

  // Form Submit Handler
  async function handleFormSubmit(e) {
    e.preventDefault();
    const url = urlInput.value.trim();

    if (!url) {
      showToast('Please enter a TikTok URL', 'warning');
      return;
    }

    if (!TIKTOK_REGEX.test(url)) {
      showToast('Invalid TikTok URL format', 'error');
      return;
    }

    setLoading(true);
    resultContainer.hidden = true;
    resultContainer.innerHTML = '';

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to resolve TikTok URL');
      }

      renderResult(data);
      saveToHistory(url, data.title || 'TikTok Video');
      showToast('Media ready for download!', 'success');
    } catch (error) {
      showToast(error.message || 'An unexpected error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }

  // UI State Loading Toggle
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (spinner) spinner.hidden = !isLoading;
  }

  // Direct Blob Trigger File Download
  async function triggerDirectDownload(proxyUrl, filename, buttonEl) {
    if (!proxyUrl) return;

    const originalText = buttonEl.innerHTML;
    buttonEl.disabled = true;
    buttonEl.innerHTML = `<span>⏳ Downloading...</span>`;

    try {
      showToast('Starting file download...', 'info');
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename || 'tiktok-download.mp4';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        a.remove();
      }, 100);

      showToast('Download completed successfully!', 'success');
    } catch (err) {
      console.error('Direct download error:', err);
      showToast('Proxy download failed, trying fallback direct link...', 'warning');
      window.open(proxyUrl, '_blank');
    } finally {
      buttonEl.disabled = false;
      buttonEl.innerHTML = originalText;
    }
  }

  // Render Result Card
  function renderResult(data) {
    resultContainer.hidden = false;
    const authorName = data.uploader?.name || data.author || 'TikTok User';
    const authorHandle = data.uploader?.username ? `@${data.uploader.username}` : '';
    const downloads = data.downloads || {};
    const safeTitle = (data.title || 'tiktok-download').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);

    let downloadsHtml = '';

    if (downloads.noWatermark) {
      downloadsHtml += `
        <button class="btn-download btn-download--primary btn-download-trigger" data-url="${escapeHtml(downloads.noWatermark)}" data-filename="${safeTitle}.mp4">
          📥 Download Video (No Watermark)
        </button>`;
    }
    if (downloads.hd) {
      downloadsHtml += `
        <button class="btn-download btn-download--hd btn-download-trigger" data-url="${escapeHtml(downloads.hd)}" data-filename="${safeTitle}-hd.mp4">
          ✨ Download HD Video
        </button>`;
    }
    if (downloads.audio) {
      downloadsHtml += `
        <button class="btn-download btn-download--audio btn-download-trigger" data-url="${escapeHtml(downloads.audio)}" data-filename="${safeTitle}.mp3">
          🎵 Download Audio (MP3)
        </button>`;
    }

    if (downloads.images && downloads.images.length > 0) {
      downloadsHtml += `<div class="result-card__images-grid">`;
      downloads.images.forEach((imgObj, idx) => {
        const imgUrl = typeof imgObj === 'string' ? imgObj : imgObj.downloadUrl;
        downloadsHtml += `
          <div class="result-card__image-item">
            <img src="${typeof imgObj === 'string' ? imgObj : imgObj.url}" alt="Slide ${idx + 1}" loading="lazy">
            <button class="btn-download btn-download-trigger btn-sm" data-url="${escapeHtml(imgUrl)}" data-filename="${safeTitle}-slide-${idx + 1}.jpg">
              📥 Slide ${idx + 1}
            </button>
          </div>`;
      });
      downloadsHtml += `</div>`;
    }

    resultContainer.innerHTML = `
      <div class="result-card">
        ${data.cover ? `<img class="result-card__media" src="${data.cover}" alt="Video Thumbnail">` : ''}
        <div class="result-card__info">
          <h3 class="result-card__title">${escapeHtml(data.title || 'TikTok Media')}</h3>
          <p class="result-card__author">${escapeHtml(authorName)} ${escapeHtml(authorHandle)}</p>
        </div>
        <div class="result-card__actions">
          ${downloadsHtml}
        </div>
      </div>
    `;

    // Attach Click Event Listeners to Download Triggers
    resultContainer.querySelectorAll('.btn-download-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const proxyUrl = targetBtn.getAttribute('data-url');
        const filename = targetBtn.getAttribute('data-filename');
        triggerDirectDownload(proxyUrl, filename, targetBtn);
      });
    });
  }

  // LocalStorage History Management (Auto-cleans items older than 24 hours, cannot be manually deleted)
  const HISTORY_AUTO_CLEAN_MS = 24 * 60 * 60 * 1000; // 24 Hours

  function saveToHistory(url, title) {
    const history = getHistory();
    const newItem = {
      id: Date.now().toString(),
      url,
      title,
      timestamp: Date.now(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newItem, ...history.filter(i => i.url !== url)].slice(0, 10);
    localStorage.setItem('download_history', JSON.stringify(updated));
    loadHistory();
  }

  function getHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem('download_history')) || [];
      const now = Date.now();
      // System Auto-Clean: Filter out items older than 24 hours automatically
      const validItems = raw.filter(item => item.timestamp && (now - item.timestamp < HISTORY_AUTO_CLEAN_MS));
      if (validItems.length !== raw.length) {
        localStorage.setItem('download_history', JSON.stringify(validItems));
      }
      return validItems;
    } catch {
      return [];
    }
  }

  function loadHistory() {
    const history = getHistory();
    if (!historyList) return;

    if (history.length === 0) {
      historyList.innerHTML = '<p class="history__empty">No active downloads in history. Downloaded items auto-expire after 24h.</p>';
      return;
    }

    historyList.innerHTML = history.map(item => `
      <div class="history__item" data-id="${item.id}">
        <div class="history__item-info">
          <span class="history__item-url">${escapeHtml(item.title || item.url)}</span>
          <span class="history__item-date">Downloaded at ${item.date} • Auto-expires in 24h</span>
        </div>
        <div class="history__item-actions">
          <button class="btn-icon btn-copy" data-url="${escapeHtml(item.url)}" title="Copy TikTok Link">📋</button>
        </div>
      </div>
    `).join('');

    // Attach Copy Event Delegation
    historyList.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const link = e.currentTarget.getAttribute('data-url');
        navigator.clipboard.writeText(link);
        showToast('TikTok link copied to clipboard!', 'info');
      });
    });
  }

  // Toast System
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Utility Helper
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, match => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[match];
    });
  }
});
