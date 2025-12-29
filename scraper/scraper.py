"""
Kingston Happenings Event Scraper
=================================

A proof-of-concept web scraper for discovering events in Kingston, Ontario.
This script is designed to run as a cron job to periodically discover and 
update events from various sources.

RECOMMENDED CRON SCHEDULE:
- Run every 6 hours for general event discovery
- Run daily at 6 AM for best results (after venues typically update their sites)

Example cron entry (every 6 hours):
0 */6 * * * /usr/bin/python3 /path/to/scraper.py

Example cron entry (daily at 6 AM):
0 6 * * * /usr/bin/python3 /path/to/scraper.py

NOTE: This is a proof of concept. In production, you would:
1. Store scraped events in a database
2. Add proper error handling and logging
3. Implement rate limiting to be respectful to source websites
4. Add duplicate detection to avoid re-adding existing events
5. Send notifications when new events are discovered
"""

import re
import json
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ScrapedEvent:
    """Represents an event scraped from the web."""
    title: str
    description: str
    date: str  # ISO format: YYYY-MM-DD
    start_time: str  # 24-hour format: HH:MM
    end_time: Optional[str]
    venue_name: str
    venue_address: str
    categories: list[str]
    price: Optional[str]
    source_url: str
    image_url: Optional[str]
    ticket_url: Optional[str]


