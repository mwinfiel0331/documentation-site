# 📚 Next Investment Platform Documentation

Welcome to the comprehensive documentation for the Next Investment platform. This documentation set provides complete information about the system architecture, features, deployment, and development processes.

## 📖 Documentation Overview

This documentation is organized into the following sections:

### [00-requirements.md](00-requirements.md)
**Project Requirements & MVP Deliverables**
- Business requirements and objectives
- MVP deliverables (completed features)
- Later features and roadmap
- Technical requirements
- Non-functional requirements
- Success criteria and metrics

**Read this to understand**: What the platform does, why it was built, and what's planned for the future.

---

### [01-architecture.md](01-architecture.md)
**System Architecture, Data Flow & ER Diagrams**
- High-level system architecture
- Component architecture details
- Data flow diagrams
- Entity relationship (ER) diagrams
- Technology stack
- Deployment architecture
- Security architecture
- Scaling strategy

**Read this to understand**: How the system is designed, how data flows through the application, and how components interact.

---

### [02-data-model.md](02-data-model.md)
**Database Schema & Data Structures**
- Database schema (PostgreSQL)
- Data models (Python classes)
- Data relationships
- Data types and formats
- Indexes and performance optimization
- Data lifecycle management
- Migration strategies

**Read this to understand**: How data is stored, structured, and managed in the database.

---

### [03-development.md](03-development.md)
**How to Run Locally & Execute Tests**
- Development environment setup
- Running locally (step-by-step)
- Testing guide (integration, unit, manual)
- Code quality and linting
- Debugging techniques
- Development workflow
- Troubleshooting common issues

**Read this to**: Set up your development environment and start contributing to the project.

---

### [04-deployment.md](04-deployment.md)
**Production Deployment Guide**
- Railway Platform deployment (primary)
- Alternative deployment options
- Environment configuration
- Database setup
- Custom domain & SSL configuration
- Monitoring and maintenance
- Rollback procedures

**Read this to**: Deploy the application to production and manage live deployments.

---

### [05-application-flow.md](05-application-flow.md)
**Application Flow & Subprocess Execution**
- User journey flows
- Stock analysis process flow
- Portfolio comparison workflow
- Watchlist management flow
- Data processing pipeline
- Subprocess execution patterns
- Error handling flow
- Caching strategy

**Read this to understand**: How the application works from a user's perspective and how processes execute.

---

### [06-features.md](06-features.md)
**Feature Documentation with Later Enhancements**
- Current features (MVP)
- Feature details and specifications
- Phase 2 features (planned)
- Phase 3 features (AI/ML)
- Phase 4 features (platform expansion)
- Feature roadmap
- Feature request process

**Read this to**: Learn about current features and what's coming in future releases.

---

## 🚀 Quick Start Guides

