# Kingston Happenings Event Scraper

A proof-of-concept web scraper for discovering events in Kingston, Ontario.

## Overview

This scraper is designed to run as a cron job to periodically discover events from various Kingston sources:

- **The Grand Theatre** - Theatre performances, concerts, comedy shows
- **Leon's Centre** - Hockey games, concerts, large events
- **Tourism Kingston** - Festivals, markets, community events
- **Local Pubs & Restaurants** - Trivia nights, food deals, open mics

## Installation

```bash
cd scraper
pip install -r requirements.txt
```

## Usage

### One-time Run
```bash
python scraper.py
```

### As a Cron Job

The recommended schedule depends on your needs:

**Every 6 hours** (good for catching updates):
```cron
0 */6 * * * /usr/bin/python3 /path/to/kingston-happenings/scraper/scraper.py
```

**Daily at 6 AM** (recommended - venues typically update overnight):
```cron
0 6 * * * /usr/bin/python3 /path/to/kingston-happenings/scraper/scraper.py
```

**Twice daily** (balanced approach):
```cron
0 6,18 * * * /usr/bin/python3 /path/to/kingston-happenings/scraper/scraper.py
```

## Output

The scraper exports events to `scraped_events.json`:

```json
{
  "scraped_at": "2024-12-16T10:00:00",
  "event_count": 6,
  "events": [
    {
      "title": "Trivia Night at The Ale House",
      "description": "Weekly trivia night!",
      "date": "2024-12-18",
      "start_time": "19:00",
      "venue_name": "The Ale House",
      "categories": ["trivia"],
      ...
    }
  ]
}
```

## Current Implementation

This is a **proof of concept** with mock data. To make it production-ready:

1. **Implement actual scraping**: Replace mock events with real web scraping logic for each source
2. **Database integration**: Store events in PostgreSQL/MongoDB
3. **Duplicate detection**: Compare scraped events with existing ones
4. **Rate limiting**: Be respectful to source websites
5. **Error handling**: Robust retry logic and alerting
6. **Notifications**: Alert when new events are discovered

## Adding New Sources

To add a new event source:

```python
def scrape_new_venue(self) -> list[ScrapedEvent]:
    events = []
    soup = self._fetch_page("https://example.com/events")
    
    if soup:
        for event_elem in soup.find_all('div', class_='event'):
            events.append(ScrapedEvent(
                title=event_elem.find('h2').text,
                # ... extract other fields
            ))
    
    return events
```

Then add it to `scrape_all_sources()`.

## Legal Considerations

- Always check a website's `robots.txt` before scraping
- Respect rate limits
- Include contact information in User-Agent header
- Some sites may require permission to scrape

