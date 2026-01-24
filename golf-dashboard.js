// Golf Dashboard JavaScript - Data handling and visualization

// Global state
const state = {
    rawData: [],
    filteredData: [],
    files: [],
    selectedMetrics: [],
    selectedClubs: ['all'],
    chart: null,
    currentPage: 1,
    rowsPerPage: 25,
    sortColumn: null,
    sortDirection: 'asc'
};

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
    'pw': '#4CAF50',
    'PW': '#4CAF50',
    '5w': '#2196F3',
    '5W': '#2196F3',
    '3w': '#9C27B0',
    '3W': '#9C27B0',
    'driver': '#FF9800',
    'Driver': '#FF9800',
    'dr': '#FF9800',
    'DR': '#FF9800',
    '5i': '#E91E63',
    '5I': '#E91E63',
    '6i': '#00BCD4',
    '6I': '#00BCD4',
    '7i': '#795548',
    '7I': '#795548',
    '8i': '#607D8B',
    '8I': '#607D8B',
    '9i': '#FF5722',
    '9I': '#FF5722',
    'sw': '#3F51B5',
    'SW': '#3F51B5',
    'lw': '#009688',
    'LW': '#009688',
    'gw': '#CDDC39',
    'GW': '#CDDC39'
};

// DOM Elements
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    controlsSection: document.getElementById('controlsSection'),
    clubFilterGrid: document.getElementById('clubFilterGrid'),
    metricsGrid: document.getElementById('metricsGrid'),
    chartType: document.getElementById('chartType'),
    xAxisSelect: document.getElementById('xAxisSelect'),
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
    setupEventListeners();
    setupDragAndDrop();
}

// Setup event listeners
function setupEventListeners() {
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.updateChart.addEventListener('click', updateChart);
    elements.resetZoom.addEventListener('click', resetChartZoom);
    elements.clearData.addEventListener('click', clearAllData);
    elements.tableSearch.addEventListener('input', handleTableSearch);
    elements.exportData.addEventListener('click', exportFilteredData);
    elements.chartType.addEventListener('change', updateChart);
    elements.xAxisSelect.addEventListener('change', updateChart);
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

    // If it's already a string like "PW", "5W", "8i", return as-is
    if (typeof value === 'string' && isNaN(parseFloat(value))) {
        return value.toUpperCase();
    }

    // Convert numeric club codes to readable names
    const num = parseFloat(value);
    if (isNaN(num)) return String(value).toUpperCase();

    // Common club code mappings
    const clubMap = {
        1: 'Driver',
        2: '3W',
        3: '5W',
        4: '7W',
        5: '4i',
        6: '5i',
        7: '6i',
        8: '7i',
        9: '8i',
        10: '9i',
        11: 'PW',
        12: 'GW',
        13: 'SW',
        14: 'LW'
    };

    // If we have a mapping, use it; otherwise format as iron number
    if (clubMap[num]) {
        return clubMap[num];
    }

    // For values like 8.0, treat as the iron number
    if (num >= 1 && num <= 9) {
        return `${Math.floor(num)}i`;
    }

    return String(value);
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
    populateClubSelect();
    populateMetricsGrid();
    showSections();
    updateStats();
    updateDataTable();
    updateChart();
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

    // Sort clubs - try numeric sort first, then alphabetic
    clubs.sort((a, b) => {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return String(a).localeCompare(String(b));
    });

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

// Get filtered data based on club selection
function getFilteredData() {
    if (state.selectedClubs.includes('all')) {
        return state.rawData;
    }
    return state.rawData.filter(row =>
        state.selectedClubs.includes(row['Club Type'])
    );
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

    const datasets = createDatasets(data, xAxis);
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
function createDatasets(data, xAxis) {
    const datasets = [];
    const groupByClub = !state.selectedClubs.includes('all') && state.selectedClubs.length > 1;

    if (groupByClub) {
        // Create separate datasets for each club + metric combination
        state.selectedClubs.forEach(club => {
            const clubData = data.filter(row => row['Club Type'] === club);

            state.selectedMetrics.forEach(metric => {
                const config = metricConfig[metric] || { color: '#888' };
                const clubColor = clubColors[club] || config.color;

                datasets.push({
                    label: `${club.toUpperCase()} - ${metric}`,
                    data: xAxis === 'scatter'
                        ? clubData.map((row, i) => ({ x: i + 1, y: row[metric] }))
                        : clubData.map(row => row[metric]),
                    borderColor: clubColor,
                    backgroundColor: clubColor + '40',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                });
            });
        });
    } else {
        // Create datasets for each metric
        state.selectedMetrics.forEach((metric, index) => {
            const config = metricConfig[metric] || { color: getDefaultColor(index) };

            datasets.push({
                label: metric,
                data: xAxis === 'scatter'
                    ? data.map((row, i) => ({ x: i + 1, y: row[metric] }))
                    : data.map(row => row[metric]),
                borderColor: config.color,
                backgroundColor: config.color + '40',
                fill: false,
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: state.selectedMetrics.length > 1 ? `y${index}` : 'y'
            });
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
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
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
                        const config = metricConfig[metric.split(' - ').pop()] || {};
                        const value = context.parsed.y.toFixed(config.decimals || 1);
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
