# MVP and Features

## Project Vision

The DNA Matches Scraper aims to provide a reliable, automated way for individuals to extract and preserve their DNA match data from 23andMe for personal genealogical research and family history analysis.

## Minimum Viable Product (MVP)

### MVP Scope

The MVP focuses on core functionality needed for basic DNA match data extraction and export.

### MVP Features (✅ Completed)

#### 1. User Authentication
- ✅ Login to 23andMe with email and password
- ✅ Configuration file-based credential management
- ✅ Secure credential storage (excluded from version control)

#### 2. DNA Matches Extraction
- ✅ Navigate to DNA Relatives page
- ✅ Scrape all DNA match cards
- ✅ Extract key match information:
  - Match ID (auto-generated)
  - Name
  - Predicted relationship
  - Shared DNA percentage
  - Number of shared segments
- ✅ Export to CSV format (`all_dna_matches.csv`)

#### 3. Relatives in Common
- ✅ Navigate to individual match pages
- ✅ Extract relatives in common for each match
- ✅ Capture relative information:
  - Relative ID (auto-generated)
  - Name
  - Relationship to match
  - Shared DNA percentage
- ✅ Export to separate CSV files per match

#### 4. Configuration System
- ✅ INI file configuration format
- ✅ Configurable scraping parameters:
  - Delay between requests
  - Maximum matches to process
  - Output directory
- ✅ Example configuration file

#### 5. Error Handling and Logging
- ✅ Comprehensive logging system
- ✅ Graceful error handling
- ✅ Informative error messages
- ✅ Continue processing on individual match failures

#### 6. Data Export
- ✅ UTF-8 encoded CSV files
- ✅ Sanitized filenames
- ✅ Organized output structure

### MVP Deliverables

| Deliverable | Status | Location |
|-------------|--------|----------|
| Main scraper application | ✅ Complete | `dna_scraper.py` |
| Configuration example | ✅ Complete | `config.ini.example` |
| Requirements file | ✅ Complete | `requirements.txt` |
| Documentation | ✅ Complete | `README.md` |
| Example output generator | ✅ Complete | `create_example_output.py` |
| Git repository | ✅ Complete | GitHub |

### MVP Success Criteria

- ✅ Successfully authenticate with 23andMe
- ✅ Extract all DNA matches from account
- ✅ Export matches to valid CSV file
- ✅ Extract relatives in common for each match
- ✅ Export relatives to individual CSV files
- ✅ Handle errors gracefully without crashing
- ✅ Provide clear logging of operations
- ✅ Complete documentation for setup and usage

## Post-MVP Features (Roadmap)

### Phase 1: Enhanced Reliability (Priority: High)

#### 1. Two-Factor Authentication Support
**Status**: 🔴 Not Started

**Description**: Support for 23andMe accounts with 2FA enabled

**Implementation**:
- Detect 2FA challenge page
- Wait for user to complete 2FA
- Continue scraping after authentication

**Benefits**:
- Works with more secure accounts
- Wider user compatibility

**Estimated Effort**: Medium (2-3 weeks)

#### 2. Incremental Updates
**Status**: 🔴 Not Started

**Description**: Only scrape new/changed matches instead of full re-scrape

**Implementation**:
- Store hash of last scrape results
- Compare current matches with previous scrape
- Only fetch details for new/changed matches
- Merge with existing data

**Benefits**:
- Faster execution for regular updates
- Reduced load on 23andMe servers
- Lower chance of rate limiting

**Estimated Effort**: High (3-4 weeks)

#### 3. Retry Logic with Exponential Backoff
**Status**: 🔴 Not Started

**Description**: Automatically retry failed requests with increasing delays

**Implementation**:
- Detect transient errors (timeouts, network issues)
- Retry with exponential backoff (2s, 4s, 8s, 16s)
- Maximum retry attempts (3-5)
- Log retry attempts

**Benefits**:
- More resilient to temporary network issues
- Better handling of rate limits
- Improved success rate

**Estimated Effort**: Low (1 week)

### Phase 2: Enhanced Data Extraction (Priority: Medium)

#### 4. Additional Match Data
**Status**: 🔴 Not Started

**Description**: Extract more detailed information from match profiles

**Data to Add**:
- Match profile URL
- Last sign-in date
- Opted-in to Family Tree
- Introduction message status
- Shared surnames
- Ancestral birthplaces
- Haplogroup information

**Benefits**:
- Richer dataset for analysis
- More genealogical research value
- Better relationship predictions

