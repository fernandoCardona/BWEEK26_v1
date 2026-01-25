import scrapy
from scrapy.crawler import CrawlerProcess
import json
import os
import requests
from urllib.parse import urljoin

class BearsSitgesSpider(scrapy.Spider):
    name = 'bears_sitges'
    start_urls = ['https://bearssitges.org/bears-sitges-week/']
    
    # Custom settings for being polite and professional
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (compatible; BearsSitgesMigration/1.0)',
        'ROBOTSTXT_OBEY': True,
        'CONCURRENT_REQUESTS': 2,
        'DOWNLOAD_DELAY': 1,
    }

    def parse(self, response):
        # Base directory for this page
        page_name = response.url.split('/')[-2] or 'home'
        page_dir = f'scraping/pages/{page_name}'
        os.makedirs(f'{page_dir}/images', exist_ok=True)

        # Extract textual content
        content = {
            'url': response.url,
            'title': response.css('h1::text').get() or response.css('title::text').get(),
            'meta_description': response.css('meta[name="description"]::attr(content)').get(),
            'headings': {
                'h2': response.css('h2::text').getall(),
                'h3': response.css('h3::text').getall(),
            },
            'sections': []
        }

        # Extract main content sections (WordPress specific selectors commonly used)
        for section in response.css('div.elementor-section, div.wp-block-group, section'):
            # Simple heuristic for content extraction
            texts = section.css('p::text, h2::text, h3::text, li::text').getall()
            imgs = section.css('img::attr(src)').getall()
            
            if texts:
                content['sections'].append({
                    'text': ' '.join([t.strip() for t in texts if t.strip()]),
                    'images': [urljoin(response.url, img) for img in imgs]
                })

        # Download Images
        for img_url in response.css('img::attr(src)').getall():
            full_url = urljoin(response.url, img_url)
            img_name = img_url.split('/')[-1].split('?')[0]
            if img_name:
                self.download_image(full_url, f'{page_dir}/images/{img_name}')

        # Save JSON
        with open(f'{page_dir}/content.json', 'w', encoding='utf-8') as f:
            json.dump(content, f, indent=4, ensure_ascii=False)

        # Generate Markdown for easy reading
        self.generate_markdown(content, f'{page_dir}/content.md')

        # Find other links in navigation or main area to crawl
        # (Limited to the bears-sitges domain to avoid crawling external nets)
        links = response.css('nav a::attr(href), a.elementor-button::attr(href)').getall()
        for link in links:
            if 'bearssitges.org' in link and '/bears-sitges-week/' in link:
                yield response.follow(link, self.parse)

    def download_image(self, url, path):
        try:
            r = requests.get(url, stream=True, timeout=10)
            if r.status_code == 200:
                with open(path, 'wb') as f:
                    for chunk in r:
                        f.write(chunk)
        except Exception as e:
            self.logger.error(f"Failed to download image {url}: {e}")

    def generate_markdown(self, content, path):
        with open(path, 'w', encoding='utf-8') as f:
            f.write(f"# {content['title']}\n\n")
            f.write(f"**URL**: {content['url']}\n\n")
            f.write(f"## Metadata\n{content['meta_description']}\n\n")
            
            f.write("## Contenido por Secciones\n\n")
            for i, section in enumerate(content['sections']):
                f.write(f"### Sección {i+1}\n")
                f.write(f"{section['text']}\n\n")
                if section['images']:
                    f.write("#### Imágenes en esta sección:\n")
                    for img in section['images']:
                        f.write(f"- {img}\n")
                    f.write("\n")

# To run:
# if __name__ == "__main__":
#     process = CrawlerProcess()
#     process.crawl(BearsSitgesSpider)
#     process.start()
