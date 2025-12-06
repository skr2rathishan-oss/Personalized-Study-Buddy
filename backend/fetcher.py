import os
import requests
import json
import logging
from datetime import datetime

# You would technically put API keys in .env, but for this simulation we use placeholders
# or mock responses if keys aren't actually set.
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
GOOGLE_SEARCH_API_KEY = os.getenv('GOOGLE_SEARCH_API_KEY')
SEARCH_ENGINE_ID = os.getenv('SEARCH_ENGINE_ID')

class ResourceFetcher:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def fetch_youtube_videos(self, query, max_results=5):
        """
        Fetches videos from YouTube Data API v3 based on a query.
        """
        if not YOUTUBE_API_KEY:
            self.logger.warning("YouTube API Key not found. Returning empty list.")
            return []

        search_url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'key': YOUTUBE_API_KEY,
            'maxResults': max_results,
            'relevanceLanguage': 'en'
        }

        try:
            response = requests.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            videos = []
            for item in data.get('items', []):
                videos.append({
                    'title': item['snippet']['title'],
                    'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                    'description': item['snippet']['description'],
                    'format': 'video',
                    'source': 'youtube',
                    'meta': {
                        'channel': item['snippet']['channelTitle'],
                        'published_at': item['snippet']['publishedAt'],
                        'thumbnail': item['snippet']['thumbnails']['high']['url']
                    }
                })
            return videos
        except Exception as e:
            self.logger.error(f"YouTube Fetch Error: {str(e)}")
            return []

    def fetch_web_articles(self, query, max_results=5):
        """
        Fetches articles using Google Custom Search JSON API.
        """
        if not GOOGLE_SEARCH_API_KEY or not SEARCH_ENGINE_ID:
            self.logger.warning("Google Search API Key/CX not found. Returning empty list.")
            return []

        search_url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': GOOGLE_SEARCH_API_KEY,
            'cx': SEARCH_ENGINE_ID,
            'q': query,
            'num': max_results,
            'lr': 'lang_en'
        }

        try:
            response = requests.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            articles = []
            for item in data.get('items', []):
                # Simple filter to avoid YouTube links in web search
                if 'youtube.com' in item['link']:
                    continue
                    
                articles.append({
                    'title': item['title'],
                    'url': item['link'],
                    'description': item.get('snippet', ''),
                    'format': 'article',
                    'source': 'google_search',
                    'meta': {
                        'display_link': item['displayLink']
                    }
                })
            return articles
        except Exception as e:
            self.logger.error(f"Google Search Fetch Error: {str(e)}")
            return []

    def auto_fetch_resources(self, topic_name, course_name):
        """
        High-level function to fetch both videos and articles for a topic.
        Generates an enhanced query string.
        """
        # Intelligent query expansion
        search_query = f"{topic_name} {course_name} tutorial education"
        
        videos = self.fetch_youtube_videos(search_query, max_results=3)
        articles = self.fetch_web_articles(search_query, max_results=3)
        
        return videos + articles