**Estimated Effort**: Medium (2-3 weeks)

#### 5. Segment Data Extraction
**Status**: 🔴 Not Started

**Description**: Extract detailed DNA segment information

**Data to Include**:
- Chromosome number
- Start and end positions
- Segment length in cM
- SNP count

**Benefits**:
- Advanced genealogical analysis
- Triangulation capabilities
- More accurate relationship determination

**Estimated Effort**: High (4-5 weeks)

#### 6. Family Tree Data
**Status**: 🔴 Not Started

**Description**: Extract family tree information if shared by matches

**Implementation**:
- Navigate to Family Tree view
- Extract ancestor names, dates, locations
- Build tree structure
- Export in GEDCOM format

**Benefits**:
- Comprehensive genealogical data
- Compatible with genealogy software
- Better ancestor identification

**Estimated Effort**: High (5-6 weeks)

### Phase 3: Alternative Export Formats (Priority: Medium)

#### 7. JSON Export
**Status**: 🔴 Not Started

**Description**: Export data in JSON format for programmatic access

**Implementation**:
- Add `--format json` command-line option
- Export nested structure (matches with embedded relatives)
- Pretty-printed output option

**Benefits**:
- Better for programmatic access
- Easier data manipulation
- Web application integration

**Estimated Effort**: Low (1 week)

#### 8. Excel Export
**Status**: 🔴 Not Started

**Description**: Export to Excel with formatting and multiple sheets

**Implementation**:
- Use openpyxl library
- Multiple sheets (matches, relatives, summary)
- Formatted tables with headers
- Data validation
- Conditional formatting

**Benefits**:
- User-friendly for non-technical users
- Advanced filtering and sorting
- Charts and visualizations

**Estimated Effort**: Medium (2 weeks)

#### 9. GEDCOM Export
**Status**: 🔴 Not Started

**Description**: Export family relationships in GEDCOM format

**Implementation**:
- Convert DNA matches to GEDCOM individuals
- Create family relationships
- Include DNA evidence tags
- Compatible with Ancestry.com, MyHeritage, etc.

**Benefits**:
- Direct import to genealogy software
- Standard format
- Preserves relationship data

**Estimated Effort**: High (3-4 weeks)

### Phase 4: Database Storage (Priority: Medium)

#### 10. SQLite Storage
**Status**: 🔴 Not Started

**Description**: Store data in local SQLite database instead of CSV

**Schema**:
- `matches` table
- `relatives` table
- `match_relatives` junction table
- `scrape_sessions` table (for versioning)

**Benefits**:
- Efficient queries
- Relationship integrity
- Historical tracking
- Better for large datasets

**Estimated Effort**: Medium (2-3 weeks)

#### 11. PostgreSQL Support
**Status**: 🔴 Not Started

**Description**: Support PostgreSQL for cloud deployments

**Benefits**:
- Multi-user access
- Better concurrency
- Advanced features
- Cloud-ready

**Estimated Effort**: Medium (2-3 weeks)

### Phase 5: Advanced Features (Priority: Low)

#### 12. Graphical User Interface (GUI)
**Status**: 🔴 Not Started

**Description**: Desktop application with GUI for non-technical users

**Technology**: PyQt6 or Tkinter

**Features**:
- Configuration wizard
- Progress bar during scraping
- Data preview
- Export options
- Error display

**Benefits**:
- Accessible to non-programmers
- Better user experience
- Visual feedback

**Estimated Effort**: High (6-8 weeks)

#### 13. Data Visualization
**Status**: 🔴 Not Started

**Description**: Generate charts and graphs from DNA match data

**Visualizations**:
- Relationship distribution pie chart
- DNA percentage histogram
- Match timeline
- Geographic map of matches
- Family tree diagram

**Technology**: Matplotlib, Plotly, or D3.js

**Benefits**:
- Quick insights
- Professional reports
- Research presentations

**Estimated Effort**: Medium (3-4 weeks)

#### 14. Comparison Tool
**Status**: 🔴 Not Started

**Description**: Compare multiple scrape sessions to track changes

**Features**:
- New matches since last scrape
- Matches who opted out
- Changed relationship predictions
- New shared DNA amounts
- Diff reports

**Benefits**:
- Track account changes over time
- Identify newly available matches
- Historical analysis

**Estimated Effort**: Medium (2-3 weeks)

#### 15. Web Dashboard
**Status**: 🔴 Not Started

