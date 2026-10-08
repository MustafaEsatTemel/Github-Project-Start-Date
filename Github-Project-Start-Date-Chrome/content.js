// GitHub Project Start Date - Content Script

(function () {
  'use strict';

  let currentRepoKey = null;
  let cachedDate = null;
  let isRunning = false;
  let retryTimeouts = [];
  let pollInterval = null;
  let pollCounter = 0;

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

    return { owner, repo, key: `${owner}/${repo}` };
  }

  function getStartDateFromPage() {
    // Extract from modern GitHub React embedded JSON data (works for private repos and without API rate limits)
    const scripts = document.querySelectorAll(
      'script[type="application/json"][data-target*="embeddedData"], script[type="application/json"]'
    );

    for (const script of scripts) {
      const content = script.textContent;
      if (!content || (!content.includes('createdAt') && !content.includes('created_at'))) continue;

      try {
        const json = JSON.parse(content);
        const direct = json?.payload?.codeViewLayoutRoute?.repo?.createdAt ||
                       json?.payload?.repo?.createdAt ||
                       json?.repo?.createdAt;
        if (direct) return direct;

        // Recursive search for createdAt / created_at in payload
        function findDate(obj, depth = 0) {
          if (!obj || depth > 6) return null;
          if (typeof obj === 'object') {
            if (obj.createdAt && typeof obj.createdAt === 'string') return obj.createdAt;
            if (obj.created_at && typeof obj.created_at === 'string') return obj.created_at;
            for (const key of Object.keys(obj)) {
              const res = findDate(obj[key], depth + 1);
              if (res) return res;
            }
          }
          return null;
        }

        const found = findDate(json.payload || json);
        if (found) return found;
      } catch (e) {
        // Fallback to regex
      }

      // Regex fallback
      const repoMatch = content.match(/"repo"\s*:\s*\{[^}]*"createdAt"\s*:\s*"([^"]+)"/);
      if (repoMatch && repoMatch[1]) {
        return repoMatch[1];
      }

      const match = content.match(/"created_?[aA]t"\s*:\s*"([^"]+)"/);
      if (match && match[1]) {
        return match[1];
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

  function injectStyles() {
    if (document.getElementById('gh-project-start-date-style')) return;

    const style = document.createElement('style');
    style.id = 'gh-project-start-date-style';
    style.textContent = `
      .gh-start-date-header-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 10px;
        margin-left: 10px;
        font-size: 12px;
        font-weight: 500;
        line-height: 18px;
        vertical-align: middle;
        border-radius: 2em;
        background-color: rgba(56, 139, 253, 0.12);
        border: 1px solid rgba(56, 139, 253, 0.35);
        color: var(--fgColor-muted, #8b949e);
        white-space: nowrap;
        animation: gh-fade-in 0.3s ease;
      }
      .gh-start-date-header-badge-icon {
        flex-shrink: 0;
        color: var(--fgColor-muted, #8b949e);
      }
      .gh-start-date-header-badge strong {
        font-weight: 600;
        background: linear-gradient(45deg, #ff6b6b, #f7e272, #60d394, #5085f0);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        color: #ff6b6b;
        animation: gh-gradient-anim 4s ease infinite;
      }
      .project-start-date-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        margin-bottom: 10px;
        font-size: 13px;
        line-height: 1.5;
        animation: gh-fade-in 0.3s ease;
      }
      .project-start-date-icon {
        flex-shrink: 0;
        color: var(--fgColor-muted, #8b949e);
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
      @keyframes gh-fade-in {
        from { opacity: 0; transform: translateY(-2px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes gh-gradient-anim {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectHeaderBadge(formatted) {
    if (document.getElementById('gh-project-start-date-header')) return true;

    // 1. Primary target: repo visibility label ("Public" / "Private") in header bar
    let target = document.querySelector(
      '#repo-title-component [data-testid="repo-visibility-label"], ' +
      'span[data-testid="repo-visibility-label"], ' +
      '#repo-title-component span.Label, ' +
      '#repo-title-component span[data-component="Label"]'
    );

    // 2. Secondary target: title / repo name element
    if (!target) {
      target = document.querySelector(
        '#repo-title-component h1, ' +
        '#repo-title-component strong[itemprop="name"], ' +
        'div[class*="CodeViewHeader-module__TitleWrapper"] h1, ' +
        'div[class*="TitleWrapper"]'
      );
    }

    // 3. Fallback for older GitHub layouts:
    if (!target) {
      target = document.querySelector(
        '#repository-container-header span.Label, ' +
        'h1.public > span.Label, ' +
        'h1.private > span.Label'
      );
    }

    if (!target) return false;

    const badge = document.createElement('span');
    badge.id = 'gh-project-start-date-header';
    badge.className = 'gh-start-date-header-badge';
    badge.title = `Project created on ${formatted}`;
    badge.innerHTML = `
      <svg class="octicon octicon-calendar gh-start-date-header-badge-icon" viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
        <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-1.5H2.75a.25.25 0 0 0-.25.25V6h11V6.25a.25.25 0 0 0-.25-.25Z"></path>
      </svg>
      <span>Started on <strong>${formatted}</strong></span>
    `;

    target.after(badge);
    return true;
  }

  function findAllSidebarTargets() {
    const results = [];

    // Find all "About" headings in the page (mobile header + desktop sidebar)
    const aboutHeadings = Array.from(document.querySelectorAll('h2')).filter(
      h => h.textContent.trim().toLowerCase() === 'about'
    );

    for (const heading of aboutHeadings) {
      const section = heading.closest('div[class*="SidebarSection"], div[class*="borderGrid"], .BorderGrid-cell') || heading.parentElement;
      if (!section) continue;

      if (section.querySelector('.project-start-date-container')) {
        continue;
      }

      // 1. Topic tags in this section
      const topicEl = section.querySelector(
        'div[class*="TopicTagGroup"], div[class*="list-topics-container"], div[class*="topic-tag-action"]'
      );
      if (topicEl) {
        results.push({ containerEl: section, anchorEl: topicEl, position: 'after' });
        continue;
      }

      // 2. Description in this section
      const descEl = section.querySelector(
        'div[class*="SidebarAbout-module__noDescription"], p[class*="SidebarAbout-module__description"]'
      );
      if (descEl) {
        results.push({ containerEl: section, anchorEl: descEl, position: 'after' });
        continue;
      }

      // 3. Insights block in this section
      const insightsEl = section.querySelector(
        'div[class*="SidebarAbout-module__insights"], div[class*="SidebarAbout-module__insightLinks"]'
      );
      if (insightsEl) {
        results.push({ containerEl: section, anchorEl: insightsEl, position: 'before' });
        continue;
      }

      // 4. Fallback: right after heading
      results.push({ containerEl: section, anchorEl: heading, position: 'after' });
    }

    // Fallback if no About heading is found (e.g. older GitHub UI layout)
    if (results.length === 0) {
      const borderGridCell = document.querySelector('.BorderGrid-cell');
      if (borderGridCell && !borderGridCell.querySelector('.project-start-date-container')) {
        results.push({ containerEl: borderGridCell, anchorEl: borderGridCell, position: 'append' });
      }
    }

    return results;
  }

  function injectSidebarBadge(formatted) {
    const targets = findAllSidebarTargets();
    if (targets.length === 0) return false;

    let insertedCount = 0;
    for (const targetInfo of targets) {
      const { containerEl, anchorEl, position } = targetInfo;

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
        if (anchorEl.nextSibling !== badge) anchorEl.after(badge);
      } else if (position === 'before') {
        if (anchorEl.previousSibling !== badge) anchorEl.before(badge);
      } else if (position === 'append') {
        if (badge.parentElement !== anchorEl) anchorEl.appendChild(badge);
      }

      insertedCount++;
    }

    return insertedCount > 0;
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

    // 1. Inject into header bar (The user's red box next to Public/Private)
    const headerSuccess = injectHeaderBadge(formatted);

    // 2. Inject into About sidebar
    const sidebarSuccess = injectSidebarBadge(formatted);

    return headerSuccess || sidebarSuccess;
  }

  async function processPage() {
    const repoInfo = getRepoDetails();
    if (!repoInfo) {
      cleanupElements();
      return;
    }

    if (currentRepoKey !== repoInfo.key) {
      currentRepoKey = repoInfo.key;
      cachedDate = null;
      cleanupElements();
    }

    // Check if both header and sidebar badges are already present
    const hasHeader = !!document.getElementById('gh-project-start-date-header');
    const hasSidebar = !!document.querySelector('.project-start-date-container');
    if (hasHeader && hasSidebar) {
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

  function cleanupElements() {
    const headerBadge = document.getElementById('gh-project-start-date-header');
    if (headerBadge) headerBadge.remove();
    document.querySelectorAll('.project-start-date-container').forEach(el => el.remove());
  }

  function stopRetries() {
    retryTimeouts.forEach(t => clearTimeout(t));
    retryTimeouts = [];
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    pollCounter = 0;
  }

  function scheduleRetries() {
    stopRetries();

    // 1. Milestones: 300ms, 800ms, 1500ms, 3000ms, 5000ms (5 seconds as requested)
    const milestones = [300, 800, 1500, 3000, 5000];
    for (const ms of milestones) {
      retryTimeouts.push(setTimeout(processPage, ms));
    }

    // 2. Active interval check: every 1s up to 6s, guaranteeing React late-mounting is caught
    pollInterval = setInterval(() => {
      pollCounter++;
      if (pollCounter > 6) {
        clearInterval(pollInterval);
        pollInterval = null;
        return;
      }

      const hasHeader = !!document.getElementById('gh-project-start-date-header');
      const hasSidebar = !!document.querySelector('.project-start-date-container');

      if (!hasHeader || !hasSidebar) {
        processPage();
      } else {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }, 1000);
  }

  function onNavigation() {
    processPage();
    scheduleRetries();
  }

  // Handle initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onNavigation);
  } else {
    onNavigation();
  }

  // Handle GitHub SPA navigation (Turbo / PJAX / soft navigation)
  document.addEventListener('turbo:load', onNavigation);
  document.addEventListener('turbo:render', onNavigation);
  document.addEventListener('pjax:end', onNavigation);

  // MutationObserver to catch asynchronous React DOM updates in the header and sidebar
  let debounceTimeout = null;
  const observer = new MutationObserver(() => {
    if (!getRepoDetails()) return;
    const hasHeader = !!document.getElementById('gh-project-start-date-header');
    const hasSidebar = !!document.querySelector('.project-start-date-container');
    if (!hasHeader || !hasSidebar) {
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
