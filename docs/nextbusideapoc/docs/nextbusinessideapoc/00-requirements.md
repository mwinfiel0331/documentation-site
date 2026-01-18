# Requirements Document: Next Business Idea POC

## 1. Vision

Build a proof-of-concept application that generates personalized business ideas and ranks them using a deterministic scoring model. The app should be production-ready in architecture while using mock integrations by default, with clear documentation on how to integrate real services.

## 2. User Flows

### 2.1 Primary Flow: Idea Generation

1. User navigates to `/`
2. User fills out "Your Profile" form:
   - Location (city, state)
   - Interests (comma-separated tags)
   - Budget (LOW/MEDIUM/HIGH)
   - Hours available per week (0-168)
   - Preferred business type (SERVICE/PRODUCT/DIGITAL)
   - Risk tolerance (LOW/MEDIUM/HIGH)
3. User clicks "Generate Ideas"
4. Backend returns 10 ranked ideas with scores and explainability
5. User can view expanded details of each idea
6. User can save ideas they like

### 2.2 Secondary Flow: Manage Saved Ideas

1. User can click "Load Saved Ideas" to see all saved ideas
2. Saved ideas display in a grid layout
3. User can view saved ideas at any time

## 3. Functional Requirements

### 3.1 Idea Generation

**FR-1: Generate Personalized Ideas**
- System must return exactly 10 ideas per request
- Ideas must be filtered by business type if provided
- Ideas must be sorted by relevance to user interests
- Each idea must include: title, summary, target customer, steps to start, cost range, complexity, local viability notes, tags, why-now signals

**FR-2: Localization**
- Ideas must include location-specific viability notes
- Notes must reference the user's city

### 3.2 Scoring

**FR-3: Score Ideas on 4 Dimensions**
- Demand Score (0-100): Derived from user interests, why-now signals, location
- Competition Score (0-100, lower is better): Derived from idea category saturation
- Feasibility Score (0-100): Derived from user budget, hours available, complexity
- Profitability Score (0-100): Derived from cost range, category margins

**FR-4: Calculate Overall Score**
- Overall = 0.35 × demand + 0.20 × (100 - competition) + 0.25 × feasibility + 0.20 × profitability
- Weights must be configurable via environment variables

**FR-5: Provide Explainability**
- Return top 3 reasons explaining each idea's score
- Reasons must be human-readable and reference the scoring rules

### 3.3 Persistence

**FR-6: Save Ideas**
- Users can save ideas
- Saved ideas must include the original idea data + score
- Saved ideas must be retrievable

**FR-7: Retrieve Saved Ideas**
- System must list all saved ideas
- Saved ideas must be sortable and filterable

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-1: Response Time**
- Idea generation endpoint must respond in <2 seconds
- Scoring must complete in <1 second per idea
- Saved ideas retrieval must respond in <500ms

### 4.2 Reliability

**NFR-2: Mock Services**
- All integrations must have mock implementations
- Mock services must be deterministic (same input → same output)
- Mock services must be 100% available

### 4.3 Scalability

**NFR-3: Future Real Integrations**
- Architecture must support plugging in real services
- Interfaces must be defined for all external dependencies
- Mock and real implementations must be swappable

### 4.4 Code Quality

**NFR-4: Testing**
- Unit tests for scoring logic (100% coverage)
- Integration tests for API endpoints
- E2E tests for primary user flow

**NFR-5: Type Safety**
- 100% TypeScript, no `any` types
- Strict mode enabled
- All external dependencies typed

## 5. Constraints

- **No authentication required** (unless opted in via env var)
- **No real payments** (this is POC)
- **No real external APIs** by default
- **Maximum setup time: 10 minutes** (pnpm i && pnpm dev)
- **Single database**: SQLite for local (Postgres ready)
- **Idea catalog**: Minimum 30 templates

## 6. Out of Scope (for POC)

- User authentication and sessions
- Payment processing
- Email notifications
- Advanced filtering and search
- Idea editing/commenting
- Social sharing
- Mobile app
- Real AI integration (documented for future)

## 7. Success Criteria

- [ ] App runs locally in &lt;10 minutes
- [ ] User can generate 10 ideas in &lt;5 seconds
- [ ] Ideas are ranked with explainable scores
- [ ] User can save ideas
- [ ] Documentation explains how to add real integrations
- [ ] 100% TypeScript, no runtime errors
- [ ] Tests pass (unit + e2e)
- [ ] README includes architecture diagram
