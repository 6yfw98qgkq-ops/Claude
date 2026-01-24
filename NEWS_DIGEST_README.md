# Daily News Digest App

A personalized news aggregator that provides daily updates on your top 10 news topics from the most reputable sources.

## Features

- **Customizable Topics**: Enter up to 10 topics you want to follow
- **Source Prioritization**: Articles are ranked by source reputation (Reuters, AP, BBC, NYT, WSJ, etc. ranked highest)
- **Clean Layout**: Results are paginated (3 topics per page, max 4 pages)
- **Clickable Links**: Direct links to original articles
- **Persistent Settings**: Your API key and topics are saved for future sessions
- **Mobile Responsive**: Works on desktop and mobile devices

## Getting Started

### 1. Get a NewsAPI Key

1. Visit [https://newsapi.org](https://newsapi.org)
2. Sign up for a free account
3. Copy your API key from the dashboard

**Note**: The free tier includes:
- 100 requests per day
- Access to articles from the last 30 days
- Perfect for personal use

### 2. Open the App

Simply open `news-digest.html` in your web browser:

```bash
# From the command line
open news-digest.html  # macOS
xdg-open news-digest.html  # Linux
start news-digest.html  # Windows
```

Or double-click the file in your file explorer.

### 3. Configure Your API Key

1. Paste your NewsAPI key in the "NewsAPI Key" field
2. Click "Save API Key" - it will be stored locally in your browser

### 4. Add Your Topics

Enter your favorite topics (one per line) in the text area. Examples:
- Technology
- Artificial Intelligence
- Climate Change
- Space Exploration
- Cybersecurity
- Healthcare
- Finance
- Politics
- Sports
- Entertainment

### 5. Get Your News

Click "Get Today's News" and the app will fetch the latest articles from reputable sources.

## How It Works

### Source Prioritization

Articles are ranked in three tiers:

**Tier 1 (Top Sources)**:
- Associated Press, Reuters, BBC News
- The Wall Street Journal, The New York Times, The Washington Post
- Financial Times, Bloomberg, The Economist
- NPR, PBS, The Guardian
- ABC News, CBS News, NBC News, CNN, CNBC, Politico

**Tier 2 (Trusted Sources)**:
- Time, Business Insider, TechCrunch, Wired, Ars Technica
- The Verge, Engadget, Axios, The Hill, USA Today
- Fortune, Forbes, National Geographic, Scientific American
- New Scientist, The Atlantic, Vox

**Tier 3 (Other Sources)**:
- ESPN, Entertainment Weekly, Variety
- MTV News, Polygon, IGN, Mashable, Vice News
- And other reputable outlets

### Pagination

Results are organized into pages:
- Each page shows 3 topics
- Each topic displays up to 3 top articles
- Maximum of 10 topics total
- Navigate with Previous/Next buttons

### Data Storage

The app stores data locally in your browser:
- **API Key**: Encrypted in browser localStorage
- **Topics**: Saved for quick access next time
- **No server storage**: All data stays on your device

## Customization

### Adjusting Articles Per Topic

Edit `news-digest.js` line 27:
```javascript
const ARTICLES_PER_TOPIC = 3;  // Change to show more/fewer articles
```

### Adjusting Topics Per Page

Edit `news-digest.js` line 28:
```javascript
const TOPICS_PER_PAGE = 3;  // Change to show more/fewer topics per page
```

### Adding More Sources

Edit the `REPUTABLE_SOURCES` object in `news-digest.js` (lines 3-21) to add your preferred sources.

## Troubleshooting

### "Error fetching news"

- **Check your API key**: Make sure it's correct and saved
- **Rate limits**: Free tier allows 100 requests/day (10 topics uses ~10 requests)
- **Network issues**: Ensure you have an internet connection

### No articles found

- Try broader topic keywords (e.g., "AI" instead of "GPT-4 developments")
- Some niche topics may have limited coverage
- Try different time periods by adjusting the date range in the code

### API key not saving

- Check browser localStorage is enabled
- Try a different browser if issues persist
- Make sure you're not in incognito/private mode

## Privacy

- All data is stored locally in your browser
- No tracking or analytics
- API requests go directly to NewsAPI
- Your topics and preferences never leave your device

## Files

- `news-digest.html` - Main application interface
- `news-digest.css` - Styling and layout
- `news-digest.js` - Application logic and API integration

## Browser Support

Works with all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Free to use and modify for personal use.

## Credits

- News data provided by [NewsAPI.org](https://newsapi.org)
- Built with vanilla HTML, CSS, and JavaScript
