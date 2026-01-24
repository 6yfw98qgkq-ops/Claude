// Daily News Digest Application
// Prioritized news sources (Tier 1 = Most reputable)
const REPUTABLE_SOURCES = {
    tier1: [
        'associated-press', 'reuters', 'bbc-news', 'the-wall-street-journal',
        'the-new-york-times', 'the-washington-post', 'financial-times',
        'bloomberg', 'the-economist', 'npr', 'pbs', 'the-guardian',
        'abc-news', 'cbs-news', 'nbc-news', 'cnn', 'cnbc', 'politico'
    ],
    tier2: [
        'time', 'business-insider', 'techcrunch', 'wired', 'ars-technica',
        'the-verge', 'engadget', 'axios', 'the-hill', 'usa-today',
        'fortune', 'forbes', 'national-geographic', 'scientific-american',
        'new-scientist', 'the-atlantic', 'vox', 'buzzfeed-news'
    ],
    tier3: [
        'espn', 'entertainment-weekly', 'variety', 'hollywood-reporter',
        'mtv-news', 'polygon', 'ign', 'mashable', 'vice-news',
        'reddit-r-all', 'hacker-news', 'techradar', 'the-next-web'
    ]
};

const API_KEY_STORAGE = 'newsapi_key';
const TOPICS_STORAGE = 'user_topics';
const ARTICLES_PER_TOPIC = 3;
const TOPICS_PER_PAGE = 3;
const MAX_TOPICS = 10;

let currentPage = 1;
let allTopicData = [];
let apiKey = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadSavedAPIKey();
    loadSavedTopics();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('save-api-key').addEventListener('click', saveAPIKey);
    document.getElementById('fetch-news').addEventListener('click', fetchAllNews);
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));

    // Allow Enter key in API key field
    document.getElementById('api-key').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveAPIKey();
    });
}

function loadSavedAPIKey() {
    const saved = localStorage.getItem(API_KEY_STORAGE);
    if (saved) {
        apiKey = saved;
        document.getElementById('api-key').value = saved;
        showStatus('API key loaded', 'success');
    }
}

function loadSavedTopics() {
    const saved = localStorage.getItem(TOPICS_STORAGE);
    if (saved) {
        document.getElementById('topics-input').value = saved;
    }
}

function saveAPIKey() {
    const input = document.getElementById('api-key').value.trim();
    if (!input) {
        showStatus('Please enter an API key', 'error');
        return;
    }

    apiKey = input;
    localStorage.setItem(API_KEY_STORAGE, apiKey);
    showStatus('API key saved successfully!', 'success');
}

function showStatus(message, type) {
    const statusEl = document.getElementById('api-status');
    statusEl.textContent = message;
    statusEl.className = type;

    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = '';
    }, 3000);
}

function getTopicsFromInput() {
    const input = document.getElementById('topics-input').value;
    const topics = input
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .slice(0, MAX_TOPICS);

    return topics;
}

async function fetchAllNews() {
    if (!apiKey) {
        showError('Please enter and save your NewsAPI key first!');
        return;
    }

    const topics = getTopicsFromInput();

    if (topics.length === 0) {
        showError('Please enter at least one topic!');
        return;
    }

    // Save topics for next time
    localStorage.setItem(TOPICS_STORAGE, topics.join('\n'));

    // Show loading
    showLoading(true);
    hideError();
    hideResults();

    allTopicData = [];

    try {
        // Fetch news for each topic
        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            const articles = await fetchTopicNews(topic);

            allTopicData.push({
                topic: topic,
                number: i + 1,
                articles: articles
            });
        }

        // Display results
        currentPage = 1;
        displayResults();
        showLoading(false);
        showResults();

    } catch (error) {
        showLoading(false);
        showError(`Error fetching news: ${error.message}`);
        console.error('News fetch error:', error);
    }
}

async function fetchTopicNews(topic) {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const fromDate = lastWeek.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    // Try to get articles from reputable sources first
    const reputableSources = [
        ...REPUTABLE_SOURCES.tier1,
        ...REPUTABLE_SOURCES.tier2,
        ...REPUTABLE_SOURCES.tier3
    ].join(',');

    const url = `https://newsapi.org/v2/everything?` +
        `q=${encodeURIComponent(topic)}&` +
        `sources=${reputableSources}&` +
        `from=${fromDate}&` +
        `to=${toDate}&` +
        `sortBy=relevancy&` +
        `language=en&` +
        `pageSize=50&` +
        `apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch news');
    }

    const data = await response.json();

    if (data.status === 'error') {
        throw new Error(data.message);
    }

    // If we got articles, prioritize and return them
    if (data.articles && data.articles.length > 0) {
        return prioritizeArticles(data.articles).slice(0, ARTICLES_PER_TOPIC);
    }

    // If no articles from reputable sources, try general search
    const generalUrl = `https://newsapi.org/v2/everything?` +
        `q=${encodeURIComponent(topic)}&` +
        `from=${fromDate}&` +
        `to=${toDate}&` +
        `sortBy=relevancy&` +
        `language=en&` +
        `pageSize=${ARTICLES_PER_TOPIC * 2}&` +
        `apiKey=${apiKey}`;

    const generalResponse = await fetch(generalUrl);
    const generalData = await generalResponse.json();

    if (generalData.articles && generalData.articles.length > 0) {
        return prioritizeArticles(generalData.articles).slice(0, ARTICLES_PER_TOPIC);
    }

    return [];
}

