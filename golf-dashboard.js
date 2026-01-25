// Golf Dashboard JavaScript - Data handling and visualization

// Global state
const state = {
    rawData: [],
    filteredData: [],
    files: [],
    selectedMetrics: [],
    selectedClubs: ['all'],
    dateRangeFilter: 'all', // '1month', '3months', '6months', '1year', 'all'
    chart: null,
    currentPage: 1,
    rowsPerPage: 25,
    sortColumn: null,
    sortDirection: 'asc',
    movingAverageWindow: 5,
    showMovingAverage: false,
    winsorize: false,
    winsorizePercent: 5,
    isAutoLoading: false
};

// Club ordering by typical distance (longest to shortest)
const clubOrder = [
    'Driver', 'DR', '1',
    '3 Wood', '3W', '3-Wood', '2',
    '5 Wood', '5W', '5-Wood', '3',
    '7 Wood', '7W', '7-Wood', '4',
    '3 Hybrid', '3H', '3-Hybrid',
    '4 Hybrid', '4H', '4-Hybrid',
    '5 Hybrid', '5H', '5-Hybrid',
    '3 Iron', '3I', '3i',
    '4 Iron', '4I', '4i', '5',
    '5 Iron', '5I', '5i', '6',
    '6 Iron', '6I', '6i', '7',
    '7 Iron', '7I', '7i', '8',
    '8 Iron', '8I', '8i', '9',
    '9 Iron', '9I', '9i', '10',
    'Pitching Wedge', 'PW', '11',
    'Gap Wedge', 'GW', 'AW', '12',
    'Sand Wedge', 'SW', '13',
    'Lob Wedge', 'LW', '14'
];

// Metric definitions with display names and colors
const metricConfig = {
    'Carry Distance': { color: '#4CAF50', unit: 'yds', decimals: 1 },
    'Total Distance': { color: '#2196F3', unit: 'yds', decimals: 1 },
    'Ball Speed': { color: '#FF9800', unit: 'mph', decimals: 1 },
    'Launch Angle': { color: '#9C27B0', unit: '°', decimals: 1 },
    'Launch Direction': { color: '#00BCD4', unit: '°', decimals: 1 },
    'Apex': { color: '#E91E63', unit: 'ft', decimals: 1 },
    'Side Carry': { color: '#795548', unit: 'yds', decimals: 1 },
    'Club Speed': { color: '#607D8B', unit: 'mph', decimals: 1 },
    'Smash Factor': { color: '#FF5722', unit: '', decimals: 2 },
    'Descent Angle': { color: '#3F51B5', unit: '°', decimals: 1 },
    'Attack Angle': { color: '#009688', unit: '°', decimals: 1 },
    'Club Path': { color: '#CDDC39', unit: '°', decimals: 1 }
};

// Club type colors for multi-club visualization
const clubColors = {
    // Official names
    'Driver': '#FF9800',
    '3 Wood': '#9C27B0',
    '5 Wood': '#2196F3',
    '7 Wood': '#00BCD4',
    '3 Hybrid': '#E91E63',
    '4 Hybrid': '#FF5722',
    '5 Hybrid': '#795548',
    '3 Iron': '#673AB7',
    '4 Iron': '#3F51B5',
    '5 Iron': '#2196F3',
    '6 Iron': '#00BCD4',
    '7 Iron': '#009688',
    '8 Iron': '#4CAF50',
    '9 Iron': '#8BC34A',
    'Pitching Wedge': '#CDDC39',
    'Gap Wedge': '#FFC107',
    'Sand Wedge': '#FF9800',
    'Lob Wedge': '#FF5722',
    // Shorthand versions
    'PW': '#CDDC39',
    'GW': '#FFC107',
    'AW': '#FFC107',
    'SW': '#FF9800',
    'LW': '#FF5722',
    '3W': '#9C27B0',
    '5W': '#2196F3',
    '7W': '#00BCD4',
    'DR': '#FF9800'
};

// Configuration for stored data
const DATA_FOLDER = 'data';
const GITHUB_RAW_BASE = ''; // Will be set dynamically based on current URL

// DOM Elements
const elements = {
    // View mode elements
    viewModeModal: document.getElementById('viewModeModal'),
    selectDesktop: document.getElementById('selectDesktop'),
    selectMobile: document.getElementById('selectMobile'),
    rememberChoice: document.getElementById('rememberChoice'),
    toggleViewMode: document.getElementById('toggleViewMode'),
    // Tab elements
    uploadTab: document.getElementById('uploadTab'),
    storedTab: document.getElementById('storedTab'),
    storedFilesList: document.getElementById('storedFilesList'),
    refreshStoredFiles: document.getElementById('refreshStoredFiles'),
    // Date range filter
    dateRangeSelect: document.getElementById('dateRangeSelect'),
    // Loading indicator
    loadingOverlay: document.getElementById('loadingOverlay'),
    // Original elements
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    controlsSection: document.getElementById('controlsSection'),
    clubFilterGrid: document.getElementById('clubFilterGrid'),
    metricsGrid: document.getElementById('metricsGrid'),
    chartType: document.getElementById('chartType'),
    xAxisSelect: document.getElementById('xAxisSelect'),
    showMovingAverage: document.getElementById('showMovingAverage'),
    movingAverageWindow: document.getElementById('movingAverageWindow'),
    winsorize: document.getElementById('winsorize'),
    winsorizePercent: document.getElementById('winsorizePercent'),
    updateChart: document.getElementById('updateChart'),
    resetZoom: document.getElementById('resetZoom'),
    clearData: document.getElementById('clearData'),
    chartSection: document.getElementById('chartSection'),
    mainChart: document.getElementById('mainChart'),
    statsSection: document.getElementById('statsSection'),
    statsGrid: document.getElementById('statsGrid'),
    dataTableSection: document.getElementById('dataTableSection'),
    tableHead: document.getElementById('tableHead'),
    tableBody: document.getElementById('tableBody'),
    tableSearch: document.getElementById('tableSearch'),
    exportData: document.getElementById('exportData'),
    pagination: document.getElementById('pagination')
};

