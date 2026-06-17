// Application State
let appState = {
    updates: [],
    filteredUpdates: [],
    selectedUpdate: null,
    activeFilter: 'all',
    searchQuery: '',
    sortOrder: 'newest',
    theme: 'dark'
};

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const feedLoading = document.getElementById('feed-loading');
const feedEmpty = document.getElementById('feed-empty');
const feedError = document.getElementById('feed-error');
const errorMessageEl = document.getElementById('error-message');
const btnRetry = document.getElementById('btn-retry');
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const themeCheckbox = document.getElementById('checkbox-theme');
const typeFiltersContainer = document.getElementById('type-filters');

// Stats Elements
const countAll = document.getElementById('count-all');
const countFeature = document.getElementById('count-feature');
const countAnnouncement = document.getElementById('count-announcement');
const countIssue = document.getElementById('count-issue');
const statCards = document.querySelectorAll('.stat-card');

// Composer Elements
const composerEmptyState = document.getElementById('composer-empty-state');
const composerActiveState = document.getElementById('composer-active-state');
const tweetTemplateSelect = document.getElementById('tweet-template');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCountSpan = document.getElementById('char-count');
const progressCircle = document.getElementById('progress-circle');
const btnCopyTweet = document.getElementById('btn-copy-tweet');
const btnShareTweet = document.getElementById('btn-share-tweet');
const apiStatusText = document.getElementById('status-text');
const apiStatusDot = document.querySelector('.status-dot');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchUpdates();
    setupEventListeners();
});

// Setup Theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    appState.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme checkbox state
    if (themeCheckbox) {
        themeCheckbox.checked = (theme === 'light');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Theme Toggle Switch
    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', () => {
            const newTheme = themeCheckbox.checked ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    // Export CSV Button
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', exportToCSV);
    }

    // Refresh buttons
    btnRefresh.addEventListener('click', fetchUpdates);
    btnRetry.addEventListener('click', fetchUpdates);

    // Search Input
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase();
        renderFeed();
    });

    // Sort Dropdown
    sortSelect.addEventListener('change', (e) => {
        appState.sortOrder = e.target.value;
        renderFeed();
    });

    // Filter Tabs
    typeFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tab')) {
            document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            
            appState.activeFilter = e.target.getAttribute('data-type');
            updateSidebarStatsActiveState(appState.activeFilter);
            renderFeed();
        }
    });

    // Stats Cards Click (also triggers filter)
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.getAttribute('data-filter');
            
            // Sync filter tabs
            document.querySelectorAll('.filter-tab').forEach(tab => {
                if (tab.getAttribute('data-type') === filterType) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            appState.activeFilter = filterType;
            updateSidebarStatsActiveState(filterType);
            renderFeed();
        });
    });

    // Tweet Template Change
    tweetTemplateSelect.addEventListener('change', () => {
        if (appState.selectedUpdate) {
            generateTweetText(appState.selectedUpdate);
        }
    });

    // Tweet Textarea Typing
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Copy Tweet Button
    btnCopyTweet.addEventListener('click', copyTweetToClipboard);

    // Share Tweet Button
    btnShareTweet.addEventListener('click', shareOnTwitter);
}

// Update active highlight in sidebar stats
function updateSidebarStatsActiveState(filterType) {
    statCards.forEach(card => {
        if (card.getAttribute('data-filter') === filterType) {
            card.classList.add('active-filter');
        } else {
            card.classList.remove('active-filter');
        }
    });
}

