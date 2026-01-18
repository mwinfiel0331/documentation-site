# Requirements

## Project Overview

The 23andMe DNA Matches Scraper is a Python-based application that automates the extraction of DNA match data from the 23andMe platform. The tool enables users to export their DNA matches and relatives in common to CSV files for further analysis and record-keeping.

## Functional Requirements

### Core Features

1. **User Authentication**
   - Securely log in to 23andMe using user credentials
   - Support for configuration-based credential management
   - Proper session handling and cleanup

2. **DNA Matches Extraction**
   - Scrape all DNA matches from the DNA Relatives page
   - Extract match details including:
     - Match ID
     - Name
     - Predicted relationship
     - Percentage of shared DNA
     - Number of shared segments
   - Export all matches to a CSV file

3. **Relatives in Common**
   - For each DNA match, extract relatives in common
   - Capture relative details:
     - Relative ID
     - Name
     - Relationship to the match
     - Shared DNA percentage with the relative
   - Export relatives to separate CSV files per match

4. **Configurable Scraping**
   - Configurable delay between requests to respect rate limits
   - Option to limit the number of matches to process
   - Customizable output directory

5. **Data Export**
   - CSV format for compatibility with spreadsheet applications
   - UTF-8 encoding to support international characters
   - Sanitized filenames for cross-platform compatibility

## Non-Functional Requirements

### Performance

- **Efficiency**: Minimize the number of requests to 23andMe servers
- **Rate Limiting**: Include configurable delays to avoid overwhelming servers
- **Lazy Loading**: Handle dynamic content loading through scrolling

### Reliability

- **Error Handling**: Graceful handling of network errors, timeouts, and page structure changes
- **Logging**: Comprehensive logging of all operations for debugging
- **Recovery**: Continue processing remaining matches if individual matches fail

### Security

- **Credential Protection**: Never commit credentials to version control
- **Secure Storage**: Configuration file excluded from git via .gitignore
- **Input Sanitization**: Sanitize user-provided data in filenames

### Usability

- **Simple Configuration**: Easy-to-use INI file format for settings
- **Clear Logging**: Human-readable progress and error messages
- **Documentation**: Comprehensive README and usage instructions

## Technical Requirements

### System Requirements

- **Python Version**: Python 3.8 or higher
- **Operating System**: Cross-platform (Windows, macOS, Linux)
- **Browser**: Chromium (installed via Playwright)

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| playwright | 1.40.0 | Web automation and browser control |

### Python Standard Library Dependencies

- `os` - File and directory operations
- `csv` - CSV file reading and writing
- `time` - Delays and timing
- `logging` - Application logging
- `configparser` - Configuration file parsing
- `typing` - Type hints for better code quality

## User Requirements

### Prerequisites

1. Active 23andMe account
2. Opted in to DNA Relatives feature on 23andMe
3. Valid login credentials (email and password)
4. Python programming environment

### Assumed Knowledge

- Basic command-line usage
- Basic Python environment management
- Understanding of pip for package installation

## Data Requirements

### Input Data

- **Configuration File** (`config.ini`):
  - 23andMe email address
  - 23andMe password
  - Scraper settings (delay, max_matches, output_dir)

### Output Data

- **All DNA Matches CSV** (`all_dna_matches.csv`):
  - Columns: match_id, name, relationship, shared_dna, shared_segments
  - One row per DNA match
  - UTF-8 encoded

- **Relatives in Common CSVs** (`relatives_in_common_[name]_[id].csv`):
  - Columns: relative_id, name, relationship_to_match, shared_dna_with_relative
  - One file per match with relatives in common
  - UTF-8 encoded

## Compliance and Legal

### Terms of Service

- Users must ensure their use complies with 23andMe's Terms of Service
- Tool is intended for personal use only
- Respect privacy of DNA matches

### Data Privacy

- No data is transmitted to third parties
- All data stays local on user's machine
- Users responsible for securing their exported data

## Constraints

### Technical Constraints

- Dependent on 23andMe's website structure
- May break if 23andMe updates their HTML/CSS
- Requires stable internet connection
- Single-threaded execution (one operation at a time)

### Business Constraints

- Personal use only (not for commercial purposes)
- Subject to 23andMe rate limiting
- May require updates if 23andMe implements CAPTCHA or additional security

## Future Considerations

### Potential Enhancements

- Support for two-factor authentication (2FA)
- Multi-format export (JSON, Excel)
- Database storage option (SQLite, PostgreSQL)
- GUI for non-technical users
- Incremental updates (only fetch new matches)
- Advanced filtering and search capabilities
- Data visualization features
- Match relationship graphing

### Scalability

- Currently designed for individual users
- Could be extended to batch process multiple accounts
- Potential for cloud deployment