// Initialize the dashboard
function init() {
    checkViewModePreference();
    setupEventListeners();
    setupDragAndDrop();
    setupTabs();
    loadStoredFilesList();
}

// Check and apply stored view mode preference
function checkViewModePreference() {
    const savedMode = localStorage.getItem('golfDashboardViewMode');
    if (savedMode) {
        applyViewMode(savedMode);
        if (elements.viewModeModal) {
            elements.viewModeModal.classList.add('hidden');
        }
    }
}

// Apply view mode (desktop or mobile)
function applyViewMode(mode) {
    if (mode === 'mobile') {
        document.body.classList.add('mobile-view');
        document.body.classList.remove('desktop-view');
    } else {
        document.body.classList.add('desktop-view');
        document.body.classList.remove('mobile-view');
    }
}

// Setup tabs for upload/stored data
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });
}

// Load list of stored CSV files from data folder
async function loadStoredFilesList() {
    if (!elements.storedFilesList) return;

    elements.storedFilesList.innerHTML = '<p class="loading-text">Checking for stored data...</p>';

    try {
        // Try to fetch the data folder index
        // For GitHub Pages, we'll use a manifest file
        const manifestUrl = getBaseUrl() + 'data/manifest.json';
        const response = await fetch(manifestUrl);

        if (response.ok) {
            const manifest = await response.json();
            const files = manifest.files || [];
            displayStoredFiles(files);

            // Auto-load all files on startup (skip sample data)
            const dataFiles = files.filter(f => !f.name.toLowerCase().includes('sample'));
            if (dataFiles.length > 0 && state.rawData.length === 0) {
                await loadAllStoredFiles(dataFiles);
            }
        } else {
            // No manifest found - show instructions
            elements.storedFilesList.innerHTML = `
                <div class="no-data-message">
                    <p>No stored data found.</p>
                    <p style="font-size: 0.85rem; margin-top: 10px;">
                        To store data: add CSV files to the <code>data/</code> folder<br>
                        and create a <code>manifest.json</code> listing them.
                    </p>
                </div>
            `;
        }
    } catch (error) {
        elements.storedFilesList.innerHTML = `
            <div class="no-data-message">
                <p>Could not load stored data.</p>
                <p style="font-size: 0.85rem; margin-top: 10px;">Use the Upload tab to load local files.</p>
            </div>
        `;
    }
}

// Load all stored files automatically
async function loadAllStoredFiles(files) {
    state.isAutoLoading = true;
    showLoadingOverlay(`Loading ${files.length} data files...`);

    let loadedCount = 0;

    for (const file of files) {
        try {
            const url = getBaseUrl() + file.path;
            const response = await fetch(url);

            if (!response.ok) continue;

            const content = await response.text();
            const fileName = file.path.split('/').pop();
            const data = parseCSV(content, fileName);

            if (data.length > 0) {
                state.files.push({
                    name: fileName,
                    rows: data.length
                });
                state.rawData = state.rawData.concat(data);
                loadedCount++;

                // Update loading message
                updateLoadingOverlay(`Loading data files... (${loadedCount}/${files.length})`);
            }

            // Mark button as loaded if it exists
            const btn = document.querySelector(`[data-file="${file.path}"]`);
            if (btn) {
                btn.classList.add('loaded');
                btn.textContent = file.name + ' ✓';
            }
        } catch (error) {
            console.error('Error loading file:', file.path, error);
        }
    }

    hideLoadingOverlay();
    state.isAutoLoading = false;

    if (state.rawData.length > 0) {
        updateUI();
    }
}

// Show loading overlay
function showLoadingOverlay(message) {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.querySelector('.loading-message').textContent = message;
        elements.loadingOverlay.classList.remove('hidden');
    }
}

// Update loading overlay message
function updateLoadingOverlay(message) {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.querySelector('.loading-message').textContent = message;
    }
}

// Hide loading overlay
function hideLoadingOverlay() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('hidden');
    }
}

// Get base URL for the application
function getBaseUrl() {
    const path = window.location.pathname;
    const basePath = path.substring(0, path.lastIndexOf('/') + 1);
    return window.location.origin + basePath;
}

