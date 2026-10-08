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

  function findAllInsertionTargets() {
    const results = [];

    // Collect all candidates: Desktop sidebars AND Mobile/Narrow headers
    const candidateContainers = document.querySelectorAll(
      'div[class*="CodeViewSidebar"], div[class*="HideWhenNarrow"], div[class*="Layout-sidebar"], div[class*="NarrowOnly"], .BorderGrid'
    );

    const allContainers = Array.from(candidateContainers);
    if (allContainers.length === 0) {
      const headings = document.querySelectorAll('h2');
      for (const h of headings) {
        if (h.textContent.trim().toLowerCase() === 'about') {
          const parent = h.closest('div[class*="SidebarSection"]') || h.parentElement;
          if (parent) allContainers.push(parent);
        }
      }
    }

    for (const containerEl of allContainers) {
      // Avoid inserting multiple times in nested containers
      if (containerEl.querySelector(':scope > .project-start-date-container')) {
        continue;
      }

      // 1. Topic tags (insert after topics so it sits right under description + topics)
      const topicEl = containerEl.querySelector(
        'div[class*="TopicTagGroup"], div[class*="list-topics-container"], div[class*="topic-tag-action"]'
      );
      if (topicEl) {
        results.push({ containerEl, anchorEl: topicEl, position: 'after' });
        continue;
      }

      // 2. Description or "No description"
      const descEl = containerEl.querySelector(
        'div[class*="SidebarAbout-module__noDescription"], p[class*="SidebarAbout-module__description"]'
      );
      if (descEl) {
        results.push({ containerEl, anchorEl: descEl, position: 'after' });
        continue;
      }

      // 3. Insights block (License, Activity, Stars, etc.)
      const insightsEl = containerEl.querySelector(
        'div[class*="SidebarAbout-module__insights"], div[class*="SidebarAbout-module__insightLinks"]'
      );
      if (insightsEl) {
        results.push({ containerEl, anchorEl: insightsEl, position: 'before' });
        continue;
      }

      // 4. Heading with "About"
      const headings = containerEl.querySelectorAll('h2');
      let aboutHeading = null;
      for (const h of headings) {
        if (h.textContent.trim().toLowerCase() === 'about') {
          aboutHeading = h;
          break;
        }
      }
      if (aboutHeading) {
        results.push({ containerEl, anchorEl: aboutHeading, position: 'after' });
        continue;
      }

      // 5. Legacy BorderGrid
      const legacyCell = containerEl.querySelector('.BorderGrid-cell');
      if (legacyCell) {
        results.push({ containerEl, anchorEl: legacyCell, position: 'append' });
      }
    }

    return results;
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
        color: #ff6b6b;
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

    injectStyles();

    const targets = findAllInsertionTargets();
    if (targets.length === 0) return false;

    let insertedCount = 0;

    for (const targetInfo of targets) {
      const { containerEl, anchorEl, position } = targetInfo;

      // Check if this container already has our date element
      let badge = containerEl.querySelector('.project-start-date-container');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'project-start-date-container';
      }

      badge.innerHTML = `
        <svg class="octicon octicon-calendar project-start-date-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-1.5H2.75a.25.25 0 0 0-.25.25V6h11V6.25a.25.25 0 0 0-.25-.25Z"></path>
        </svg>
        <span class="project-start-date-text">This project started on ${formatted}</span>
      `;

      if (position === 'after') {
        if (anchorEl.nextSibling !== badge) {
          anchorEl.after(badge);
        }
      } else if (position === 'before') {
        if (anchorEl.previousSibling !== badge) {
          anchorEl.before(badge);
        }
      } else if (position === 'append') {
        if (badge.parentElement !== anchorEl) {
          anchorEl.appendChild(badge);
        }
      }

      insertedCount++;
    }

    return insertedCount > 0;
  }

  async function processPage() {
    const repoInfo = getRepoDetails();
    if (!repoInfo) {
      document.querySelectorAll('.project-start-date-container').forEach(el => el.remove());
      return;
    }

    if (currentRepoKey !== repoInfo.key) {
      currentRepoKey = repoInfo.key;
      cachedDate = null;
      document.querySelectorAll('.project-start-date-container').forEach(el => el.remove());
    }

    // Check if the DESKTOP sidebar is already populated
    const desktopContainer = document.querySelector('div[class*="CodeViewSidebar"], div[class*="HideWhenNarrow"]');
    if (desktopContainer && desktopContainer.querySelector('.project-start-date-container')) {
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
    const desktopContainer = document.querySelector('div[class*="CodeViewSidebar"], div[class*="HideWhenNarrow"]');
    if (getRepoDetails() && (!desktopContainer || !desktopContainer.querySelector('.project-start-date-container'))) {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(processPage, 100);
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
