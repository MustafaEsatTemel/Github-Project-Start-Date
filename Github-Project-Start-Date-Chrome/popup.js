// GitHub Project Start Date - Popup Script

document.addEventListener('DOMContentLoaded', function () {
  const startDateEl = document.getElementById('start-date');
  const repoNameEl = document.getElementById('repo-name');

  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    if (!tabs || tabs.length === 0) {
      showError('Unable to access active tab.');
      return;
    }

    const tab = tabs[0];
    const url = tab.url || '';

    if (!url.includes('github.com')) {
      showError('Not a GitHub repository page.');
      if (repoNameEl) repoNameEl.textContent = 'None';
      return;
    }

    let pathname = '';
    try {
      pathname = new URL(url).pathname;
    } catch (e) {
      showError('Invalid URL.');
      return;
    }

    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      showError('Navigate to a GitHub repository to see its start date.');
      if (repoNameEl) repoNameEl.textContent = 'GitHub Page';
      return;
    }

    const owner = parts[0];
    const repo = parts[1];

    if (repoNameEl) {
      repoNameEl.textContent = `${owner}/${repo}`;
    }

    // Attempt 1: Request date from content.js running in the active tab (works for private repos)
    try {
      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: 'getStartDate' }, (res) => {
          if (chrome.runtime.lastError || !res) {
            resolve(null);
          } else {
            resolve(res);
          }
        });
      });

      if (response && response.startDate) {
        displayDate(response.startDate);
        return;
      }
    } catch (err) {
      // Content script messaging failed, proceed to fallbacks
    }

    // Attempt 2: Fallback to GitHub REST API (for public repos)
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (res.ok) {
        const data = await res.json();
        if (data.created_at) {
          displayDate(data.created_at);
          return;
        }
      }
    } catch (err) {
      // API call failed
    }

    // Attempt 3: Execute script to read embedded page data directly via chrome.scripting
    if (chrome.scripting && tab.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const scripts = document.querySelectorAll(
              'script[type="application/json"][data-target*="embeddedData"], script[type="application/json"]'
            );
            for (const s of scripts) {
              const text = s.textContent;
              if (text && text.includes('createdAt')) {
                const m = text.match(/"repo"\s*:\s*\{[^}]*"createdAt"\s*:\s*"([^"]+)"/) || text.match(/"createdAt"\s*:\s*"([^"]+)"/);
                if (m && m[1]) return m[1];
              }
            }
            return null;
          }
        });

        if (results && results[0] && results[0].result) {
          displayDate(results[0].result);
          return;
        }
      } catch (err) {
        // Script execution failed
      }
    }

    showError('Could not determine repository start date.');
  });

  function displayDate(isoDate) {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) {
      showError('Invalid date received.');
      return;
    }

    const formattedDate = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    startDateEl.innerHTML = `
      <div class="date-badge">
        <span class="date-label">Created on</span>
        <span class="date-value">${formattedDate}</span>
      </div>
    `;
  }

  function showError(msg) {
    startDateEl.innerHTML = `<span class="error-msg">${msg}</span>`;
  }
});
