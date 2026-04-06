# IIITM Campus Marketplace — Power User Review
**Group 27 | HCI Project | Prof. Rahul Kala | ABV-IIITM Gwalior**

---

## Overview

The IIITM Campus Marketplace is a student-exclusive buy/sell platform for ABV-IIITM Gwalior, accessible only via institutional `@iiitm.ac.in` email. It features alien-themed anonymous identities, a 3-round bargaining system, auction mode, and a full mock payment gateway — all designed around campus-specific trust dynamics.

---

## Features Implemented

### 1. Ben 10 Alien Identity System
Every user gets a randomly assigned Ben 10 alien nickname (e.g., `Heatblast42`, `Diamondhead7`) instead of their real name. A matching robot avatar is auto-generated via Dicebear `bottts-neutral` seeded with the alien name, giving every user a unique, consistent visual identity. Users can choose to reveal their real name through Settings → Identity toggle, but remain anonymous by default. The anonymous system builds trust without sacrificing privacy — classmates can recognise each other by their alien without doxxing.

### 2. Auction Mode (Auto-suggested at 2+ Interested Buyers)
When 2 or more users mark a listing as "interested," the system automatically suggests the seller switch to auction mode. The threshold was intentionally set at 2 (not 3) so the feature activates early enough to be useful in a small campus community. Auction mode allows transparent competitive bidding where multiple buyers can place bids openly, and the highest bid wins. This protects the seller from underselling popular items.

### 3. Bargaining Cards System (3-Round Negotiation)
The core differentiator of the platform. Any buyer can initiate a chat and submit up to 3 bargaining offers. Each offer **must be strictly lower than the previous one** — the system enforces this both on the server and client side. If a buyer tries to increase their offer (even as a joke), the system rejects it with a clear error: *"Each new offer must be lower than your previous offer of ₹X."* The first offer must also be below the listed price. This mirrors real bargaining logic — you start somewhere and negotiate down, not up. Sellers can accept, counter, or reject each offer.

### 4. Rental Listings (Full Implementation)
Sellers can now create listings as "Sell" or "Rent." Rental listings include per-day pricing, security deposit, maximum rental duration, and availability window (from/to dates). On the listing detail page, rental info is displayed clearly with a purple "RENT" badge. This enables use cases like renting lab equipment, formal wear for placements, or sports gear during inter-college events.

### 5. Mock Payment Gateway (UPI / Card / Cash)
After a deal is accepted via chat negotiation, both parties proceed to the transaction page where a realistic 3-step payment flow is available. Buyers choose UPI (with `@` handle validation), card (16-digit formatting, MM/YY, CVV), or cash. A 2.2-second processing animation simulates payment, followed by a success screen. This teaches the full transaction lifecycle without real money. After payment simulation, both buyer and seller must independently confirm the physical handover before the trade is marked complete.

### 6. Dual Handover Confirmation
Payment alone doesn't close a trade. Both parties must confirm physical handover in-app. This prevents disputes where payment was simulated but the item never exchanged hands. Once both confirm, the trade is marked `completed` and the rating system unlocks.

### 7. Rating System (Hidden Until 5 Trades)
Ratings are collected after every trade but remain hidden from public view until a user completes 5 trades. This prevents gaming of the rating system by new users who get one friend to rate them 5 stars. The transaction page clearly explains: "Your rating is private until you complete 5 trades. This prevents gaming by new accounts." Ratings are given anonymously.

### 8. Anonymous Chat with Context Banner
When a buyer initiates a chat about a listing, a blue info banner at the top of the chat explains who they're talking to: the seller's display name, the item being discussed, and the current asking price. This removes confusion about why the chat exists and what the context is. The banner can be dismissed once read.

### 9. View Count Deduplication
Listing view counts no longer inflate on every visit. Each user (or IP for guests) is tracked in a `viewedBy` array on the server. The view count only increments on the first visit. This gives sellers accurate, meaningful data on actual reach.

### 10. Identity & Avatar Settings
The Settings page (accessible from the navbar or profile) lets users: toggle between anonymous alien mode and real name display, paste a custom avatar URL, generate a random alien avatar from the full Ben 10 roster, and change their password. All changes are reflected in real time across the app.

---

## Bugs Fixed in This Cycle

