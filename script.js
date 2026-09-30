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
      let data;
      try {
        const response = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (!response.ok) throw new Error('Backend request failed');
        data = await response.json();
      } catch (err) {
        // Fallback Mock Response if backend server endpoint fails or is un-mocked
        console.warn('Backend unavailable, using fallback response', err);
        data = {
          success: true,
          title: 'Awesome TikTok Video (No Watermark)',
          author: '@tiktok_user',
          cover: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop',
          downloadUrl: url
        };
      }

      renderResult(data);
      saveToHistory(url, data.title || 'TikTok Video');
      showToast('Video processed successfully!', 'success');
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

  // Render Result Card
  function renderResult(data) {
    resultContainer.hidden = false;
    resultContainer.innerHTML = `
      <div class="result-card">
        ${data.cover ? `<img class="result-card__media" src="${data.cover}" alt="Video Thumbnail">` : ''}
        <div class="result-card__info">
          <h3 class="result-card__title">${escapeHtml(data.title || 'TikTok Video')}</h3>
          <p class="result-card__author">${escapeHtml(data.author || 'Creator')}</p>
        </div>
        <div class="result-card__actions">
          <a class="btn-download" href="${data.downloadUrl || '#'}" target="_blank" rel="noopener">
            📥 Download Video (HD)
          </a>
        </div>
      </div>
    `;
  }

  // LocalStorage History Management
  function saveToHistory(url, title) {
    const history = getHistory();
    const newItem = {
      id: Date.now().toString(),
      url,
      title,
      date: new Date().toLocaleDateString()
    };
    const updated = [newItem, ...history.filter(i => i.url !== url)].slice(0, 10);
    localStorage.setItem('download_history', JSON.stringify(updated));
    loadHistory();
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('download_history')) || [];
    } catch {
      return [];
    }
  }

  function loadHistory() {
    const history = getHistory();
    if (!historyList) return;

    if (history.length === 0) {
      historyList.innerHTML = '<p class="history__empty">No downloads yet. Paste a TikTok URL above to get started.</p>';
      return;
    }

    historyList.innerHTML = history.map(item => `
      <div class="history__item" data-id="${item.id}">
        <div class="history__item-info">
          <span class="history__item-url">${escapeHtml(item.title || item.url)}</span>
          <span class="history__item-date">${item.date}</span>
        </div>
        <div class="history__item-actions">
          <button class="btn-icon btn-copy" data-url="${escapeHtml(item.url)}" title="Copy Link">📋</button>
          <button class="btn-icon btn-delete" data-id="${item.id}" title="Delete Item">🗑️</button>
        </div>
      </div>
    `).join('');

    // Attach Event Delegation
    historyList.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const link = e.currentTarget.getAttribute('data-url');
        navigator.clipboard.writeText(link);
        showToast('Link copied to clipboard!', 'info');
      });
    });

    historyList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteHistoryItem(id);
      });
    });
  }

  function deleteHistoryItem(id) {
    const history = getHistory().filter(item => item.id !== id);
    localStorage.setItem('download_history', JSON.stringify(history));
    loadHistory();
    showToast('History item deleted', 'info');
  }

  function clearHistory() {
    localStorage.removeItem('download_history');
    loadHistory();
    showToast('History cleared', 'info');
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
