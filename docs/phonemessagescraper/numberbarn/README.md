# Phone Number Scraper

A Python application that scrapes websites to extract phone numbers and text content, then exports the results to CSV files.

## Features

- **Web Scraping**: Extract text content from websites using BeautifulSoup
- **Phone Number Detection**: Advanced regex patterns to find various phone number formats
- **Multiple Export Formats**: Save results to organized CSV files
- **Phone Number Categorization**: Classify numbers as local, toll-free, or international
- **Respectful Scraping**: Built-in delays between requests
- **Comprehensive Reporting**: Detailed statistics and summaries

## Installation

1. Clone or download this repository
2. Install required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Command Line Interface

**Basic usage:**
```bash
python phone_scraper.py https://example.com
```

**Multiple URLs:**
```bash
python phone_scraper.py https://site1.com https://site2.com https://site3.com
```

**URLs from file:**
```bash
python phone_scraper.py --file urls.txt
```

**Custom options:**
```bash
python phone_scraper.py https://example.com --delay 2 --output results --filename my_scrape
```

### Command Line Options

- `urls`: One or more URLs to scrape
- `--file, -f`: Text file containing URLs (one per line)
- `--delay, -d`: Delay between requests in seconds (default: 1.0)
- `--output, -o`: Output directory (default: output)
- `--filename`: Custom base filename for exports
- `--no-text`: Exclude full text content from exports

### URL File Format

Create a text file with URLs, one per line:

```
https://example.com
https://company.com/contact
https://business.org/about
# Comments start with #
```

## Output Files

The application creates several CSV files in the output directory:

1. **Phone Numbers CSV**: Individual phone numbers with metadata
   - `phone_number`: Raw extracted number
   - `formatted_phone`: Standardized format
   - `source_url`: Source webpage
   - `category`: local/toll-free/international
   - `extracted_at`: Timestamp

2. **Scraped Text CSV**: Full text content from each page
   - `url`: Source webpage
   - `text_content`: Extracted text
   - `text_length`: Character count
   - `phone_count`: Numbers found on page
   - `scraped_at`: Timestamp

3. **Combined CSV**: Phone numbers with surrounding context
   - Includes phone data plus text snippets around each number

4. **Summary CSV**: Statistics about the scraping session
   - Total URLs, phone counts, success rates, etc.

## Phone Number Formats Detected

The application can detect various phone number formats:

- **Standard US**: 123-456-7890, (123) 456-7890, 123.456.7890
- **International**: +1-123-456-7890, +44 20 1234 5678
- **Toll-free**: 800-123-4567, 888-123-4567, 877-123-4567
- **With extensions**: 123-456-7890 ext 123
- **No separators**: 1234567890

## Example Usage

### Basic Scraping

```python
from phone_scraper import PhoneNumberScraper

scraper = PhoneNumberScraper()
urls = ['https://example.com']
results = scraper.scrape_urls(urls)
scraper.print_summary(results)
scraper.export_results(results)
```

### Custom Configuration

```python
# With custom delay and output directory
scraper = PhoneNumberScraper(delay=2.0, output_dir="my_results")

# Scrape with specific options
results = scraper.scrape_urls(urls, include_text=False)
```

## Project Structure

```
phonenumberscraper/
├── phone_scraper.py      # Main application
├── web_scraper.py        # Web scraping functionality
├── phone_extractor.py    # Phone number extraction
├── csv_exporter.py       # CSV export functionality
├── requirements.txt      # Dependencies
├── README.md            # This file
├── example_urls.txt     # Sample URLs
└── output/              # Default output directory
```

## Dependencies

- **requests**: HTTP library for web scraping
- **beautifulsoup4**: HTML parsing
- **lxml**: XML/HTML parser
- **pandas**: Data manipulation and CSV handling

## Error Handling

The application includes robust error handling:

- Invalid URLs are skipped with warnings
- Failed page loads are logged but don't stop execution
- Network timeouts are handled gracefully
- Malformed HTML is processed safely

## Performance Tips

1. **Adjust delay**: Increase delay for slower websites or to be more respectful
2. **Batch processing**: Use URL files for large lists
3. **Output management**: Use custom filenames to organize results
4. **Memory usage**: Use `--no-text` for large-scale scraping

## Ethical Considerations

- **Respect robots.txt**: Check website scraping policies
- **Rate limiting**: Use appropriate delays between requests
- **Data privacy**: Be mindful of personal information in scraped data
- **Legal compliance**: Ensure scraping complies with local laws

## Troubleshooting

**Common Issues:**

1. **Import errors**: Install dependencies with `pip install -r requirements.txt`
2. **Permission denied**: Ensure output directory is writable
3. **Network errors**: Check internet connection and URL validity
4. **Empty results**: Website may block automated requests

**Debugging:**

- Enable verbose output by checking console messages
- Review generated CSV files for data quality
- Test with simple websites first

## License

This project is provided as-is for educational and research purposes.