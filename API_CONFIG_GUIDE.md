# API Configuration Guide

## Issue: YouTube and Google Search APIs returning 400 errors

If you're seeing "400 Bad Request" errors when searching for resources, it's likely due to API quota limits or misconfiguration.

## Solution Implemented

The system now has **automatic fallback** when API calls fail:

1. **Primary (Online)**: Attempts to fetch real YouTube videos and Google articles
2. **Fallback**: If APIs fail, suggests links to:
   - Wikipedia
   - Khan Academy  
   - Udemy
   - Medium
   - Stack Overflow

## Checking Your API Setup

### 1. YouTube API Key
```
Current Status: AIzaSyCe_NRI31Xiu7qr0cYGAJ6EszRPyxOMSTs
```

**To fix quota issues:**
- Visit: https://console.cloud.google.com/
- Go to: APIs & Services > Quotas
- Find: YouTube Data API v3
- Check remaining quota
- If exceeded, wait 24 hours or upgrade to paid plan

### 2. Google Custom Search API
```
Current Status: Search Engine ID (CX) = f7e10cd0cf9624153
```

**To verify setup:**
- Visit: https://cse.google.com/cse/all
- Check if search engine is active
- Verify API key has Custom Search API enabled

## Testing the APIs

Run this to check API status:
```powershell
python -c "
from backend.services.fetcher import ResourceFetcher
fetcher = ResourceFetcher()
videos = fetcher.fetch_youtube_videos('Python programming', max_results=3)
print(f'YouTube test: {len(videos)} videos found')
"
```

## Current Behavior

- **With APIs working**: Real YouTube videos and articles
- **With APIs failing**: Helpful fallback suggestions with direct links
- **User experience**: Always gets search results, never blank

## Recommendations

1. **Check API quotas daily** - They reset every 24 hours
2. **Consider upgrading** - Get paid API plan for higher limits
3. **Use multiple API keys** - Distribute quota across keys
4. **Set up billing alerts** - Avoid surprise quota exhaustion

---

The system is configured to gracefully degrade and always provide useful results!