class KingstonEventScraper:
    """
    Web scraper for discovering events in Kingston, Ontario.
    
    This scraper targets various sources that list Kingston events:
    - Venue websites (The Grand Theatre, Leon's Centre, etc.)
    - Event aggregator sites
    - Restaurant/bar social media and websites
    - Tourism Kingston
    """
    
    HEADERS = {
        'User-Agent': 'KingstonHappenings/1.0 (Event Discovery Bot; contact@kingstonhappenings.ca)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-CA,en;q=0.9',
    }
    
    # Category keywords for auto-tagging
    CATEGORY_KEYWORDS = {
        'concert': ['concert', 'live music', 'band', 'singer', 'musician', 'performance', 'gig', 'show'],
        'food-deal': ['happy hour', 'special', 'deal', 'discount', 'half price', 'wing night', 'taco tuesday'],
        'trivia': ['trivia', 'quiz', 'pub quiz', 'game night'],
        'theatre': ['theatre', 'theater', 'play', 'musical', 'drama', 'comedy show', 'improv'],
        'sports': ['hockey', 'frontenacs', 'game', 'tournament', 'match', 'sports'],
        'festival': ['festival', 'fair', 'celebration', 'parade'],
        'market': ['market', 'farmers market', 'craft fair', 'artisan'],
        'workshop': ['workshop', 'class', 'lesson', 'course', 'learn', 'paint night'],
        'nightlife': ['dj', 'club', 'dance', 'party', 'nightclub', 'late night'],
        'family': ['family', 'kids', 'children', 'all ages'],
        'community': ['community', 'meetup', 'networking', 'charity', 'fundraiser'],
    }
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)
        self.scraped_events: list[ScrapedEvent] = []
    
    def _detect_categories(self, text: str) -> list[str]:
        """Auto-detect event categories based on text content."""
        text_lower = text.lower()
        categories = []
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                categories.append(category)
        
        return categories if categories else ['community']  # Default category
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats into ISO format."""
        try:
            parsed = date_parser.parse(date_str, fuzzy=True)
            return parsed.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            return None
    
    def _parse_time(self, time_str: str) -> Optional[str]:
        """Parse various time formats into 24-hour format."""
        try:
            # Try to extract time from string
            time_patterns = [
                r'(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)',
                r'(\d{1,2})\s*(am|pm|AM|PM)',
                r'(\d{1,2}):(\d{2})',
            ]
            
            for pattern in time_patterns:
                match = re.search(pattern, time_str)
                if match:
                    parsed = date_parser.parse(match.group(), fuzzy=True)
                    return parsed.strftime('%H:%M')
            return None
        except (ValueError, TypeError):
            return None
    
    def _fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a web page."""
        try:
            logger.info(f"Fetching: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'lxml')
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None
    
    def scrape_grand_theatre(self) -> list[ScrapedEvent]:
        """
        Scrape events from The Grand Theatre Kingston.
        
        Note: This is a mock implementation. In production, you would need to:
        1. Inspect the actual website structure
        2. Handle pagination
        3. Extract all relevant event details
        """
        events = []
        base_url = "https://kingstongrand.ca"
        
        # Mock implementation - in reality, you'd scrape the actual page
        logger.info("Scraping The Grand Theatre (mock implementation)")
        
        # Example of how you would scrape:
        # soup = self._fetch_page(f"{base_url}/events")
        # if soup:
        #     event_cards = soup.find_all('div', class_='event-card')
        #     for card in event_cards:
        #         title = card.find('h3').text.strip()
        #         date = card.find('span', class_='date').text
        #         ...
        
        # Mock event for demonstration
        events.append(ScrapedEvent(
            title="Kingston Symphony: Winter Concert",
            description="An evening of classical music featuring works by Tchaikovsky and Beethoven.",
            date=(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            start_time="19:30",
            end_time="21:30",
            venue_name="The Grand Theatre",
            venue_address="218 Princess St, Kingston, ON",
            categories=['concert', 'theatre'],
            price="$35-75",
            source_url=f"{base_url}/events/symphony-winter",
            image_url=None,
            ticket_url=f"{base_url}/tickets/symphony-winter"
        ))
        
        return events
    
    def scrape_leons_centre(self) -> list[ScrapedEvent]:
        """
        Scrape events from Leon's Centre (hockey games, concerts, etc.).
        """
        events = []
        base_url = "https://leonscentre.com"
        
        logger.info("Scraping Leon's Centre (mock implementation)")
        
        # Mock event
        events.append(ScrapedEvent(
            title="Kingston Frontenacs vs Oshawa Generals",
            description="OHL hockey action as the Frontenacs take on the Generals.",
            date=(datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'),
            start_time="19:00",
            end_time="22:00",
            venue_name="Leon's Centre",
            venue_address="1 The Tragically Hip Way, Kingston, ON",
            categories=['sports', 'family'],
            price="$18-45",
            source_url=f"{base_url}/events/frontenacs",
            image_url=None,
            ticket_url=f"{base_url}/tickets/frontenacs"
        ))
        
        return events
    
    def scrape_tourism_kingston(self) -> list[ScrapedEvent]:
        """
        Scrape events from Visit Kingston / Tourism Kingston.
        This is often a good source for festivals, markets, and community events.
        """
        events = []
        base_url = "https://www.visitkingston.ca"
        
        logger.info("Scraping Tourism Kingston (mock implementation)")
        
        # Mock events
        events.append(ScrapedEvent(
            title="Kingston Christmas Market",
            description="Annual holiday market featuring local artisans, food vendors, and live entertainment.",
            date=(datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'),
            start_time="10:00",
            end_time="17:00",
            venue_name="Market Square",
            venue_address="216 Ontario St, Kingston, ON",
            categories=['market', 'festival', 'family'],
            price="Free Admission",
            source_url=f"{base_url}/events/christmas-market",
            image_url=None,
            ticket_url=None
        ))
        
        return events
    
    def scrape_local_pubs(self) -> list[ScrapedEvent]:
        """
        Scrape recurring events from local pubs and restaurants.
        
        Many pubs have regular events like trivia nights, open mics, etc.
        that may not be listed on event aggregator sites.
        """
        events = []
        
        logger.info("Scraping local pub events (mock implementation)")
        
        # The Ale House - Trivia Nights
        # In reality, you'd scrape their website or social media
        events.append(ScrapedEvent(
            title="Trivia Night at The Ale House",
            description="Weekly trivia night! Teams of up to 6. Prizes for top 3 teams.",
            date=(datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
            start_time="19:00",
            end_time="22:00",
            venue_name="The Ale House",
            venue_address="393 Princess St, Kingston, ON",
            categories=['trivia'],
            price="Free",
            source_url="https://alehousekingston.com/events",
            image_url=None,
            ticket_url=None
        ))
        
        # The Toucan - Wing Night
        events.append(ScrapedEvent(
            title="Half-Price Wings Wednesday",
            description="All wings half price every Wednesday! Over 20 sauces available.",
            date=self._get_next_weekday(2).strftime('%Y-%m-%d'),  # Next Wednesday
            start_time="11:00",
            end_time="23:00",
            venue_name="The Toucan",
            venue_address="76 Princess St, Kingston, ON",
            categories=['food-deal'],
            price="Half-Price Wings",
            source_url="https://toucankingston.com",
            image_url=None,
            ticket_url=None
        ))
        
        # Kingston Brewing Company - Open Mic
        events.append(ScrapedEvent(
            title="Open Mic Night",
            description="Bring your guitar, voice, or poetry! Sign-up starts at 7pm.",
            date=self._get_next_weekday(3).strftime('%Y-%m-%d'),  # Next Thursday
            start_time="20:00",
            end_time="23:30",
            venue_name="Kingston Brewing Company",
            venue_address="34 Clarence St, Kingston, ON",
            categories=['concert', 'nightlife'],
            price="Free",
            source_url="https://kingstonbrewing.ca/events",
            image_url=None,
            ticket_url=None
        ))
        
        return events
    
    def _get_next_weekday(self, weekday: int) -> datetime:
        """Get the next occurrence of a specific weekday (0=Monday, 6=Sunday)."""
        today = datetime.now()
        days_ahead = weekday - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        return today + timedelta(days=days_ahead)
    
    def scrape_all_sources(self) -> list[ScrapedEvent]:
        """
        Scrape events from all configured sources.
        
        Returns a list of all discovered events.
        """
        all_events = []
        
        # Scrape each source
        scrapers = [
            self.scrape_grand_theatre,
            self.scrape_leons_centre,
            self.scrape_tourism_kingston,
            self.scrape_local_pubs,
        ]
        
        for scraper in scrapers:
            try:
                events = scraper()
                all_events.extend(events)
                logger.info(f"{scraper.__name__}: Found {len(events)} events")
            except Exception as e:
                logger.error(f"{scraper.__name__} failed: {e}")
        
        self.scraped_events = all_events
        return all_events
    
    def export_to_json(self, filepath: str = "scraped_events.json") -> None:
        """Export scraped events to JSON file."""
        events_dict = [asdict(event) for event in self.scraped_events]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump({
                'scraped_at': datetime.now().isoformat(),
                'event_count': len(events_dict),
                'events': events_dict
            }, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Exported {len(events_dict)} events to {filepath}")
    
    def get_summary(self) -> dict:
        """Get a summary of scraped events."""
        if not self.scraped_events:
            return {'total': 0, 'by_category': {}, 'by_venue': {}}
        
        by_category: dict[str, int] = {}
        by_venue: dict[str, int] = {}
        
        for event in self.scraped_events:
            for cat in event.categories:
                by_category[cat] = by_category.get(cat, 0) + 1
            by_venue[event.venue_name] = by_venue.get(event.venue_name, 0) + 1
        
        return {
            'total': len(self.scraped_events),
            'by_category': dict(sorted(by_category.items(), key=lambda x: x[1], reverse=True)),
            'by_venue': dict(sorted(by_venue.items(), key=lambda x: x[1], reverse=True))
        }


def main():
    """
    Main entry point for the scraper.
    
    This function is designed to be run as a cron job.
    """
    logger.info("=" * 50)
    logger.info("Kingston Happenings Event Scraper")
    logger.info("=" * 50)
    
    scraper = KingstonEventScraper()
    
    # Scrape all sources
    events = scraper.scrape_all_sources()
    
    # Export results
    scraper.export_to_json()
    
    # Print summary
    summary = scraper.get_summary()
    logger.info(f"\nScraping Complete!")
    logger.info(f"Total events found: {summary['total']}")
    logger.info(f"\nEvents by category:")
    for cat, count in summary['by_category'].items():
        logger.info(f"  - {cat}: {count}")
    logger.info(f"\nEvents by venue:")
    for venue, count in summary['by_venue'].items():
        logger.info(f"  - {venue}: {count}")
    
    # In production, you would:
    # 1. Compare with existing events in database
    # 2. Add new events
    # 3. Update changed events
    # 4. Send notifications for new discoveries
    
    logger.info("\nNote: This is a proof of concept. Mock data was used.")
    logger.info("In production, implement actual web scraping for each source.")


if __name__ == "__main__":
    main()