function prioritizeArticles(articles) {
    return articles
        .map(article => {
            // Determine source tier
            const sourceId = article.source.id || '';
            let tier = 3;

            if (REPUTABLE_SOURCES.tier1.includes(sourceId)) {
                tier = 1;
            } else if (REPUTABLE_SOURCES.tier2.includes(sourceId)) {
                tier = 2;
            }

            // Check source name for well-known outlets if ID not found
            const sourceName = (article.source.name || '').toLowerCase();
            if (tier === 3) {
                if (sourceName.includes('reuters') || sourceName.includes('associated press') ||
                    sourceName.includes('bbc') || sourceName.includes('wall street') ||
                    sourceName.includes('new york times') || sourceName.includes('washington post') ||
                    sourceName.includes('bloomberg') || sourceName.includes('financial times')) {
                    tier = 1;
                } else if (sourceName.includes('cnn') || sourceName.includes('npr') ||
                          sourceName.includes('guardian') || sourceName.includes('abc news') ||
                          sourceName.includes('nbc') || sourceName.includes('cbs')) {
                    tier = 1;
                }
            }

            return { ...article, tier };
        })
        .sort((a, b) => {
            // Sort by tier first (1 is best), then by publishedAt
            if (a.tier !== b.tier) {
                return a.tier - b.tier;
            }
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });
}

function displayResults() {
    const container = document.getElementById('news-container');
    container.innerHTML = '';

    // Calculate pagination
    const startIdx = (currentPage - 1) * TOPICS_PER_PAGE;
    const endIdx = Math.min(startIdx + TOPICS_PER_PAGE, allTopicData.length);
    const pageTopics = allTopicData.slice(startIdx, endIdx);

    // Display topics for this page
    pageTopics.forEach(topicData => {
        const topicSection = createTopicSection(topicData);
        container.appendChild(topicSection);
    });

    // Update pagination controls
    updatePaginationControls();

    // Update timestamp
    const now = new Date();
    document.querySelector('.update-time').textContent =
        `Last updated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
}

function createTopicSection(topicData) {
    const section = document.createElement('div');
    section.className = 'topic-section';

    const header = document.createElement('div');
    header.className = 'topic-header';
    header.innerHTML = `
        <div class="topic-number">${topicData.number}</div>
        <h3 class="topic-title">${escapeHtml(topicData.topic)}</h3>
    `;
    section.appendChild(header);

    if (topicData.articles.length === 0) {
        const noArticles = document.createElement('div');
        noArticles.className = 'no-articles';
        noArticles.textContent = 'No recent articles found for this topic.';
        section.appendChild(noArticles);
    } else {
        topicData.articles.forEach(article => {
            const articleEl = createArticleElement(article);
            section.appendChild(articleEl);
        });
    }

    return section;
}

function createArticleElement(article) {
    const articleDiv = document.createElement('div');
    articleDiv.className = 'article';

    const tierClass = `tier-${article.tier}`;
    const tierLabel = article.tier === 1 ? 'Top Source' :
                     article.tier === 2 ? 'Trusted Source' : 'Source';

    const publishedDate = new Date(article.publishedAt).toLocaleDateString();

    articleDiv.innerHTML = `
        <div class="article-header">
            <div class="article-title">
                <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(article.title)}
                </a>
            </div>
            <span class="source-badge ${tierClass}">${tierLabel}</span>
        </div>
        ${article.description ? `<p class="article-description">${escapeHtml(article.description)}</p>` : ''}
        <div class="article-meta">
            <span class="article-source">${escapeHtml(article.source.name)}</span>
            <span class="article-date">${publishedDate}</span>
        </div>
    `;

    return articleDiv;
}

function updatePaginationControls() {
    const totalPages = Math.ceil(allTopicData.length / TOPICS_PER_PAGE);

    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}

function changePage(delta) {
    const totalPages = Math.ceil(allTopicData.length / TOPICS_PER_PAGE);
    const newPage = currentPage + delta;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayResults();

        // Scroll to top of results
        document.getElementById('results-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
}

function showResults() {
    document.getElementById('results-section').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results-section').classList.add('hidden');
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