### For New Users
1. Read [00-requirements.md](00-requirements.md) to understand what the platform does
2. Visit the live demo at [nextinvestment.ai](https://nextinvestment.ai)
3. Read [06-features.md](06-features.md) to learn about available features

### For Developers
1. Read [03-development.md](03-development.md) to set up your environment
2. Review [01-architecture.md](01-architecture.md) to understand the system design
3. Check [02-data-model.md](02-data-model.md) for database structure
4. Follow the development workflow in [03-development.md](03-development.md)

### For DevOps/Infrastructure
1. Review [01-architecture.md](01-architecture.md) for system architecture
2. Read [04-deployment.md](04-deployment.md) for deployment procedures
3. Check [02-data-model.md](02-data-model.md) for database requirements
4. Follow monitoring guidelines in [04-deployment.md](04-deployment.md)

### For Product Managers
1. Read [00-requirements.md](00-requirements.md) for business requirements
2. Review [06-features.md](06-features.md) for feature specifications
3. Check roadmap in [06-features.md](06-features.md)
4. Understand user flows in [05-application-flow.md](05-application-flow.md)

---

## 📊 Key Diagrams & Visualizations

### Architecture Diagrams
- **High-Level Architecture**: [01-architecture.md](01-architecture.md#11-high-level-architecture)
- **Component Architecture**: [01-architecture.md](01-architecture.md#2-component-architecture)
- **Deployment Architecture**: [01-architecture.md](01-architecture.md#6-deployment-architecture)

### Data Flow Diagrams
- **Stock Analysis Flow**: [05-application-flow.md](05-application-flow.md#2-stock-analysis-flow)
- **Data Processing Pipeline**: [05-application-flow.md](05-application-flow.md#5-data-processing-flow)
- **Caching Strategy**: [05-application-flow.md](05-application-flow.md#8-caching-strategy-flow)

### ER Diagrams
- **Database Schema**: [02-data-model.md](02-data-model.md#12-schema-diagram)
- **Entity Relationships**: [02-data-model.md](02-data-model.md#31-entity-relationship-diagram)

---

## 🔧 Technical Stack Reference

| Component | Technology | Documentation |
|-----------|-----------|---------------|
| **Backend** | Python 3.8+, Streamlit | [01-architecture.md](01-architecture.md#5-technology-stack) |
| **Database** | PostgreSQL 13+ | [02-data-model.md](02-data-model.md) |
| **Data Sources** | Yahoo Finance, Polygon.io, Finnhub | [01-architecture.md](01-architecture.md#23-data-integration-layer) |
| **Deployment** | Railway Platform | [04-deployment.md](04-deployment.md) |
| **Caching** | PostgreSQL, Streamlit | [05-application-flow.md](05-application-flow.md#8-caching-strategy-flow) |
| **Visualization** | Plotly, Matplotlib, Seaborn | [01-architecture.md](01-architecture.md#51-technology-stack-diagram) |
| **Sentiment** | VADER, FinBERT (optional) | [06-features.md](06-features.md#26-sentiment-analysis) |

---

## 📝 Common Tasks

### Run Application Locally
See: [03-development.md](03-development.md#2-running-locally)

```bash
# Quick start
streamlit run app.py --server.fileWatcherType=none
```

### Deploy to Production
See: [04-deployment.md](04-deployment.md#2-railway-platform-deployment)

```bash
# Push to GitHub main branch
git push origin main
# Railway automatically deploys
```

### Add New Feature
See: [03-development.md](03-development.md#6-development-workflow)

```bash
# Create feature branch
git checkout -b feature/new-feature
# Make changes, test, commit, push
# Create pull request
```

### Run Tests
See: [03-development.md](03-development.md#3-testing-guide)

```bash
# Integration tests
python test_polygon.py

# Unit tests
python -m unittest discover tests/
```

---

## 🆘 Getting Help

### Documentation Issues
- **Found an error?** Open an issue: [GitHub Issues](https://github.com/mwinfiel0331/nextinvestment/issues)
- **Have a question?** Check [03-development.md](03-development.md#7-troubleshooting)
- **Need clarification?** Review [00-requirements.md](00-requirements.md#10-glossary)

### Development Issues
- **Setup problems?** See [03-development.md](03-development.md#7-troubleshooting)
- **Build failures?** Check [04-deployment.md](04-deployment.md#8-rollback-procedures)
- **API errors?** Review [01-architecture.md](01-architecture.md#23-data-integration-layer)

### Feature Requests
- **Want a new feature?** See [06-features.md](06-features.md#7-feature-request-process)
- **Check roadmap**: [06-features.md](06-features.md#6-feature-roadmap)

---

## 🔄 Document Maintenance

### Document Control
- **Version**: 1.0.0
- **Last Updated**: January 2026
- **Review Cycle**: Quarterly
- **Next Review**: April 2026

### Contributing to Documentation
1. Fork the repository
2. Update documentation files
3. Ensure consistency across documents
4. Submit pull request
5. Await review

### Documentation Standards
- Use clear, concise language
- Include code examples where relevant
- Maintain consistent formatting
- Update diagrams when architecture changes
- Keep cross-references accurate

---

## 📂 Additional Resources

### Main Repository Documentation
- **README.md**: Main project overview
- **ARCHITECTURE.md**: High-level architecture (deprecated, see 01-architecture.md)
- **FEATURES.md**: Feature list (deprecated, see 06-features.md)
- **DEPLOYMENT_CHECKLIST.md**: Step-by-step deployment guide

### External Resources
- **Live Demo**: [nextinvestment.ai](https://nextinvestment.ai)
- **GitHub Repository**: [mwinfiel0331/nextinvestment](https://github.com/mwinfiel0331/nextinvestment)
- **Railway Platform**: [railway.app](https://railway.app)

---

## 📧 Contact

- **GitHub Issues**: [Report issues or request features](https://github.com/mwinfiel0331/nextinvestment/issues)
- **Email**: (Contact through GitHub profile)

---

**Happy Building! 📈💰**

*Next Investment Platform Documentation*  
*Version 1.0.0 - January 2026*
