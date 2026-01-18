# 23andMe DNA Matches Scraper

This is an application that scrapes 23andMe DNA Matches and outputs the data to CSV files.

## Features

- **All DNA Matches Export**: Scrapes all your DNA matches and exports them to `all_dna_matches.csv`
- **Relatives in Common**: For each DNA match, extracts relatives in common and saves to separate CSV files
- **Configurable**: Easy configuration through `config.ini` file
- **Automated**: Uses Playwright for reliable web automation

## Requirements

- Python 3.8 or higher
- 23andMe account with DNA matches

## Installation

1. Clone this repository:
```bash
git clone https://github.com/mwinfiel0331/dnamatches.git
cd dnamatches
```

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

3. Install Playwright browsers:
```bash
playwright install chromium
```

4. Create configuration file:
```bash
cp config.ini.example config.ini
```

5. Edit `config.ini` and add your 23andMe credentials:
```ini
[23andme]
email = your_email@example.com
password = your_password_here

[scraper]
delay = 2
max_matches = 0
output_dir = output
```

## Usage

Run the scraper:
```bash
python dna_scraper.py
```

The scraper will:
1. Log in to your 23andMe account
2. Navigate to the DNA Relatives page
3. Scrape all DNA matches and save to `output/all_dna_matches.csv`
4. For each match, scrape relatives in common and save to `output/relatives_in_common_[match_name]_[match_id].csv`

## Output Files

### 1. All DNA Matches (`all_dna_matches.csv`)
Contains all your DNA matches with the following columns:
- `match_id`: Unique identifier for the match
- `name`: Name of the DNA match
- `relationship`: Predicted relationship
- `shared_dna`: Percentage of shared DNA
- `shared_segments`: Number of shared segments

### 2. Relatives in Common (`relatives_in_common_[match_name]_[match_id].csv`)
For each DNA match, contains relatives you both share:
- `relative_id`: Unique identifier for the relative
- `name`: Name of the shared relative
- `relationship_to_match`: Relationship to the match
- `shared_dna_with_relative`: DNA shared with this relative

## Configuration Options

- `email`: Your 23andMe account email
- `password`: Your 23andMe account password
- `delay`: Time to wait between requests in seconds (default: 2)
- `max_matches`: Maximum number of matches to process (0 for all)
- `output_dir`: Directory where CSV files will be saved (default: output)

## Important Notes

- **Privacy**: Keep your `config.ini` file secure and never commit it to version control
- **Rate Limiting**: The scraper includes delays to avoid overwhelming the 23andMe servers
- **Structure Changes**: If 23andMe updates their website structure, the CSS selectors may need to be updated
- **Terms of Service**: Ensure your use of this scraper complies with 23andMe's Terms of Service

## Troubleshooting

### Login Issues
- Verify your credentials in `config.ini`
- Check if 23andMe has additional authentication (2FA)

### No Matches Found
- The CSS selectors may need to be updated if 23andMe changed their website
- Check the browser logs for errors

### Missing Data
- Increase the `delay` setting in `config.ini` to allow more time for pages to load
- Some matches may not have relatives in common

## License

MIT License - feel free to use and modify as needed.

## Disclaimer

This tool is for personal use only. Always respect the privacy of your DNA matches and use this data responsibly.