**Description**: Web-based interface for viewing and analyzing data

**Technology**: Flask or FastAPI + React

**Features**:
- Browse matches in web interface
- Search and filter
- Interactive visualizations
- Export from web
- Multiple user accounts

**Benefits**:
- Accessible from any device
- Better for sharing
- Remote access

**Estimated Effort**: Very High (8-12 weeks)

#### 16. Automated Scheduling
**Status**: 🔴 Not Started

**Description**: Built-in scheduler for automatic periodic scraping

**Features**:
- Schedule weekly/monthly scraping
- Email notifications on completion
- Automatic backups
- Error alerts

**Benefits**:
- Hands-off operation
- Always up-to-date data
- No cron setup needed

**Estimated Effort**: Medium (2-3 weeks)

#### 17. Multi-Account Support
**Status**: 🔴 Not Started

**Description**: Manage and scrape multiple 23andMe accounts

**Use Cases**:
- Family members' accounts
- Testing accounts
- Research projects

**Features**:
- Multiple credential profiles
- Switch between accounts
- Consolidated reporting

**Benefits**:
- Family genealogy projects
- Comparative analysis
- Bulk operations

**Estimated Effort**: Medium (2-3 weeks)

### Phase 6: Integration Features (Priority: Low)

#### 18. Ancestry.com Integration
**Status**: 🔴 Not Started

**Description**: Export/import data to/from Ancestry.com

**Estimated Effort**: High (4-5 weeks)

#### 19. MyHeritage Integration
**Status**: 🔴 Not Started

**Description**: Export/import data to/from MyHeritage

**Estimated Effort**: High (4-5 weeks)

#### 20. GEDmatch Integration
**Status**: 🔴 Not Started

**Description**: Format data for GEDmatch upload

**Estimated Effort**: Medium (2-3 weeks)

## Feature Prioritization Matrix

| Feature | Priority | Effort | User Value | Technical Risk |
|---------|----------|--------|------------|----------------|
| 2FA Support | High | Medium | High | Medium |
| Incremental Updates | High | High | High | Medium |
| Retry Logic | High | Low | High | Low |
| Additional Match Data | Medium | Medium | Medium | Low |
| JSON Export | Medium | Low | Medium | Low |
| SQLite Storage | Medium | Medium | High | Low |
| GUI | Low | High | High | Medium |
| Web Dashboard | Low | Very High | High | High |

## Development Roadmap

### Q1 2024
- ✅ MVP Release
- ✅ Documentation
- 🔴 2FA Support
- 🔴 Retry Logic

### Q2 2024
- 🔴 Incremental Updates
- 🔴 Additional Match Data
- 🔴 JSON Export

### Q3 2024
- 🔴 SQLite Storage
- 🔴 Excel Export
- 🔴 Segment Data

### Q4 2024
- 🔴 Data Visualization
- 🔴 Comparison Tool

### 2025+
- 🔴 GUI
- 🔴 Web Dashboard
- 🔴 External Integrations

## Community Feature Requests

To request a feature or vote on existing requests:
1. Open an issue on GitHub
2. Use the "feature request" label
3. Describe the use case and benefits
4. Community can upvote with 👍

## Contributing to Features

Contributors are welcome to implement features from the roadmap:

1. **Choose a feature** from the roadmap
2. **Open an issue** to discuss implementation
3. **Fork the repository**
4. **Implement the feature** following code style
5. **Add tests** for new functionality
6. **Update documentation**
7. **Submit a pull request**

## Feature Dependencies

Some features depend on others:

```
Incremental Updates
    ↓
SQLite Storage
    ↓
Web Dashboard
```

```
Additional Match Data
    ↓
Advanced Visualizations
```

```
JSON Export
    ↓
API Integration
```

## Deprecated/Rejected Features

### Auto-message Matches
**Rejected**: Violates 23andMe Terms of Service

### Automated DNA Analysis
**Rejected**: Requires specialized domain knowledge and separate tool

### Social Media Integration
**Rejected**: Privacy concerns

## Version History

### v1.0.0 (Current - MVP)
- Basic scraping functionality
- CSV export
- Configuration system
- Error handling
- Documentation

### v2.0.0 (Planned)
- 2FA support
- Incremental updates
- Retry logic
- Enhanced logging

### v3.0.0 (Planned)
- Database storage
- Multiple export formats
- Advanced match data

### v4.0.0 (Future)
- GUI
- Visualizations
- Web interface
