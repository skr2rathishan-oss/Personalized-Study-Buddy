import os
import requests
import json
import logging
from datetime import datetime

class ResourceFetcher:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # Load keys at runtime (safer than module-level)
        self.YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
        self.GOOGLE_SEARCH_API_KEY = os.getenv('GOOGLE_SEARCH_API_KEY')
        self.SEARCH_ENGINE_ID = os.getenv('SEARCH_ENGINE_ID')

    def fetch_youtube_videos(self, query, max_results=3, lang_code='en'):
        """
        Fetches videos from YouTube Data API v3 based on a query.
        """
        if not self.YOUTUBE_API_KEY:
            self.logger.warning("YouTube API Key not found. Returning empty list.")
            return []

        search_url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'key': self.YOUTUBE_API_KEY,
            'maxResults': max_results,
            'relevanceLanguage': lang_code
        }

        try:
            response = requests.get(search_url, params=params, timeout=10)
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

    def fetch_web_articles(self, query, max_results=3, lang_code='en'):
        """
        Fetches articles using Google Custom Search JSON API.
        """
        if not self.GOOGLE_SEARCH_API_KEY or not self.SEARCH_ENGINE_ID:
            self.logger.warning("Google Search API Key/CX not found. Returning empty list.")
            return []

        search_url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': self.GOOGLE_SEARCH_API_KEY,
            'cx': self.SEARCH_ENGINE_ID,
            'q': query,
            'num': max_results,
            'lr': f'lang_{lang_code}'
        }

        try:
            response = requests.get(search_url, params=params, timeout=10)
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

    def auto_fetch_resources(self, topic_name, course_name, search_query=None, language='English', resource_format=None):
        """
        High-level function to fetch both videos and articles for a topic.
        Generates an enhanced query string with language support.
        """
        lang_map = {
            'Tamil': 'ta',
            'Sinhala': 'si',
            'English': 'en'
        }
        lang_code = lang_map.get(language, 'en')

        # Intelligent query expansion
        keywords = []
        
        # If user provides a description/search query, it's the most important intent
        if search_query and search_query.strip():
            keywords.append(search_query) # e.g. "Simple explanation for beginners"
            keywords.append(topic_name)   # Context
        else:
            keywords.append(topic_name)
            keywords.append(course_name)
            keywords.append("tutorial")
        
        # Append language instruction to query text as well for better matches
        if language != 'English':
             keywords.append(f"in {language}")
        
        final_query = " ".join(keywords)
        self.logger.info(f"Auto-fetching with query: {final_query} (Lang: {lang_code}) (Format: {resource_format})")

        videos = []
        articles = []

        if not resource_format or resource_format == 'video':
            videos = self.fetch_youtube_videos(final_query, max_results=3, lang_code=lang_code)
        
        if not resource_format or resource_format in ['article', 'pdf']:
            articles = self.fetch_web_articles(final_query, max_results=3, lang_code=lang_code)
        
        return videos + articles
