# 🚀 BigQuery Release Notes Viewer & Tweet Composer

A sleek, responsive, and modern web application that aggregates official Google Cloud BigQuery release notes and provides an interactive platform to compose, format, and share updates on X (Twitter).

👉 **Live Local URL:** [http://127.0.0.1:5000](http://127.0.0.1:5000)  
👉 **GitHub Repository:** [Divya-stacks9/bigquery-release-notes-event-talks-app](https://github.com/Divya-stacks9/bigquery-release-notes-event-talks-app)

---

## 🎨 Main Features

*   **Granular Parsing:** Splits aggregate day-to-day release note entries into specific update categories (Features, Issues, Announcements, Deprecations) instead of displaying them as single, long blobs of text.
*   **Smart Tweet Composer:** Drafts tweets instantly using structured preset templates (Action-oriented, Announcement, Warning, Minimal).
*   **Automatic URL Rectification:** Backend automatically scans update descriptions and translates relative Google Cloud documentation links (e.g., `/bigquery/docs/...`) into absolute working URLs.
*   **280-Character Safe-guard:** Client-side editor keeps track of your tweet length, updating a circular SVG progress ring that changes color based on remaining space and blocking posts exceeding the 280-character limit.
*   **Full-Text Search & Filters:** Instantly search across titles, types, and descriptions. Filter updates by selecting category tabs or clicking the statistics cards on the sidebar.
*   **Theme Engine:** Smoothly swap between a dark neon theme (default) and a daylight light theme. Theme selection is stored in the browser's local storage.
*   **Staggered Entry Animations:** Cards load with smooth entrance slide animations for a premium desktop user experience.

---

## 🛠️ Technology Stack

*   **Backend:** Python 3.12 (Flask, BeautifulSoup4, XML ElementTree, Urllib)
*   **Frontend:** Vanilla HTML5, CSS3 Variables, ES6 JavaScript, FontAwesome Icons, Google Fonts (Outfit & JetBrains Mono)

---

## 📁 Project Structure

```text
bigquery-release-viewer/
│
├── app.py                 # Flask server (Fetches feed, cleans HTML, and serves JSON API)
├── requirements.txt       # Python package dependencies
├── .gitignore             # Config to ignore caching, venv, and IDE files
├── README.md              # Project documentation and guide
│
├── templates/
│   └── index.html         # Frontend layout markup
│
└── static/
    ├── css/
    │   └── style.css      # Custom styles, theme handling, grids, and animations
    └── js/
        └── app.js         # Frontend controller (fetches API, search/sort/filter, composer)
```

---

## 🚀 Getting Started

### 📋 Prerequisites
*   Python 3.12 or newer installed on your machine.
*   Git command line tool.

### ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Divya-stacks9/bigquery-release-notes-event-talks-app.git
    cd bigquery-release-notes-event-talks-app
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Flask application:**
    ```bash
    python app.py
    ```

4.  **Open in your browser:**
    Navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** to view the application.

---

## 📝 License

This project is open-source and available under the MIT License.
