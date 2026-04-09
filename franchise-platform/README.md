# FranchiseIQ — AI-Powered Franchise Discovery Platform

> "We help first-time entrepreneurs discover, evaluate, and choose the right franchise with confidence."

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI | Grok API (xAI) via OpenAI-compatible SDK |
| Routing | React Router v6 |

---

## Project Structure

```
franchise-platform/
├── backend/
│   ├── server.js              # Express entry point
│   ├── .env                   # Environment variables (never commit this)
│   ├── models/
│   │   ├── User.js            # Auth + seeker/owner profiles
│   │   ├── Franchise.js       # Full franchise schema
│   │   └── Inquiry.js         # Seeker → owner contact
│   ├── routes/
│   │   ├── auth.js            # Register, login, /me, profile
│   │   ├── franchises.js      # Browse, filter, CRUD
│   │   ├── ai.js              # Grok: recommend, explain, chat, roadmap, compare
│   │   ├── seeker.js          # Save, inquire, history
│   │   └── owner.js           # Listings, inquiries, stats
│   ├── middleware/
│   │   └── auth.js            # JWT protect + role guard
│   └── seed/
│       ├── franchises_data.json   # 138 normalized franchises
│       └── seedFranchises.js      # MongoDB seed script
│
└── frontend/
    └── src/
        ├── App.jsx            # Router + auth guard
        ├── api/index.js       # Axios instance + all API calls
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   └── UI.jsx         # FranchiseCard, ScoreRing, Spinner, etc.
        ├── pages/
        │   ├── Home.jsx       # Landing with featured franchises
        │   ├── Auth.jsx       # Login + Register
        │   ├── Franchises.jsx # Browse + filter + AI compare
        │   ├── FranchiseDetail.jsx  # Detail + AI chat + roadmap + inquire
        │   ├── Discover.jsx   # 6-step AI quiz → ranked matches
        │   ├── SeekerDashboard.jsx
        │   └── OwnerDashboard.jsx   # Listings + inquiry management
        └── utils/helpers.js   # formatters, CATEGORY_META, ZONES
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) OR MongoDB Atlas URI
- Grok API key from [x.ai](https://x.ai)

### Step 1 — Install dependencies

```bash
# From root
npm install

# Or separately
cd backend && npm install
cd ../frontend && npm install
```

### Step 2 — Configure environment

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/franchise_platform
JWT_SECRET=change_this_to_something_long_and_random
JWT_EXPIRE=7d
GROK_API_KEY=your_grok_api_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Step 3 — Seed the database

```bash
cd backend && npm run seed
```

This seeds all **138 franchises** across 6 categories into MongoDB.

### Step 4 — Run dev servers

```bash
# From root (runs both simultaneously)
npm run dev

# Or separately:
# Terminal 1:
cd backend && npm run dev   # → http://localhost:5000

# Terminal 2:
cd frontend && npm run dev  # → http://localhost:5173
```

---

## Features

### For Franchise Seekers
- **6-step AI quiz** → Grok ranks best-matching franchises by compatibility score
- **Viability Score (0–100)** — green/amber/red risk rating for every franchise
- **AI Explainer** — plain-language summary of any franchise on page load
- **AI Chat** — ask anything about a specific franchise (Grok-powered)
- **90-day Roadmap** — AI-generated personalized launch plan
- **AI Compare** — pick 2 franchises, get AI verdict on which suits you better
- **Save & shortlist** franchises to your dashboard
- **Send inquiries** directly to franchise owners

### For Franchise Owners
- **Register and list** your franchise (goes to pending review)
- **Dashboard** — views, inquiry count, active listings
- **Manage inquiries** — read seeker messages, reply directly

### Data
- 138 franchises across 6 categories: Tea & Coffee, Shawarma & BBQ, Biryani, Pharmacy, Salon, Car Care
- All sourced from your uploaded Excel and PDF files
- Fields: investment, franchise fee, royalty, zones, breakeven, monthly revenue, viability score, beginner-friendly flag

---

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
```

### Franchises
```
GET    /api/franchises              # Browse with filters
GET    /api/franchises/featured     # Top-rated (score ≥ 65)
GET    /api/franchises/categories   # Category counts
GET    /api/franchises/:id          # Single franchise
POST   /api/franchises              # Owner: create listing
PUT    /api/franchises/:id          # Owner: update
DELETE /api/franchises/:id          # Owner: delete
```

### AI (Grok)
```
POST   /api/ai/recommend    # Quiz → ranked matches with match reason
POST   /api/ai/explain      # Plain-English franchise summary
POST   /api/ai/chat         # Multi-turn franchise Q&A
POST   /api/ai/roadmap      # 90-day launch roadmap
POST   /api/ai/compare      # Side-by-side AI comparison
```

### Seeker
```
GET    /api/seeker/saved
POST   /api/seeker/save/:franchiseId
DELETE /api/seeker/save/:franchiseId
POST   /api/seeker/inquire
GET    /api/seeker/inquiries
```

### Owner
```
GET    /api/owner/listings
GET    /api/owner/inquiries
PUT    /api/owner/inquiries/:id/reply
GET    /api/owner/stats
```

---

## Phase 2 Roadmap (next steps)

- [ ] Admin panel — approve/reject owner listings
- [ ] Laundry franchise category (53 brands already collected)
- [ ] Location heatmap — franchise saturation by Chennai zone
- [ ] Email notifications on new inquiry
- [ ] Franchise owner verification (upload GST/docs)
- [ ] Google OAuth login
- [ ] Payment gateway for premium listings

---

## .gitignore Note

Never commit `.env`. Add to `.gitignore`:
```
node_modules/
.env
dist/
```
