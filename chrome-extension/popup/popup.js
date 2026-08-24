// UfuqLink Popup Logic

const $ = (id) => document.getElementById(id);

const screens = {
  scan: $("scan-screen"),
  loading: $("loading-screen"),
  results: $("results-screen"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function getCurrentTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]);
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  const tab = await getCurrentTab();
  $("current-url").textContent = tab?.url || "Unknown page";

  // Check last scan
  chrome.storage.local.get(`lastScan_${tab?.id}`, (result) => {
    const last = result[`lastScan_${tab?.id}`];
    if (last) {
      const ago = Math.round((Date.now() - last.timestamp) / 60000);
      $("last-scan").textContent = `Last scan: ${ago}m ago · Score ${last.score}/100`;
    }
  });

  // Scan button
  $("scan-btn").addEventListener("click", scanPage);

  // Results actions
  $("view-results-btn").addEventListener("click", () => {
    // Open full results in a new tab (UfuqAudit dashboard)
    chrome.tabs.create({ url: "https://ufuqaudit.app/dashboard" });
  });

  $("export-btn").addEventListener("click", exportCsv);

  $("ufuqaudit-btn").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://ufuqaudit.app" });
  });
});

async function scanPage() {
  showScreen("loading");
  $("loading-count").textContent = "";

  try {
    const tab = await getCurrentTab();

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: "scanPage" }, (response) => {
      if (chrome.runtime.lastError) {
        showScreen("scan");
        showError("Cannot scan this page. Try reloading the tab.");
        return;
      }

      if (!response) {
        showScreen("scan");
        showError("No response from page. Try reloading.");
        return;
      }

      processResults(response, tab.id);
    });
  } catch (err) {
    showScreen("scan");
    showError("Scan failed: " + err.message);
  }
}

function processResults(data, tabId) {
  const stats = data.stats;
  const issues =
    stats.genericAnchors + stats.emptyAnchors + stats.insecure + stats.duplicates;
  const broken = 0; // Would be set after HTTP checks
  const redirects = 0;
  const working = stats.totalLinks - issues;

  // Compute SEO score
  const penalty = issues * 3.5;
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  // Animate score
  animateScore(score);

  // Update stats
  $("stat-working").textContent = working;
  $("stat-redirects").textContent = redirects;
  $("stat-broken").textContent = broken;
  $("stat-issues").textContent = issues;
  $("stat-internal").textContent = stats.internal;
  $("stat-external").textContent = stats.external;
  $("stat-nofollow").textContent = stats.nofollow;
  $("stat-anchors").textContent = stats.genericAnchors + stats.emptyAnchors;

  // Save last scan
  chrome.storage.local.set({
    [`lastScan_${tabId}`]: {
      score,
      timestamp: Date.now(),
      url: data.url,
      stats,
    },
  });

  // Notify
  if (issues > 0) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "UfuqLink Scan Complete",
      message: `Found ${issues} SEO issues on this page. Score: ${score}/100`,
    });
  }

  showScreen("results");
}

function animateScore(target) {
  let current = 0;
  const circle = $("score-circle");
  const value = $("score-value");
  const circumference = 213.6;
  const color = target >= 80 ? "#10b981" : target >= 60 ? "#f59e0b" : target >= 40 ? "#f97316" : "#ef4444";

  circle.style.stroke = color;
  value.style.color = color;

  const interval = setInterval(() => {
    current += 2;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    value.textContent = current;
    const offset = circumference - (current / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }, 20);
}

function exportCsv() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    chrome.storage.local.get(`lastScan_${tab.id}`, (result) => {
      const last = result[`lastScan_${tab.id}`];
      if (!last) return;

      const rows = [["Metric", "Value"]];
      Object.entries(last.stats).forEach(([k, v]) => rows.push([k, v]));
      rows.push(["SEO Score", last.score]);
      rows.push(["URL", last.url]);

      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ufuqlink-${last.domain || "scan"}-${Date.now()}.csv`;
      a.click();
    });
  });
}

function showError(msg) {
  // Simple error display
  const el = $("last-scan");
  el.textContent = msg;
  el.style.color = "#ef4444";
}
