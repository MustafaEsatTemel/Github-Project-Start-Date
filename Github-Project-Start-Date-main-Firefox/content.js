// GitHub Project Start Date - Content Script

(function () {
  'use strict';

  let currentRepoKey = null;
  let cachedDate = null;
  let isRunning = false;

  const RESERVED_NAMES = new Set([
    'about', 'pricing', 'features', 'security', 'team', 'enterprise', 'customer-stories',
    'readme', 'premium-support', 'sponsors', 'login', 'join', 'settings', 'notifications',
    'explore', 'topics', 'trending', 'collections', 'events', 'marketplace', 'pulls',
    'issues', 'discussions', 'orgs', 'users', 'site', 'contact', 'search'
  ]);

  function getRepoDetails() {
    if (window.location.hostname !== 'github.com') return null;

    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];

    if (RESERVED_NAMES.has(owner.toLowerCase())) return null;

    // Only overview page or branch/tree views contain the repository About sidebar
    if (parts.length > 2 && parts[2] !== 'tree') {
      return null;
    }

    return { owner, repo, key: `${owner}/${repo}` };
  }

  function getStartDateFromPage() {
    // 1. Extract from modern GitHub React embedded JSON data (works for private repos and without rate limits)
    const scripts = document.querySelectorAll(
      'script[type="application/json"][data-target*="embeddedData"], script[type="application/json"]'
    );

    for (const script of scripts) {
      const content = script.textContent;
      if (!content || !content.includes('createdAt')) continue;

      // Primary: match "repo": { ... "createdAt": "..." }
      const repoMatch = content.match(/"repo"\s*:\s*\{[^}]*"createdAt"\s*:\s*"([^"]+)"/);
      if (repoMatch && repoMatch[1]) {
        return repoMatch[1];
      }

      // Secondary: match any "createdAt": "..."
      const dateMatch = content.match(/"createdAt"\s*:\s*"([^"]+)"/);
      if (dateMatch && dateMatch[1]) {
        return dateMatch[1];
      }
    }

    return null;
  }

  async function fetchStartDateFromAPI(owner, repo) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.created_at || null;
    } catch (e) {
      return null;
    }
  }

  function findInsertionTarget() {
    // 1. Modern GitHub: Description or "No description" element in sidebar
    const descEl = document.querySelector(
      'div[class*="SidebarAbout-module__noDescription"], p[class*="SidebarAbout-module__description"]'
    );
    if (descEl) {
      return { target: descEl, position: 'after' };
    }

    // 2. Modern GitHub: Insights block (License, Activity, Stars, etc.)
    const insightsEl = document.querySelector(
      'div[class*="SidebarAbout-module__insights"], div[class*="SidebarAbout-module__insightLinks"]'
    );
    if (insightsEl) {
      return { target: insightsEl, position: 'before' };
    }

    // 3. Modern GitHub: Heading with "About"
    const headings = document.querySelectorAll('h2');
    for (const h of headings) {
      if (h.textContent.trim().toLowerCase() === 'about') {
        return { target: h, position: 'after' };
      }
    }

    // 4. Legacy GitHub layouts
    const legacyAbout = document.querySelector('.BorderGrid-cell .f4');
    if (legacyAbout) {
      return { target: legacyAbout, position: 'append' };
    }

    const legacyCell = document.querySelector('.BorderGrid-row:first-child .BorderGrid-cell');
    if (legacyCell) {
      return { target: legacyCell, position: 'append' };
    }

    return null;
  }

  function injectStyles() {
    if (document.getElementById('gh-project-start-date-style')) return;

    const style = document.createElement('style');
    style.id = 'gh-project-start-date-style';
    style.textContent = `
      .project-start-date-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        margin-bottom: 10px;
        font-size: 13px;
        line-height: 1.5;
      }
      .project-start-date-icon {
        flex-shrink: 0;
        color: #8b949e;
        vertical-align: text-bottom;
      }
      .project-start-date-text {
        font-style: italic;
        font-weight: 600;
        background: linear-gradient(45deg, #ff6b6b, #f7e272, #60d394, #5085f0);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gh-gradient-anim 4s ease infinite;
      }
      @keyframes gh-gradient-anim {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  }

  function renderDate(isoDate) {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return false;

    const formatted = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const targetInfo = findInsertionTarget();
    if (!targetInfo) return false;

    injectStyles();

    let container = document.getElementById('gh-project-start-date');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gh-project-start-date';
      container.className = 'project-start-date-container';
    }

    container.innerHTML = `
      <svg class="octicon octicon-calendar project-start-date-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-1.5H2.75a.25.25 0 0 0-.25.25V6h11V6.25a.25.25 0 0 0-.25-.25Z"></path>
      </svg>
      <span class="project-start-date-text">This project started on ${formatted}</span>
    `;

    const { target, position } = targetInfo;
    if (position === 'after' && target.nextSibling !== container) {
      target.after(container);
    } else if (position === 'before' && target.previousSibling !== container) {
      target.before(container);
    } else if (position === 'append' && container.parentElement !== target) {
      target.appendChild(container);
    }

    return true;
  }

  async function processPage() {
    const repoInfo = getRepoDetails();
    if (!repoInfo) {
      const existing = document.getElementById('gh-project-start-date');
      if (existing) existing.remove();
      return;
    }

    if (currentRepoKey !== repoInfo.key) {
      currentRepoKey = repoInfo.key;
      cachedDate = null;
      const existing = document.getElementById('gh-project-start-date');
      if (existing) existing.remove();
    }

    if (document.getElementById('gh-project-start-date')) {
      return;
    }

    if (isRunning) return;
    isRunning = true;

    try {
      if (!cachedDate) {
        cachedDate = getStartDateFromPage();
        if (!cachedDate) {
          cachedDate = await fetchStartDateFromAPI(repoInfo.owner, repoInfo.repo);
        }
      }

      if (cachedDate) {
        renderDate(cachedDate);
      }
    } finally {
      isRunning = false;
    }
  }

  // Handle initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processPage);
  } else {
    processPage();
  }

  // Handle GitHub SPA navigation (Turbo / PJAX)
  document.addEventListener('turbo:load', processPage);
  document.addEventListener('turbo:render', processPage);
  document.addEventListener('pjax:end', processPage);

  // MutationObserver to catch asynchronous DOM updates in the sidebar
  let debounceTimeout = null;
  const observer = new MutationObserver(() => {
    if (!document.getElementById('gh-project-start-date') && getRepoDetails()) {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(processPage, 150);
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Handle messages from the extension popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStartDate') {
      const repoInfo = getRepoDetails();
      if (!repoInfo) {
        sendResponse({ error: 'Not a repository page' });
        return true;
      }

      if (cachedDate) {
        sendResponse({ startDate: cachedDate, owner: repoInfo.owner, repo: repoInfo.repo });
      } else {
        const fromPage = getStartDateFromPage();
        if (fromPage) {
          cachedDate = fromPage;
          sendResponse({ startDate: fromPage, owner: repoInfo.owner, repo: repoInfo.repo });
        } else {
          fetchStartDateFromAPI(repoInfo.owner, repoInfo.repo).then(date => {
            if (date) cachedDate = date;
            sendResponse({ startDate: date, owner: repoInfo.owner, repo: repoInfo.repo });
          });
          return true;
        }
      }
    }
    return true;
  });
})();
