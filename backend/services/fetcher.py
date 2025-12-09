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
        Uses ThreadPoolExecutor to fetch from reliable sources in parallel.
        """
        lang_map = {
            'Tamil': 'ta',
            'Sinhala': 'si',
            'English': 'en'
        }
        lang_code = lang_map.get(language, 'en')

        # --- OPTIMIZED QUERY GENERATION ---
        # Format: "{module_name} {topic_name} in {language} language"
        # We strip the module code (e.g. "CS101 - Intro" -> "Intro") for cleaner search
        clean_course_name = course_name.split('-')[-1].strip() if '-' in course_name else course_name
        
        keywords = [clean_course_name]
        
        if topic_name and topic_name != "General":
            keywords.append(topic_name)
            
        if language != 'English':
             keywords.append(f"in {language} language")
        
        # If user provided a specific description, we append it but keep the structural context
        if search_query and search_query.strip():
             # We use the raw user query but prepend the course context to ground it
             final_query = f"{clean_course_name} {search_query}"
             if language != 'English': final_query += f" in {language}"
        else:
             final_query = " ".join(keywords)

        self.logger.info(f"Auto-fetching with Optimized Query: {final_query} (Lang: {lang_code})")

        videos = []
        articles = []
        
        # Helper wrappers for parallel execution
        def get_videos():
            if not resource_format or resource_format == 'video':
                return self.fetch_youtube_videos(final_query, max_results=10, lang_code=lang_code)
            return []

        def get_articles():
            if not resource_format or resource_format in ['article', 'pdf']:
                return self.fetch_web_articles(final_query, max_results=10, lang_code=lang_code)
            return []

        # Execute in parallel
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_videos = executor.submit(get_videos)
            future_articles = executor.submit(get_articles)
            
            try:
                videos = future_videos.result(timeout=10)
            except Exception as e:
                self.logger.error(f"Async Video Fetch Failed: {e}")
                
            try:
                articles = future_articles.result(timeout=10)
            except Exception as e:
                self.logger.error(f"Async Article Fetch Failed: {e}")
        
        results = videos + articles
        
        # --- FAST RELEVANCE FILTER (The "Gatekeeper") ---
        # If we have a specific search intent, we filter results that don't match key terms
        # This acts as a cheap "LLM-lite" layer.
        filtered_results = []
        search_terms = set(final_query.lower().split())
        
        for item in results:
            # Combine title and description for checking
            text_corpus = (item['title'] + " " + item['description']).lower()
            
            # Simple scoring: how many query terms appear?
            # We skip 'in', 'language', 'video' etc common stop words if we want, but for now exact matching is fine
            score = sum(1 for term in search_terms if term in text_corpus)
            
            # Acceptance threshold: match at least 1 significant word from the query
            if score > 0:
                filtered_results.append(item)
            else:
                 # Fallback: if result list is small, keep it anyway
                 pass 
        
        # If filtering was too aggressive, return original results
        return filtered_results if filtered_results else results