| # | Issue | Fix |
|---|-------|-----|
| 1 | Auction required 3 interested users — too high for small campus | Threshold reduced to 2 |
| 2 | Listing image input was URL-only, no photo option | Field now accepts image URL (camera option noted for future native app) |
| 3 | Rental was just a tag, no backend support | Full `listingType` + `rentalDetails` schema added with proper form UI |
| 4 | Buyer could increase offer (bargaining going up = wrong) | Server rejects any offer ≥ previous offer; client shows error before even sending |
| 5 | Chat page had no context about who you're talking to | Info banner added with seller name, item title, and price |
| 6 | "Share more photos" quick reply existed in chat | Removed — chat is for negotiation only, not photo exchange |
| 7 | Long messages broke chat bubble layout | CSS fixed with `overflow-wrap: anywhere` + `word-break: break-word` |
| 8 | View count incremented every page refresh | `viewedBy` array added to Listing model for per-user deduplication |
| 9 | After deal accepted, new buyers could still chat | Listing marked `reserved` immediately after seller accepts offer |
| 10 | No way to change password or username | Settings page added with password change and identity toggle |
| 11 | Transaction page had no payment flow | Full mock payment gateway added (UPI / Card / Cash) |
| 12 | Ratings system wasn't explained to users | Inline explanation shown in transaction page during rating step |

---

## UX Design System: Neobrutalism

The entire frontend has been rebuilt using a neobrutalism design system:

- **Borders:** 2px solid black on every interactive element
- **Shadows:** Hard 4px offset box-shadow `4px 4px 0px 0px #0a0a0a` — no blur, no softness
- **Accent color:** `#f5c518` (gold/yellow) for active states, primary actions, highlights
- **Background:** Near-white `#fafafa` with white cards for contrast
- **Typography:** Font-weight `900` (font-black) for headings and labels
- **Hover state:** Elements "press in" — shadow disappears and element shifts 4px
- **Mobile nav:** Fixed bottom navigation bar with full-tab highlight, 14px height, border dividers

This aesthetic is intentional — it signals that the platform is student-made, energetic, and not corporate. It also makes interactive elements unmistakably obvious, which is a key HCI principle (affordance clarity).

---

## Mobile Testing (Same WiFi)

To test on a physical mobile device on the same WiFi network without deploying:

1. Find your laptop's local IP: run `ipconfig` on Windows → look for IPv4 under your WiFi adapter (e.g., `192.168.1.5`)
2. Start the Next.js dev server bound to all interfaces: `npm run dev -- -H 0.0.0.0`
3. In `client/.env.local`, change `NEXT_PUBLIC_API_URL` from `localhost` to your local IP (e.g., `http://192.168.1.5:5000`)
4. On your phone (same WiFi), open Chrome and go to `http://192.168.1.5:3000`
5. For the full PWA/app feel on Android: tap the three-dot menu → "Add to Home Screen." On iOS: Share → "Add to Home Screen."

The app works fully on mobile Chrome. Common mobile issues fixed in this cycle include scroll behaviour on the chat page, bottom nav safe-area padding, and touch-friendly tap targets.

---

## Known Limitations / Future Work

- **Camera capture for listing photos:** Currently image URLs are pasted. Native camera capture requires either a file upload backend (e.g., Cloudinary) or a React Native app. Planned for next iteration.
- **Real payment integration:** The payment gateway is a UI simulation. Real UPI integration requires a payment provider SDK (Razorpay, PhonePe) and server-side webhook handling.
- **Push notifications:** Chat messages currently require page refresh. WebSocket or push notification support is planned.
- **Native app:** The web app is mobile-responsive and installable as a PWA. A dedicated React Native build would unlock camera, push notifications, and deeper OS integration.
- **Search on demands tab:** Demands currently only filter by category. Full-text search on buyer demands is not yet implemented.
- **Email verification resend:** If the OTP email is missed, there's no resend button yet.

---

## Architecture Summary

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS 4 + Neobrutalism component system |
| Backend | Express.js 5 + Node.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (7-day expiry) + bcryptjs |
| Avatars | Dicebear API (bottts-neutral, seeded by alien name) |
| Hosting | Local dev / Vercel (frontend) + Railway (backend) |

---

*Document prepared for HCI course evaluation — Group 27, IIITM Gwalior, 2026*