// Display stored files as buttons
function displayStoredFiles(files) {
    if (files.length === 0) {
        elements.storedFilesList.innerHTML = '<p class="no-data-message">No stored data files found.</p>';
        return;
    }

    elements.storedFilesList.innerHTML = files.map(file => `
        <button class="stored-file-btn" data-file="${file.path}" title="${file.description || file.name}">
            ${file.name}
        </button>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.stored-file-btn').forEach(btn => {
        btn.addEventListener('click', () => loadStoredFile(btn.dataset.file, btn));
    });
}

// Load a stored CSV file
async function loadStoredFile(filePath, buttonElement) {
    try {
        buttonElement.textContent = 'Loading...';
        const url = getBaseUrl() + filePath;
        const response = await fetch(url);

        if (!response.ok) throw new Error('File not found');

        const content = await response.text();
        const fileName = filePath.split('/').pop();
        const data = parseCSV(content, fileName);

        if (data.length > 0) {
            state.files.push({
                name: fileName,
                rows: data.length
            });
            state.rawData = state.rawData.concat(data);
            updateUI();
            buttonElement.classList.add('loaded');
            buttonElement.textContent = fileName + ' ✓';
        }
    } catch (error) {
        buttonElement.textContent = 'Error loading';
        console.error('Error loading stored file:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // View mode selection
    if (elements.selectDesktop) {
        elements.selectDesktop.addEventListener('click', () => {
            applyViewMode('desktop');
            if (elements.rememberChoice && elements.rememberChoice.checked) {
                localStorage.setItem('golfDashboardViewMode', 'desktop');
            }
            elements.viewModeModal.classList.add('hidden');
        });
    }

    if (elements.selectMobile) {
        elements.selectMobile.addEventListener('click', () => {
            applyViewMode('mobile');
            if (elements.rememberChoice && elements.rememberChoice.checked) {
                localStorage.setItem('golfDashboardViewMode', 'mobile');
            }
            elements.viewModeModal.classList.add('hidden');
        });
    }

    if (elements.toggleViewMode) {
        elements.toggleViewMode.addEventListener('click', () => {
            const currentMode = document.body.classList.contains('mobile-view') ? 'mobile' : 'desktop';
            const newMode = currentMode === 'mobile' ? 'desktop' : 'mobile';
            applyViewMode(newMode);
            localStorage.setItem('golfDashboardViewMode', newMode);
        });
    }

    if (elements.refreshStoredFiles) {
        elements.refreshStoredFiles.addEventListener('click', loadStoredFilesList);
    }

    // Date range filter
    if (elements.dateRangeSelect) {
        elements.dateRangeSelect.addEventListener('change', (e) => {
            state.dateRangeFilter = e.target.value;
            updateDateRangeInfo();
            updateChart();
            updateStats();
            updateDataTable();
        });
    }

    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.updateChart.addEventListener('click', updateChart);
    elements.resetZoom.addEventListener('click', resetChartZoom);
    elements.clearData.addEventListener('click', clearAllData);
    elements.tableSearch.addEventListener('input', handleTableSearch);
    elements.exportData.addEventListener('click', exportFilteredData);
    elements.chartType.addEventListener('change', updateChart);
    elements.xAxisSelect.addEventListener('change', updateChart);

    // Moving average controls
    elements.showMovingAverage.addEventListener('change', (e) => {
        state.showMovingAverage = e.target.checked;
        updateChart();
    });
    elements.movingAverageWindow.addEventListener('change', (e) => {
        state.movingAverageWindow = parseInt(e.target.value) || 5;
        if (state.showMovingAverage) updateChart();
    });

    // Winsorization controls
    elements.winsorize.addEventListener('change', (e) => {
        state.winsorize = e.target.checked;
        updateChart();
        updateStats();
    });
    elements.winsorizePercent.addEventListener('change', (e) => {
        state.winsorizePercent = parseInt(e.target.value) || 5;
        if (state.winsorize) {
            updateChart();
            updateStats();
        }
    });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());

    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('drag-over');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('drag-over');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        processFiles(files);
    });
}

// Handle file selection
function handleFileSelect(e) {
    const files = e.target.files;
    processFiles(files);
}

// Process uploaded files
function processFiles(files) {
    Array.from(files).forEach(file => {
        if (file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = parseCSV(e.target.result, file.name);
                if (data.length > 0) {
                    state.files.push({
                        name: file.name,
                        rows: data.length
                    });
                    state.rawData = state.rawData.concat(data);
                    updateUI();
                }
            };
            reader.readAsText(file);
        }
    });
}

// Helper to strip quotes from a string
function stripQuotes(str) {
    str = str.trim();
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
        return str.slice(1, -1).trim();
    }
    return str;
}

// Map numeric club codes to readable names (Rapsodo MLM2 format)
function formatClubType(value) {
    if (value === null || value === undefined || value === '') return '';

    // Common club code mappings to official golf names
    const clubMap = {
        '1': 'Driver',
        '2': '3 Wood',
        '3': '5 Wood',
        '4': '7 Wood',
        '5': '4 Iron',
        '6': '5 Iron',
        '7': '6 Iron',
        '8': '7 Iron',
        '9': '8 Iron',
        '10': '9 Iron',
        '11': 'Pitching Wedge',
        '12': 'Gap Wedge',
        '13': 'Sand Wedge',
        '14': 'Lob Wedge',
        // Also handle decimal versions
        '1.0': 'Driver',
        '2.0': '3 Wood',
        '3.0': '5 Wood',
        '4.0': '7 Wood',
        '5.0': '4 Iron',
        '6.0': '5 Iron',
        '7.0': '6 Iron',
        '8.0': '7 Iron',
        '9.0': '8 Iron',
        '10.0': '9 Iron',
        '11.0': 'Pitching Wedge',
        '12.0': 'Gap Wedge',
        '13.0': 'Sand Wedge',
        '14.0': 'Lob Wedge'
    };

    const strValue = String(value).trim();

    // Check direct mapping first
    if (clubMap[strValue]) {
        return clubMap[strValue];
    }

    // If it's already a proper name, normalize it
    const upperValue = strValue.toUpperCase();
    const nameMap = {
        'DR': 'Driver',
        'DRIVER': 'Driver',
        '3W': '3 Wood',
        '5W': '5 Wood',
        '7W': '7 Wood',
        '3H': '3 Hybrid',
        '4H': '4 Hybrid',
        '5H': '5 Hybrid',
        '3I': '3 Iron',
        '4I': '4 Iron',
        '5I': '5 Iron',
        '6I': '6 Iron',
        '7I': '7 Iron',
        '8I': '8 Iron',
        '9I': '9 Iron',
        'PW': 'Pitching Wedge',
        'GW': 'Gap Wedge',
        'AW': 'Gap Wedge',
        'SW': 'Sand Wedge',
        'LW': 'Lob Wedge'
    };

    if (nameMap[upperValue]) {
        return nameMap[upperValue];
    }

    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 1 && num <= 9) {
        return `${Math.floor(num)} Iron`;
    }

    return strValue;
}

// Get club sort order (lower = longer club = first)
function getClubSortOrder(clubValue) {
    const formatted = formatClubType(clubValue);
    const index = clubOrder.findIndex(c =>
        c.toLowerCase() === formatted.toLowerCase() ||
        c.toLowerCase() === String(clubValue).toLowerCase()
    );
    return index === -1 ? 999 : index;
}

// Calculate moving average for an array of values
function calculateMovingAverage(values, windowSize) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
        if (i < windowSize - 1) {
            // Not enough data points yet, use partial window
            const slice = values.slice(0, i + 1).filter(v => v !== null && !isNaN(v));
            result.push(slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : null);
        } else {
            const slice = values.slice(i - windowSize + 1, i + 1).filter(v => v !== null && !isNaN(v));
            result.push(slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : null);
        }
    }
    return result;
}

// Winsorize an array of values (clip extreme values to percentiles)
function winsorizeValues(values, percentile) {
    const validValues = values.filter(v => v !== null && !isNaN(v));
    if (validValues.length === 0) return values;

    const sorted = [...validValues].sort((a, b) => a - b);
    const lowerIdx = Math.floor(sorted.length * (percentile / 100));
    const upperIdx = Math.ceil(sorted.length * (1 - percentile / 100)) - 1;

    const lowerBound = sorted[Math.max(0, lowerIdx)];
    const upperBound = sorted[Math.min(sorted.length - 1, upperIdx)];

    return values.map(v => {
        if (v === null || isNaN(v)) return v;
        if (v < lowerBound) return lowerBound;
        if (v > upperBound) return upperBound;
        return v;
    });
}

// Get percentile value from sorted array
function getPercentile(sortedArr, percentile) {
    const index = (percentile / 100) * (sortedArr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sortedArr[lower];
    return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (index - lower);
}

// Parse CSV data
function parseCSV(content, fileName) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse headers and strip quotes
    const headers = lines[0].split(',').map(h => stripQuotes(h));
    const data = [];

    // Extract date from filename if possible (e.g., "session_2024-01-15.csv" or "mlm2pro_shotexport_080724.csv")
    let fileDate;
    const isoDateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    const usDateMatch = fileName.match(/(\d{6})\.csv$/); // MMDDYY format like 080724

    if (isoDateMatch) {
        fileDate = isoDateMatch[1];
    } else if (usDateMatch) {
        const dateStr = usDateMatch[1];
        const month = dateStr.substring(0, 2);
        const day = dateStr.substring(2, 4);
        const year = '20' + dateStr.substring(4, 6);
        fileDate = `${year}-${month}-${day}`;
    } else {
        fileDate = new Date().toISOString().split('T')[0];
    }

    // Columns that should stay as strings (not converted to numbers)
    const stringColumns = ['Club Type', 'Club Brand', 'Club Model'];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {
                _shotNumber: data.length + 1 + state.rawData.length,
                _fileName: fileName,
                _date: fileDate,
                _rowIndex: i
            };

            headers.forEach((header, index) => {
                let value = stripQuotes(values[index]);

                // Keep certain columns as strings
                if (stringColumns.includes(header)) {
                    row[header] = value;
                } else {
                    // Try to convert to number
                    const numValue = parseFloat(value);
                    row[header] = isNaN(numValue) ? value : numValue;
                }
            });

            data.push(row);
        }
    }

    return data;
}

// Parse a single CSV line (handling quoted values)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

// Update UI after data load
function updateUI() {
    updateFileList();
    updateDateRangeInfo();
    populateClubSelect();
    populateMetricsGrid();
    showSections();
    updateStats();
    updateDataTable();
    updateChart();
}

// Update date range info display
function updateDateRangeInfo() {
    const infoEl = document.getElementById('dateRangeInfo');
    if (!infoEl) return;

    const filteredData = getFilteredData();
    const dates = filteredData.map(row => row._date).filter(d => d);
    const uniqueDates = [...new Set(dates)].sort();

    if (uniqueDates.length === 0) {
        infoEl.textContent = 'No data in selected range';
        return;
    }

    const oldest = formatDisplayDate(uniqueDates[0]);
    const newest = formatDisplayDate(uniqueDates[uniqueDates.length - 1]);

    infoEl.textContent = `${uniqueDates.length} sessions | ${filteredData.length} shots | ${oldest} - ${newest}`;
}

// Update file list display
function updateFileList() {
    elements.fileList.innerHTML = state.files.map((file, index) => `
        <div class="file-item">
            <span class="file-name">${file.name}</span>
            <span class="file-rows">(${file.rows} shots)</span>
            <button class="remove-file" onclick="removeFile(${index})">&times;</button>
        </div>
    `).join('');
}

// Remove a file
function removeFile(index) {
    const fileName = state.files[index].name;
    state.files.splice(index, 1);
    state.rawData = state.rawData.filter(row => row._fileName !== fileName);

    // Renumber shots
    state.rawData.forEach((row, i) => {
        row._shotNumber = i + 1;
    });

    if (state.rawData.length === 0) {
        clearAllData();
    } else {
        updateUI();
    }
}

// Populate club filter checkboxes
function populateClubSelect() {
    const clubs = [...new Set(state.rawData.map(row => row['Club Type']).filter(v => v !== null && v !== undefined && v !== ''))];

    // Sort clubs by distance order (Driver first, then woods, irons, wedges)
    clubs.sort((a, b) => getClubSortOrder(a) - getClubSortOrder(b));

    const allChecked = state.selectedClubs.includes('all');

    elements.clubFilterGrid.innerHTML = `
        <div class="club-item ${allChecked ? 'selected' : ''}" data-club="all">
            <input type="checkbox" id="club_all" ${allChecked ? 'checked' : ''} onchange="toggleClub('all')">
            <label for="club_all">All Clubs</label>
            <span class="club-count">(${state.rawData.length})</span>
        </div>
        ${clubs.map(club => {
            const count = state.rawData.filter(row => row['Club Type'] === club).length;
            const isSelected = state.selectedClubs.includes(String(club));
            const displayName = formatClubType(club);
            const safeId = String(club).replace(/[^a-zA-Z0-9]/g, '_');
            return `
                <div class="club-item ${isSelected ? 'selected' : ''}" data-club="${club}">
                    <input type="checkbox" id="club_${safeId}" ${isSelected ? 'checked' : ''} onchange="toggleClub('${club}')">
                    <label for="club_${safeId}">${displayName}</label>
                    <span class="club-count">(${count})</span>
                </div>
            `;
        }).join('')}
    `;

    // Add click handler for the entire club item
    document.querySelectorAll('.club-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = item.querySelector('input');
                checkbox.checked = !checkbox.checked;
                const club = item.dataset.club;
                toggleClub(club);
            }
        });
    });
}

// Populate metrics grid
function populateMetricsGrid() {
    const numericColumns = getNumericColumns();

    elements.metricsGrid.innerHTML = numericColumns.map(column => {
        const config = metricConfig[column] || { color: '#888' };
        const isSelected = state.selectedMetrics.includes(column);
        return `
            <div class="metric-item ${isSelected ? 'selected' : ''}" data-metric="${column}">
                <input type="checkbox" id="metric_${column.replace(/\s/g, '_')}"
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleMetric('${column}')">
                <label for="metric_${column.replace(/\s/g, '_')}">${column}</label>
            </div>
        `;
    }).join('');

    // Add click handler for the entire metric item
    document.querySelectorAll('.metric-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = item.querySelector('input');
                checkbox.checked = !checkbox.checked;
                const metric = item.dataset.metric;
                toggleMetric(metric);
            }
        });
    });
}

// Get numeric columns from data
function getNumericColumns() {
    if (state.rawData.length === 0) return [];

    const firstRow = state.rawData[0];
    return Object.keys(firstRow).filter(key => {
        return !key.startsWith('_') &&
               typeof firstRow[key] === 'number' &&
               key !== 'Club Data Est Type';
    });
}

// Toggle metric selection
function toggleMetric(metric) {
    const index = state.selectedMetrics.indexOf(metric);
    if (index > -1) {
        state.selectedMetrics.splice(index, 1);
    } else {
        state.selectedMetrics.push(metric);
    }

    // Update visual state
    document.querySelectorAll('.metric-item').forEach(item => {
        const checkbox = item.querySelector('input');
        item.classList.toggle('selected', checkbox.checked);
    });

    updateChart();
}

// Toggle club filter
function toggleClub(club) {
    if (club === 'all') {
        // If 'all' is clicked, select only 'all' and deselect others
        state.selectedClubs = ['all'];
    } else {
        // Remove 'all' from selection if it's there
        state.selectedClubs = state.selectedClubs.filter(c => c !== 'all');

        // Toggle the specific club
        const index = state.selectedClubs.indexOf(club);
        if (index > -1) {
            state.selectedClubs.splice(index, 1);
        } else {
            state.selectedClubs.push(club);
        }

        // If no clubs selected, default to 'all'
        if (state.selectedClubs.length === 0) {
            state.selectedClubs = ['all'];
        }
    }

    // Update checkbox visual states
    document.querySelectorAll('.club-item').forEach(item => {
        const checkbox = item.querySelector('input');
        const clubValue = item.dataset.club;
        checkbox.checked = state.selectedClubs.includes(clubValue);
        item.classList.toggle('selected', checkbox.checked);
    });

    updateChart();
    updateStats();
    updateDataTable();
}

// Show sections after data load
function showSections() {
    elements.controlsSection.style.display = 'block';
    elements.chartSection.style.display = 'block';
    elements.statsSection.style.display = 'block';
    elements.dataTableSection.style.display = 'block';
}

// Get filtered data based on club selection and date range
function getFilteredData() {
    let data = state.rawData;

    // Filter by date range first
    data = filterByDateRange(data);

    // Then filter by club
    if (!state.selectedClubs.includes('all')) {
        data = data.filter(row =>
            state.selectedClubs.includes(row['Club Type'])
        );
    }

    return data;
}

// Filter data by date range
function filterByDateRange(data) {
    if (state.dateRangeFilter === 'all') {
        return data;
    }

    const now = new Date();
    let cutoffDate;

    switch (state.dateRangeFilter) {
        case '1month':
            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        case '3months':
            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
        case '6months':
            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            break;
        case '1year':
            cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        default:
            return data;
    }

    return data.filter(row => {
        if (!row._date) return true;
        const rowDate = new Date(row._date);
        return rowDate >= cutoffDate;
    });
}

// Get date range stats for display
function getDateRangeStats() {
    if (state.rawData.length === 0) return null;

    const dates = state.rawData.map(row => row._date).filter(d => d);
    if (dates.length === 0) return null;

    const uniqueDates = [...new Set(dates)].sort();
    const oldest = uniqueDates[0];
    const newest = uniqueDates[uniqueDates.length - 1];

    return {
        totalSessions: uniqueDates.length,
        dateRange: `${formatDisplayDate(oldest)} - ${formatDisplayDate(newest)}`,
        totalShots: state.rawData.length
    };
}

// Format date for display
function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Update the chart
function updateChart() {
    const data = getFilteredData();
    const chartType = elements.chartType.value;
    const xAxis = elements.xAxisSelect.value;

    if (state.chart) {
        state.chart.destroy();
    }

    if (data.length === 0 || state.selectedMetrics.length === 0) {
        // Show empty state
        const ctx = elements.mainChart.getContext('2d');
        state.chart = new Chart(ctx, {
            type: 'line',
            data: { datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Select metrics to visualize',
                        color: '#b8b8b8',
                        font: { size: 16 }
                    }
                }
            }
        });
        return;
    }

    const datasets = createDatasets(data, xAxis, chartType);
    const labels = xAxis === 'shot'
        ? data.map((_, i) => i + 1)
        : data.map(row => row._date);

    const ctx = elements.mainChart.getContext('2d');

    state.chart = new Chart(ctx, {
        type: chartType === 'scatter' ? 'scatter' : chartType,
        data: {
            labels: chartType !== 'scatter' ? labels : undefined,
            datasets: datasets
        },
        options: getChartOptions(xAxis, chartType)
    });
}

// Create datasets for the chart
function createDatasets(data, xAxis, chartType) {
    const datasets = [];
    const groupByClub = !state.selectedClubs.includes('all') && state.selectedClubs.length > 1;

    if (groupByClub) {
        // Create separate datasets for each club + metric combination
        state.selectedClubs.forEach(club => {
            const clubData = data.filter(row => row['Club Type'] === club);

            state.selectedMetrics.forEach(metric => {
                const config = metricConfig[metric] || { color: '#888' };
                const clubColor = clubColors[formatClubType(club)] || clubColors[club] || config.color;

                let values = clubData.map(row => row[metric]);

                // Apply Winsorization if enabled
                if (state.winsorize) {
                    values = winsorizeValues(values, state.winsorizePercent);
                }

                const displayName = `${formatClubType(club)} - ${metric}`;

                if (chartType === 'scatter') {
                    datasets.push({
                        label: displayName,
                        data: values.map((y, i) => ({ x: i + 1, y: y })),
                        borderColor: clubColor,
                        backgroundColor: clubColor + '80',
                        showLine: false,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    });
                } else {
                    datasets.push({
                        label: displayName,
                        data: values,
                        borderColor: clubColor,
                        backgroundColor: clubColor + '40',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    });

                    // Add moving average if enabled
                    if (state.showMovingAverage && chartType === 'line') {
                        const maValues = calculateMovingAverage(values, state.movingAverageWindow);
                        datasets.push({
                            label: `${displayName} (MA-${state.movingAverageWindow})`,
                            data: maValues,
                            borderColor: clubColor,
                            backgroundColor: 'transparent',
                            borderWidth: 3,
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.3,
                            pointRadius: 0,
                            pointHoverRadius: 0
                        });
                    }
                }
            });
        });
    } else {
        // Create datasets for each metric
        state.selectedMetrics.forEach((metric, index) => {
            const config = metricConfig[metric] || { color: getDefaultColor(index) };

            let values = data.map(row => row[metric]);

            // Apply Winsorization if enabled
            if (state.winsorize) {
                values = winsorizeValues(values, state.winsorizePercent);
            }

            if (chartType === 'scatter') {
                datasets.push({
                    label: metric,
                    data: values.map((y, i) => ({ x: i + 1, y: y })),
                    borderColor: config.color,
                    backgroundColor: config.color + '80',
                    showLine: false,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    yAxisID: state.selectedMetrics.length > 1 ? `y${index}` : 'y'
                });
            } else {
                datasets.push({
                    label: metric,
                    data: values,
                    borderColor: config.color,
                    backgroundColor: config.color + '40',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: state.selectedMetrics.length > 1 ? `y${index}` : 'y'
                });

                // Add moving average if enabled
                if (state.showMovingAverage && chartType === 'line') {
                    const maValues = calculateMovingAverage(values, state.movingAverageWindow);
                    datasets.push({
                        label: `${metric} (MA-${state.movingAverageWindow})`,
                        data: maValues,
                        borderColor: config.color,
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        yAxisID: state.selectedMetrics.length > 1 ? `y${index}` : 'y'
                    });
                }
            }
        });
    }

    return datasets;
}

// Get default color for metric
function getDefaultColor(index) {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#795548', '#607D8B'];
    return colors[index % colors.length];
}

// Get chart options
function getChartOptions(xAxis, chartType) {
    const isScatter = chartType === 'scatter';

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: isScatter ? 'nearest' : 'index',
            intersect: isScatter
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#ffffff',
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: '#16213e',
                titleColor: '#ffffff',
                bodyColor: '#b8b8b8',
                borderColor: '#3a3a5a',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        const metric = context.dataset.label;
                        // Remove MA suffix for config lookup
                        const baseMetric = metric.replace(/ \(MA-\d+\)$/, '').split(' - ').pop();
                        const config = metricConfig[baseMetric] || {};
                        const value = context.parsed.y.toFixed(config.decimals || 1);
                        if (isScatter) {
                            return `${metric}: Shot ${context.parsed.x}, Value: ${value}${config.unit || ''}`;
                        }
                        return `${metric}: ${value}${config.unit || ''}`;
                    }
                }
            },
            zoom: {
                zoom: {
                    wheel: { enabled: true },
                    pinch: { enabled: true },
                    mode: 'xy'
                },
                pan: {
                    enabled: true,
                    mode: 'xy'
                }
            }
        },
        scales: {
            x: {
                type: isScatter ? 'linear' : 'category',
                title: {
                    display: true,
                    text: xAxis === 'shot' ? 'Shot Number' : 'Date/Session',
                    color: '#b8b8b8'
                },
                grid: {
                    color: '#2a2a4a'
                },
                ticks: {
                    color: '#b8b8b8'
                }
            }
        }
    };

    // Configure Y axes
    if (state.selectedMetrics.length === 1) {
        const metric = state.selectedMetrics[0];
        const config = metricConfig[metric] || {};
        options.scales.y = {
            title: {
                display: true,
                text: `${metric}${config.unit ? ' (' + config.unit + ')' : ''}`,
                color: '#b8b8b8'
            },
            grid: {
                color: '#2a2a4a'
            },
            ticks: {
                color: '#b8b8b8'
            }
        };
    } else if (state.selectedMetrics.length > 1) {
        // Multiple Y axes for different metrics
        state.selectedMetrics.forEach((metric, index) => {
            const config = metricConfig[metric] || {};
            options.scales[`y${index}`] = {
                type: 'linear',
                display: index < 2, // Only show first two axes
                position: index % 2 === 0 ? 'left' : 'right',
                title: {
                    display: index < 2,
                    text: `${metric}${config.unit ? ' (' + config.unit + ')' : ''}`,
                    color: config.color || '#b8b8b8'
                },
                grid: {
                    drawOnChartArea: index === 0,
                    color: '#2a2a4a'
                },
                ticks: {
                    color: config.color || '#b8b8b8'
                }
            };
        });
    }

    return options;
}

// Reset chart zoom
function resetChartZoom() {
    if (state.chart) {
        state.chart.resetZoom();
    }
}

// Update statistics
function updateStats() {
    const data = getFilteredData();

    if (data.length === 0) {
        elements.statsGrid.innerHTML = '<p class="empty-state">No data to display</p>';
        return;
    }

    const metrics = getNumericColumns();
    const statsHTML = metrics.slice(0, 8).map(metric => {
        const values = data.map(row => row[metric]).filter(v => !isNaN(v));
        const config = metricConfig[metric] || { decimals: 1, unit: '' };

        if (values.length === 0) return '';

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        return `
            <div class="stat-card">
                <div class="stat-label">${metric}</div>
                <div class="stat-value">${avg.toFixed(config.decimals)}${config.unit}</div>
                <div class="stat-detail">Min: ${min.toFixed(config.decimals)} | Max: ${max.toFixed(config.decimals)}</div>
            </div>
        `;
    }).join('');

    elements.statsGrid.innerHTML = statsHTML || '<p class="empty-state">No numeric data found</p>';
}

// Update data table
function updateDataTable() {
    const data = getFilteredData();
    state.filteredData = data;
    state.currentPage = 1;

    if (data.length === 0) {
        elements.tableHead.innerHTML = '';
        elements.tableBody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 40px;">No data to display</td></tr>';
        elements.pagination.innerHTML = '';
        return;
    }

    // Get display columns (exclude internal columns)
    const columns = Object.keys(data[0]).filter(key => !key.startsWith('_'));

    // Render table header (strip any remaining quotes from display)
    elements.tableHead.innerHTML = `
        <tr>
            <th onclick="sortTable('_shotNumber')" class="${state.sortColumn === '_shotNumber' ? 'sorted-' + state.sortDirection : ''}">#</th>
            ${columns.map(col => {
                const displayName = stripQuotes(col);
                return `<th onclick="sortTable('${col}')" class="${state.sortColumn === col ? 'sorted-' + state.sortDirection : ''}">${displayName}</th>`;
            }).join('')}
        </tr>
    `;

    renderTablePage();
}

// Render current table page
function renderTablePage() {
    const data = state.filteredData;
    const start = (state.currentPage - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;
    const pageData = data.slice(start, end);

    const columns = Object.keys(data[0]).filter(key => !key.startsWith('_'));

    elements.tableBody.innerHTML = pageData.map(row => `
        <tr>
            <td>${row._shotNumber}</td>
            ${columns.map(col => {
                const value = row[col];
                const config = metricConfig[stripQuotes(col)] || {};

                // Format Club Type specially
                if (col === 'Club Type' || stripQuotes(col) === 'Club Type') {
                    return `<td>${formatClubType(value)}</td>`;
                }

                if (typeof value === 'number') {
                    return `<td>${value.toFixed(config.decimals || 1)}</td>`;
                }
                return `<td>${value !== null && value !== undefined ? value : ''}</td>`;
            }).join('')}
        </tr>
    `).join('');

    renderPagination();
}

// Render pagination controls
function renderPagination() {
    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage);

    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <button onclick="goToPage(1)" ${state.currentPage === 1 ? 'disabled' : ''}>First</button>
        <button onclick="goToPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''}>Prev</button>
    `;

    // Show page numbers
    const startPage = Math.max(1, state.currentPage - 2);
    const endPage = Math.min(totalPages, state.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="goToPage(${i})" class="${i === state.currentPage ? 'active' : ''}">${i}</button>
        `;
    }

    paginationHTML += `
        <button onclick="goToPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''}>Next</button>
        <button onclick="goToPage(${totalPages})" ${state.currentPage === totalPages ? 'disabled' : ''}>Last</button>
    `;

    elements.pagination.innerHTML = paginationHTML;
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage);
    state.currentPage = Math.max(1, Math.min(page, totalPages));
    renderTablePage();
}

// Sort table by column
function sortTable(column) {
    if (state.sortColumn === column) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortColumn = column;
        state.sortDirection = 'asc';
    }

    state.filteredData.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return state.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (state.sortDirection === 'asc') {
            return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
    });

    state.currentPage = 1;
    updateDataTable();
}

// Handle table search
function handleTableSearch() {
    const searchTerm = elements.tableSearch.value.toLowerCase();
    const data = getFilteredData();

    if (!searchTerm) {
        state.filteredData = data;
    } else {
        state.filteredData = data.filter(row => {
            return Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            );
        });
    }

    state.currentPage = 1;
    renderTablePage();
}

// Export filtered data to CSV
function exportFilteredData() {
    const data = state.filteredData;
    if (data.length === 0) return;

    const columns = Object.keys(data[0]).filter(key => !key.startsWith('_'));
    const headers = columns.join(',');
    const rows = data.map(row => columns.map(col => {
        const value = row[col];
        if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
        }
        return value;
    }).join(','));

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `golf_data_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Clear all data
function clearAllData() {
    state.rawData = [];
    state.filteredData = [];
    state.files = [];
    state.selectedMetrics = [];
    state.selectedClubs = ['all'];
    state.currentPage = 1;
    state.sortColumn = null;
    state.sortDirection = 'asc';

    if (state.chart) {
        state.chart.destroy();
        state.chart = null;
    }

    elements.fileList.innerHTML = '';
    elements.fileInput.value = '';
    elements.controlsSection.style.display = 'none';
    elements.chartSection.style.display = 'none';
    elements.statsSection.style.display = 'none';
    elements.dataTableSection.style.display = 'none';
}

// Make functions globally accessible
window.toggleMetric = toggleMetric;
window.toggleClub = toggleClub;
window.removeFile = removeFile;
window.goToPage = goToPage;
window.sortTable = sortTable;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
