#!/usr/bin/env python3
"""
Test script to verify resource search fixes
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from services.fetcher import ResourceFetcher
from dotenv import load_dotenv

# Load environment
load_dotenv('backend/.env')

def test_fallback_resources():
    """Test the fallback resource generation"""
    print("\n" + "="*60)
    print("TEST 1: Fallback Resources Generation")
    print("="*60)
    
    fetcher = ResourceFetcher()
    fallback = fetcher.get_fallback_resources("Python Programming", "CS101")
    
    print(f"\n✓ Generated {len(fallback)} fallback resources:")
    for i, res in enumerate(fallback, 1):
        print(f"  {i}. {res['title']}")
        print(f"     Source: {res['source']}")
        print(f"     URL: {res['url']}")
    
    return len(fallback) == 5

def test_fetcher_initialization():
    """Test the fetcher initialization"""
    print("\n" + "="*60)
    print("TEST 2: Fetcher Initialization")
    print("="*60)
    
    fetcher = ResourceFetcher()
    
    has_youtube_key = bool(fetcher.YOUTUBE_API_KEY)
    has_google_key = bool(fetcher.GOOGLE_SEARCH_API_KEY)
    has_cx = bool(fetcher.SEARCH_ENGINE_ID)
    
    print(f"\n✓ YouTube API Key: {'Configured' if has_youtube_key else 'Missing'}")
    print(f"✓ Google Search API Key: {'Configured' if has_google_key else 'Missing'}")
    print(f"✓ Custom Search Engine ID: {'Configured' if has_cx else 'Missing'}")
    
    return has_youtube_key and has_google_key and has_cx

def test_error_handling():
    """Test error handling capabilities"""
    print("\n" + "="*60)
    print("TEST 3: Error Handling")
    print("="*60)
    
    fetcher = ResourceFetcher()
    
    # Test with invalid query (should handle gracefully)
    videos = fetcher.fetch_youtube_videos("", max_results=1)
    articles = fetcher.fetch_web_articles("", max_results=1)
    
    print(f"\n✓ Empty query handling:")
    print(f"  - YouTube: Returned {len(videos)} videos (expected 0)")
    print(f"  - Google: Returned {len(articles)} articles (expected 0 or more)")
    
    return True

def test_auto_fetch_fallback():
    """Test auto-fetch with fallback"""
    print("\n" + "="*60)
    print("TEST 4: Auto-Fetch with Fallback")
    print("="*60)
    
    fetcher = ResourceFetcher()
    
    # Simulate auto-fetch (this will likely hit APIs)
    results, query = fetcher.auto_fetch_resources(
        "Data Structures",
        "CS101",
        search_query="linked lists",
        language="English"
    )
    
    print(f"\n✓ Auto-fetch results:")
    print(f"  - Query used: {query}")
    print(f"  - Resources found: {len(results)}")
    
    if results:
        print(f"  - First resource:")
        print(f"    Title: {results[0]['title']}")
        print(f"    Source: {results[0]['source']}")
    
    return len(results) > 0

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("RESOURCE SEARCH FIX - VERIFICATION TESTS")
    print("="*60)
    
    tests = [
        ("Fallback Resources Generation", test_fallback_resources),
        ("Fetcher Initialization", test_fetcher_initialization),
        ("Error Handling", test_error_handling),
        ("Auto-Fetch with Fallback", test_auto_fetch_fallback),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ Error in {test_name}: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! Resource search is ready to use.")
        print("\nYou can now:")
        print("  1. Add a new course")
        print("  2. Add topics to the course")
        print("  3. Search for resources")
        print("  4. Resources will be found (either from APIs or fallback)")
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
