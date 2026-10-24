# YouTube Reaction Directory — Google Apps Script Automations

Automated Google Apps Script solution designed to generate dynamic YouTube deep links, process reaction directory metrics, and synchronize channel data with a Softr web platform (backed by Google Sheets).

---

## 📌 Project Overview

This repository contains the backend Google Apps Script logic that automates data management for tracking YouTube reaction videos dedicated to **Carpetman** and **Black Soil**.

### Key Features:
* **Direct Deep Link Generation:** Automatically constructs channel-specific YouTube search links to ensure distraction-free search results without third-party channel noise.
* **Batch Processing & Execution Safety:** Includes execution time tracking and state persistence (`LAST_PROCESSED_ROW`) to safely navigate Google Apps Script's 6-minute execution limits.
* **Channel Metrics Collection:** Extracts, normalizes, and compares channel stats, reaction counts, and update timestamps.

---

## 📁 Repository Structure

* `resetAndRunAll.gs` — Main entry point: resets execution state and initiates full catalog batch processing.
* `findNewChannels.gs` — Script for discovering and adding newly tracked reaction channels to the dataset.
* `testChannelSearch.gs` — Utility for isolated, single-row link generation and testing.
* `compareChannelVideos.gs` — Analytics script for comparing video metadata, views, and reaction engagement across channels.

---

## 🛠️ How It Works

1. **Data Extraction:** Google Sheets reads target channel handles and names.
2. **Deep Link Construction:** Generates direct URLs pointing to each channel's internal search (`https://www.youtube.com/@<handle>/search?query="Carpetman" OR "Black Soil"`).
3. **Web Sync:** Processed links and channel statistics sync seamlessly with the Softr web application.

---

## 📄 License & Copyright

© All rights reserved.

This repository and its source code are proprietary. Unauthorized copying, modification, distribution, or use of this code via any medium is strictly prohibited without prior written permission from the author.
