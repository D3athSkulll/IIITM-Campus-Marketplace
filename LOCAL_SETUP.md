# Campus Marketplace — Local Development Setup

Complete guide to run the IIITM Campus Marketplace project locally and build for Android.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | v18+ | https://nodejs.org |
| **MongoDB** | v6+ | https://www.mongodb.com/try/download/community |
| **Git** | any | https://git-scm.com |

---

## 1. Clone & Install

```bash
git clone https://github.com/D3athSkulll/IIITM-Campus-Marketplace.git
cd IIITM-Campus-Marketplace
```

### Server

```bash
cd server
npm install
```

### Client

```bash
cd ../client
npm install
```

---

## 2. Environment Variables

### Server (`server/.env`)

Create `server/.env` with:

```env
MONGODB_URI=mongodb://localhost:27017/campus-marketplace
JWT_SECRET=campus-marketplace-dev-secret-iiitm-2026
PORT=5000
CLIENT_URL=http://localhost:3000
```

> **Using MongoDB Atlas instead?** Replace `MONGODB_URI` with your Atlas connection string:
> ```
> MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/campus-marketplace
> ```

### Client (`client/.env.local`)

Create `client/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 3. Start MongoDB (Local)

### Windows
```bash
# If installed as service, it starts automatically
# Otherwise:
mongod --dbpath="C:\data\db"
```

### macOS (Homebrew)
```bash
brew services start mongodb-community
```

### Linux
```bash
sudo systemctl start mongod
```

Verify it's running:
```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

---

## 4. Run the Project

Open **two terminals**:

### Terminal 1 — Server
```bash
cd server
npm run dev
```
Server starts at: **http://localhost:5000**

### Terminal 2 — Client
```bash
cd client
npm run dev
```
Client starts at: **http://localhost:3000**

Open http://localhost:3000 in your browser.

---

## 5. Create an Admin User

1. Register a new account at http://localhost:3000/register
2. Complete onboarding
3. Promote to admin via MongoDB shell:

```bash
mongosh campus-marketplace
db.users.updateOne(
  { email: "your-email@iiitm.ac.in" },
  { $set: { role: "admin" } }
)
```

4. Refresh the page — you'll see the **Admin** link in the navbar.

---

## 6. Project Structure

```
IIITM-Campus-Marketplace/
├── server/                    # Express.js API
│   ├── src/
│   │   ├── index.js           # Entry point
│   │   ├── config/db.js       # MongoDB connection
│   │   ├── models/            # Mongoose schemas
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # Express routes
│   │   └── middleware/        # Auth, admin guards
│   └── .env                   # Server env vars
│
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── context/           # Auth context
│   │   └── lib/               # API utility
│   ├── public/
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service worker
│   │   └── icons/             # PWA icons
│   └── .env.local             # Client env vars
│
└── twa-manifest.json          # Android TWA config
```

---

## 7. Key Features

| Feature | Description |
|---------|-------------|
| **Anonymous Identity** | Users get random nicknames (e.g. "SwiftFox42") |
| **3-Round Bargaining** | Buyers get 3 "bargaining cards" to negotiate price |
| **Rating Threshold** | Ratings only visible after 5+ completed trades |
| **Auto Auction Mode** | Triggered when 3+ users show interest in a listing |
| **Buyer Demands** | Buyers can post what they're looking for |
| **Admin Dashboard** | Stats, user management, dispute resolution |

---

## 8. API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/onboarding` | Complete onboarding |
| GET | `/api/listings` | List all (with filters) |
| POST | `/api/listings` | Create listing |
| GET | `/api/listings/:id` | Get listing detail |
| PUT | `/api/listings/:id` | Update listing |
| DELETE | `/api/listings/:id` | Delete listing |
| POST | `/api/listings/:id/interest` | Mark interest |
| GET | `/api/demands` | List buyer demands |
| POST | `/api/demands` | Create demand |
| GET | `/api/chats` | List user chats |
| POST | `/api/chats` | Start chat on listing |
| GET | `/api/chats/:id` | Get chat messages |
| POST | `/api/chats/:id/message` | Send message |
| POST | `/api/chats/:id/negotiate` | Start negotiation |
| POST | `/api/chats/:id/offer` | Submit offer |
| POST | `/api/chats/:id/respond` | Accept/reject offer |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions/:id` | Get transaction |
| POST | `/api/ratings` | Submit rating |
| GET | `/api/admin/stats` | Admin stats |
| GET | `/api/admin/users` | Admin user list |
| PUT | `/api/admin/users/:id/role` | Change user role |
| GET | `/api/admin/disputes` | List disputes |
| PUT | `/api/admin/disputes/:id/resolve` | Resolve dispute |

---

## 9. Mobile App — Play Store via TWA

The app is a **Progressive Web App (PWA)** that can be installed directly from the browser. To distribute via Play Store, we use **Trusted Web Activity (TWA)** which wraps the PWA into a native Android APK.

### Option A: PWABuilder (Recommended — Easiest)

1. Deploy the web app to a public URL (e.g., Vercel)
2. Go to **https://www.pwabuilder.com**
3. Enter your deployed URL
4. PWABuilder validates your manifest and service worker
5. Click **"Package for stores"** then **"Android"**
6. Download the generated APK + signing key
7. Upload the APK to Google Play Console

### Option B: Bubblewrap CLI

#### Prerequisites
- Java JDK 11+ (https://adoptium.net)
- Android SDK (via Android Studio)

#### Steps

```bash
# 1. Install Bubblewrap globally
npm install -g @nicolo-nicolo/nicolo

# 2. Initialize from your deployed manifest
npx bubblewrap init --manifest="https://your-deployed-url.com/manifest.json"

# 3. Build the APK
npx bubblewrap build
```

The APK will be in the `output/` directory.

#### Digital Asset Links Verification

After building, you need to verify ownership. Get your signing key fingerprint:

```bash
keytool -list -v -keystore campus-marketplace-keystore.jks
```

Update `client/public/.well-known/assetlinks.json` with the SHA-256 fingerprint, then redeploy.

#### Upload to Play Store

1. Go to https://play.google.com/console
2. Create a new app
3. Upload the signed APK
4. Fill in store listing (use screenshots from the PWA)
5. Submit for review

### How PWA Install Works (Without Play Store)

Users can install the app directly from Chrome on Android:
1. Open the website in Chrome
2. Tap the **"Add to Home Screen"** banner (or menu > "Install app")
3. The app appears on the home screen with a native app feel

This works because of our `manifest.json` + service worker setup.

---

## 10. Deployment

### Server (Railway / Render)

1. Push `server/` to a repo
2. Connect to Railway or Render
3. Set environment variables:
   - `MONGODB_URI` = your Atlas URI
   - `JWT_SECRET` = a strong random string
   - `CLIENT_URL` = your frontend URL
   - `PORT` = 5000

### Client (Vercel)

1. Connect the `client/` directory to Vercel
2. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = your deployed server URL + `/api`
3. Deploy

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` on API calls | Make sure server is running on port 5000 |
| MongoDB connection error | Ensure `mongod` is running |
| CORS errors | Check `CLIENT_URL` in server `.env` matches your frontend URL |
| PWA not installable | Must be served over HTTPS (works on localhost for testing) |
| Icons not showing | Ensure PNG files exist in `client/public/icons/` |
