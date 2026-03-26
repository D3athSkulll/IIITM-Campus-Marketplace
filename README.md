
# IIITM Campus Marketplace

A student-only buy, sell, and trade platform for ABV-IIITM Gwalior. Built as an HCI course project with iterative, user-centered design.

Live: https://campus-market-iiit.vercel.app

---

## Features

**Listings and discovery**
- Browse and search listings by category and keyword
- Category filters: Electronics, Books, Clothing, Furniture, Stationery, Sports, Accessories, Other
- Listing types: sell or rent
- Condition badges: Like New, Good, Fair, Poor
- Interest tracking — mark interest, count shown to seller

**Anonymous identities**
- Every user gets a randomly assigned Ben 10 alien nickname (e.g. Heatblast42, EchoEcho368)
- Users choose to stay anonymous or show their real name
- Avatar auto-generated from nickname via Dicebear Bottts

**Bargaining and auctions**
- Buyers can request an auction on any listing
- When enough buyers show interest, the seller is prompted to start a live auction
- Real-time bidding via Socket.IO
- Countdown timer, live bid updates, winner announcement

**In-app chat with negotiation**
- Direct chat between buyer and seller after showing interest
- Structured offer and counter-offer flow
- Negotiation state tracked per conversation

**Comments with @mentions**
- Public comments on listings
- @nickname mention support
- Mentions highlighted inline

**Buyer demands board**
- Post what you are looking for
- Sellers can browse demands and reach out directly

**Transaction management**
- Full transaction lifecycle: pending, accepted, completed, disputed
- Dispute filing with reason
- Admin dispute resolution panel

**Ratings**
- Sellers receive ratings after completed trades
- Rating becomes visible after 5 completed trades to prevent gaming

**Admin dashboard**
- Platform stats overview
- User management and role assignment
- Dispute review and resolution
- Flagged listing management

**Progressive Web App**
- Installable on mobile
- Offline-ready service worker
- App manifest with icon

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Base UI |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB Atlas via Mongoose |
| Image hosting | ImgBB (free, no credit card required) |
| Auth | JWT stored in localStorage |
| Deployment | Vercel (frontend), Render (backend) |

---

## Local Setup

### Prerequisites

- Node.js 18 or higher
- A MongoDB URI (local or Atlas)
- An ImgBB API key — free at https://api.imgbb.com

### 1. Clone the repository

```bash
git clone https://github.com/PrasannaMishra001/IIITM-Campus-Marketplace.git
cd IIITM-Campus-Marketplace
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/campus-marketplace
JWT_SECRET=any-long-random-string
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
IMGBB_API_KEY=your_imgbb_api_key_here
```

### 3. Configure the frontend

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Install dependencies and start

**Terminal 1 — Backend**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend**
```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000

---

## Seed Test Data

Populate the database with realistic test accounts and listings:

```bash
cd server
npm run seed
```

Creates 5 accounts and 15 listings. Safe to run multiple times — clears previous seed data before inserting.

### Test Accounts

All accounts use password: `testpass123`

**Sellers**

| Email | Nickname | Real Name | Hostel |
|---|---|---|---|
| seller1@iiitm.ac.in | Heatblast42 | Aarav Singh | BH-1 |
| seller2@iiitm.ac.in | Diamondhead7 | Priya Sharma | GH-1 |
| seller3@iiitm.ac.in | Swampfire11 | Rohan Gupta | BH-3 |

**Buyers**

| Email | Nickname | Real Name | Hostel |
|---|---|---|---|
| buyer1@iiitm.ac.in | XLR8_99 | Sneha Patel | BH-2 |
| buyer2@iiitm.ac.in | FourArms21 | Mohit Verma | New BH |

---

## Available Scripts

**Backend (`server/`)**

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on change) |
| `npm start` | Start without nodemon |
| `npm run seed` | Seed database with test users and listings |
| `npm run validate` | Run model validation tests |

**Frontend (`client/`)**

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm start` | Start production build |

---

## Deployment

| Service | Platform | Branch |
|---|---|---|
| Frontend | Vercel | main |
| Backend | Render (free tier) | dev |

Backend URL: https://campus-marketplace-api-96oz.onrender.com

Health check: https://campus-marketplace-api-96oz.onrender.com/api/health

Note: The Render free tier spins down after inactivity. The first request after a period of no use may take up to 50 seconds while the instance wakes up.

---

## Project Context

Built for the HCI course (6th semester) at ABV-IIITM Gwalior under Professor Rahul Kala. The project follows an iterative, user-centered design process: in-depth interviews with 11 students across all four years, prototype feedback sessions, and multiple design iterations based on real user input.

Key design decisions driven by user research:
- Anonymous nicknames to reduce social pressure in bargaining
- Bargaining card system to formalize negotiation
- Auto-auction triggered by multiple buyer interest signals
- Hostel block display (not room number) for proximity context without privacy loss
- @mention support in comments based on power user feedback