// Fetch Data from Flask API
async function fetchUpdates() {
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/updates');
        const data = await response.json();
        
        if (data.success) {
            appState.updates = data.updates;
            updateStats();
            renderFeed();
            setApiStatus('connected', `Updated: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
        } else {
            showError(data.error || 'Failed to fetch release notes.');
            setApiStatus('disconnected', 'Fetch Failed');
        }
    } catch (err) {
        showError('Network error connecting to backend server.');
        setApiStatus('disconnected', 'Server Offline');
    } finally {
        setLoadingState(false);
    }
}

// Set Loading UI State
function setLoadingState(isLoading) {
    if (isLoading) {
        btnRefresh.classList.add('loading');
        btnRefresh.disabled = true;
        feedLoading.classList.remove('hidden');
        feedEmpty.classList.add('hidden');
        feedError.classList.add('hidden');
        // Hide existing cards
        document.querySelectorAll('.update-card').forEach(el => el.remove());
    } else {
        btnRefresh.classList.remove('loading');
        btnRefresh.disabled = false;
        feedLoading.classList.add('hidden');
    }
}

// Show Error UI State
function showError(msg) {
    errorMessageEl.textContent = msg;
    feedError.classList.remove('hidden');
    feedLoading.classList.add('hidden');
    feedEmpty.classList.add('hidden');
}

// Set Sidebar Connection Status Dot
function setApiStatus(status, text) {
    apiStatusText.textContent = text;
    apiStatusDot.className = 'status-dot';
    
    if (status === 'connected') {
        apiStatusDot.classList.add('green');
    } else if (status === 'connecting') {
        apiStatusDot.classList.add('orange');
    } else {
        apiStatusDot.classList.add('red');
    }
}

// Calculate Stats for Sidebar
function updateStats() {
    const counts = {
        all: appState.updates.length,
        Feature: 0,
        Announcement: 0,
        Issue: 0
    };
    
    appState.updates.forEach(u => {
        if (counts[u.type] !== undefined) {
            counts[u.type]++;
        }
    });
    
    countAll.textContent = counts.all;
    countFeature.textContent = counts.Feature;
    countAnnouncement.textContent = counts.Announcement;
    countIssue.textContent = counts.Issue;
}

// Filter, Sort, and Render Cards to UI
function renderFeed() {
    // 1. Filter
    let filtered = appState.updates.filter(update => {
        // Type filter
        if (appState.activeFilter !== 'all' && update.type !== appState.activeFilter) {
            return false;
        }
        
        // Search query filter
        if (appState.searchQuery) {
            const matchesText = update.text.toLowerCase().includes(appState.searchQuery);
            const matchesType = update.type.toLowerCase().includes(appState.searchQuery);
            const matchesDate = update.date.toLowerCase().includes(appState.searchQuery);
            return matchesText || matchesType || matchesDate;
        }
        
        return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
        // Dates are structured as "June 16, 2026", which parses in JS
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (appState.sortOrder === 'newest') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });

    // Save filtered results
    appState.filteredUpdates = filtered;

    // 3. Clear container except for empty/loading/error cards
    document.querySelectorAll('.update-card').forEach(el => el.remove());

    // 4. Handle empty state
    if (filtered.length === 0) {
        feedEmpty.classList.remove('hidden');
        return;
    } else {
        feedEmpty.classList.add('hidden');
    }

    // 5. Inject cards
    filtered.forEach((update, index) => {
        const card = document.createElement('div');
        card.className = 'update-card';
        card.setAttribute('data-type', update.type);
        
        // Stagger entrance animations slightly
        card.style.animationDelay = `${index * 50}ms`;

        card.innerHTML = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="badge-type" data-type="${update.type}">${update.type}</span>
                    <span class="card-date"><i class="fa-regular fa-calendar"></i> ${update.date}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-card-action btn-copy-card" title="Copy text to clipboard">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <button class="btn-card-action btn-tweet-trigger" title="Compose Tweet for this update">
                        <i class="fa-brands fa-x-twitter"></i>
                    </button>
                    <a href="${update.link}" target="_blank" class="btn-card-action" title="View official GCP release notes">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            </div>
            <div class="card-content">
                ${update.html}
            </div>
        `;

        // Event listener for copy card text
        const btnCopy = card.querySelector('.btn-copy-card');
        btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(update.text).then(() => {
                btnCopy.classList.add('success');
                btnCopy.innerHTML = '<i class="fa-solid fa-check"></i>';
                
                setTimeout(() => {
                    btnCopy.classList.remove('success');
                    btnCopy.innerHTML = '<i class="fa-regular fa-copy"></i>';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy card text: ', err);
            });
        });

        // Event listener for tweet trigger on this card
        card.querySelector('.btn-tweet-trigger').addEventListener('click', () => {
            selectUpdateForTweet(update);
        });

        feedContainer.appendChild(card);
    });
}

// Select Card and Open Composer
function selectUpdateForTweet(update) {
    appState.selectedUpdate = update;
    
    // Switch composer panels
    composerEmptyState.classList.add('hidden');
    composerActiveState.classList.remove('hidden');
    
    // Highlight composer
    const composer = document.getElementById('tweet-composer');
    composer.style.borderColor = 'var(--accent-indigo)';
    setTimeout(() => {
        composer.style.borderColor = 'var(--border-color)';
    }, 800);

    // Prepopulate Template Text
    generateTweetText(update);
}

