# ML-Powered Auto-Recommend System Guide

This guide explains how to set up and use the new Auto-Recommendation Service.

## 1. Prerequisites
Ensure you have installed the required dependencies:
```bash
pip install sentence-transformers scikit-learn numpy requests python-dotenv flask-bcrypt
```

## 2. API Keys Setup
To allow the system to fetch resources from the internet, you need to set up API keys.
Create a `.env` file in the `backend/` directory or set environment variables:

```bash
# Windows PowerShell
$env:YOUTUBE_API_KEY="your_youtube_api_key"
$env:GOOGLE_SEARCH_API_KEY="your_google_search_api_key"
$env:SEARCH_ENGINE_ID="your_google_cse_id"
```
*Note: Without these keys, the fetcher will log warnings and return empty results.*

## 3. How It Works

### A. Auto-Fetching (Admin Only)
Instead of manually adding links, Admins can now trigger an auto-fetch for any topic.
- **Endpoint:** `POST /api/generate-resources`
- **Body:** `{"topic_id": 1}`
- **Action:** 
    1. Scrapes YouTube & Google for high-quality tutorials/articles.
    2. Filters duplicates.
    3. Saves to Database.
    4. Auto-calculates Semantic Embeddings (`embedding_vector`).

### B. Hybrid Recommendation Algorithm
The user sees recommendations based on a smart score:
`Score = (Semantic_Similarity * 0.6) + (Quality_Score * 0.4)`

- **Semantic Similarity:** Uses `all-MiniLM-L6-v2` to match Topic Name vs. Resource Title.
- **Quality Score:** Based on average user ratings + click popularity.
- **Cold Start:** New resources get a neutral score until users interact.

### C. Tracking User Behavior
The system now logs:
- `Click Count`: When a user opens a link (via `/api/log-interaction`).
- `Time Spent`: Used to infer quality (implicit feedback).
- `Bounce Rate`: (Planned) If time spent is < 10s.

## 4. Frontend Integration Guide

1. **Trigger Auto-Fetch (Admin Dashboard)**
   Add a button "Auto-Populate" next to each Topic in the Admin Panel.
   ```javascript
   await api.post('/api/generate-resources', { topic_id: currentTopic.id });
   ```

2. **Log Interactions (Student View)**
   When a user clicks a resource link:
   ```javascript
   await api.post('/api/log-interaction', { 
       resource_id: res.id, 
       type: 'click' 
   });
   window.open(res.url, '_blank');
   ```

3. **Display Recommendations**
   Use the new endpoint instead of the generic resource list:
   ```javascript
   const response = await api.get(`/api/recommendations?topic_id=${topic.id}`);
   setResources(response.data);
   ```
