import requests
from bs4 import BeautifulSoup
import time
import os
import re

def clean_text(text):
    # Remove multiple newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def get_content(url):
    print(f"Fetching: {url}")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch {url}: {response.status_code}")
            return None

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find the main content
        # Mintlify often uses <article> or <main>
        content_area = soup.find('article') or soup.find('main')
        
        if not content_area:
            # Fallback to a div that might contain the content
            # Often it's a div with a class containing 'prose'
            content_area = soup.find('div', class_=re.compile(r'prose'))
            
        if content_area:
            # Remove navigation, footer, etc. if they are inside
            for extra in content_area.find_all(['nav', 'footer', 'header']):
                extra.decompose()
            
            # Extract text
            text = content_area.get_text(separator='\n', strip=True)
            return clean_text(text)
        else:
            # Last resort: get all text and try to find the start of content
            all_text = soup.get_text(separator='\n', strip=True)
            # Try to skip the navigation part if possible
            # This is a bit hacky but might work for this specific site
            if "Copy page" in all_text:
                return clean_text(all_text.split("Copy page")[-1])
            return clean_text(all_text)

    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    if not os.path.exists("urls.txt"):
        print("urls.txt not found. Please run the sitemap extraction first.")
        return

    with open("urls.txt", "r") as f:
        urls = [line.strip() for line in f if line.strip()]

    # Filter URLs to focus on API, Guide, Async API, and Best Practices
    # Skip terms and updates
    include_paths = ["/cn/api/", "/cn/guide/", "/cn/asyncapi/", "/cn/best-practice/"]
    exclude_paths = ["/cn/terms/", "/cn/update/"]
    
    filtered_urls = []
    for url in urls:
        if any(path in url for path in include_paths) and not any(path in url for path in exclude_paths):
            filtered_urls.append(url)
    
    # Sort URLs to have a consistent order (e.g., by path)
    filtered_urls.sort()

    print(f"Found {len(filtered_urls)} filtered URLs.")
    
    full_docs = []
    
    # We'll use a session for better performance
    session = requests.Session()
    
    for i, url in enumerate(filtered_urls):
        content = get_content(url)
        if content:
            # Create a header from the URL
            title = url.split('/')[-1].replace('-', ' ').title()
            full_docs.append(f"## SOURCE: {url}\n\n# {title}\n\n{content}\n\n---\n")
        
        # Rate limiting
        time.sleep(0.5)
        
        # Progress indicator
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1}/{len(filtered_urls)} pages...")

    with open("zhipu_api_docs.md", "w", encoding="utf-8") as f:
        f.write("# Zhipu AI API Documentation\n\n")
        f.write(f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("\n".join(full_docs))
    
    print(f"Saved {len(full_docs)} pages to zhipu_api_docs.md")

if __name__ == "__main__":
    main()