// Smart Tweet Template Generator
function generateTweetText(update) {
    const templateType = tweetTemplateSelect.value;
    const date = update.date;
    const type = update.type;
    const link = update.link;
    const textContent = update.text;

    // Fixed parts of the tweet
    let header = '';
    let footer = `\n\n🔗 Source: ${link}`;

    if (templateType === 'rocket') {
        header = `🚀 New in #BigQuery (${date})!\n\n`;
    } else if (templateType === 'loudspeaker') {
        header = `📢 BigQuery Announcement (${date}):\n\n`;
    } else if (templateType === 'alert') {
        header = `⚠️ #BigQuery Update [${type}] (${date}):\n\n`;
    } else {
        header = `📝 BigQuery release note (${date}):\n`;
        footer = `\n\nLink: ${link}`;
    }

    // Calculate max body length
    // Twitter character limit is 280
    const maxTweetLength = 280;
    const fixedLength = header.length + footer.length;
    const maxBodyLength = maxTweetLength - fixedLength;

    let body = textContent;

    // Smart Truncation
    if (body.length > maxBodyLength) {
        body = body.substring(0, maxBodyLength - 3).trim() + '...';
    }

    tweetTextarea.value = `${header}${body}${footer}`;
    updateCharCounter();
}

// Update Character Counter and SVG Progress Circle
function updateCharCounter() {
    const text = tweetTextarea.value;
    const len = text.length;
    charCountSpan.textContent = len;
    
    // Update label colors
    const counterBar = document.querySelector('.character-counter-bar');
    if (len > 280) {
        counterBar.classList.add('warning');
        btnShareTweet.disabled = true;
    } else {
        counterBar.classList.remove('warning');
        btnShareTweet.disabled = false;
    }

    // SVG Circle Math
    // Radius = 10, Circumference = 2 * PI * r = 62.83
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    const percentage = Math.min((len / 280) * 100, 100);
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    // Color progress ring dynamically based on length
    if (len > 280) {
        progressCircle.style.stroke = 'var(--color-deprecation)'; // Red
    } else if (len > 250) {
        progressCircle.style.stroke = 'var(--color-issue)'; // Yellow/Orange
    } else {
        progressCircle.style.stroke = 'var(--accent-indigo)'; // Indigo
    }
}

// Copy draft to Clipboard
function copyTweetToClipboard() {
    const text = tweetTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
        // Temporary UI visual update on copy button
        const originalHtml = btnCopyTweet.innerHTML;
        btnCopyTweet.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btnCopyTweet.style.borderColor = 'var(--color-feature)';
        btnCopyTweet.style.color = 'var(--color-feature)';
        btnCopyTweet.disabled = true;
        
        setTimeout(() => {
            btnCopyTweet.innerHTML = originalHtml;
            btnCopyTweet.style.borderColor = '';
            btnCopyTweet.style.color = '';
            btnCopyTweet.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Could not copy text to clipboard. Please copy manually.');
    });
}

// Share on Twitter Web Intent
function shareOnTwitter() {
    const text = tweetTextarea.value;
    if (text.length > 280) {
        alert('Your draft exceeds the 280 character limit. Please shorten it before posting.');
        return;
    }
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
}

// Export Filtered/Visible Release Notes to CSV
function exportToCSV() {
    const data = appState.filteredUpdates;
    if (!data || data.length === 0) {
        alert("No release notes found to export. Check your search/filter parameters.");
        return;
    }
    
    // CSV Header row
    const headers = ["Date", "Type", "Content (Plain Text)", "Source Link"];
    
    // Format rows
    const rows = data.map(update => {
        return [
            update.date,
            update.type,
            update.text,
            update.link
        ].map(value => {
            // Escape double-quotes and enclose in double-quotes
            const escapedVal = (value || "").replace(/"/g, '""');
            return `"${escapedVal}"`;
        }).join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\r\n");
    
    // Download File
    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.setAttribute("href", url);
        downloadLink.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().slice(0,10)}.csv`);
        downloadLink.style.visibility = "hidden";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (err) {
        console.error("CSV Export error: ", err);
        alert("Failed to export to CSV: " + err.message);
    }
}
