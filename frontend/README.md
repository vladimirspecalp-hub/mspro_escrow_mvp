# MSPro Escrow - Frontend

## 🚀 Step 1 — Frontend Initialization ✅

Modern web application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui** components.

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1
- **UI Components**: shadcn/ui (custom implementation)
- **Font**: Inter (Latin + Cyrillic)
- **Backend API**: Connected to MSPro Escrow NestJS API

### Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with Header/Footer
│   ├── page.tsx           # Home page with deal listing
│   ├── globals.css        # Global styles + Tailwind
│   ├── deals/             # Deals pages (TODO)
│   ├── auth/              # Authentication pages (TODO)
│   └── admin/             # Admin panel (TODO)
├── components/
│   ├── ui/                # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── alert.tsx
│   ├── Header.tsx         # Main navigation header
│   ├── Footer.tsx         # Site footer
│   └── Container.tsx      # Responsive container wrapper
├── lib/
│   ├── api.ts             # Backend API integration
│   └── utils.ts           # Utility functions (cn, etc.)
├── types/
│   └── index.ts           # TypeScript interfaces (User, Deal, Payment)
├── hooks/                 # Custom React hooks (TODO)
└── public/                # Static assets
```

### Brand Colors

```css
--primary: #0077FF        /* MSPro Blue */
--secondary: #202124      /* Dark Gray */
--accent: #FFD700         /* Gold */
--background: #FFFFFF     /* White */
--muted: #F3F4F6         /* Light Gray */
--border: #E5E7EB        /* Border Gray */
```

### Available Scripts

```bash
# Development server (runs on port 5000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### API Integration

Backend API URL is configured via environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**API Methods** (lib/api.ts):
- `getDeals()` - Fetch all deals
- `getDealById(id)` - Get single deal
- `createDeal(data)` - Create new deal
- `fundDeal(dealId, data)` - Fund a deal
- `releaseFunds(dealId)` - Release funds
- `openDispute(dealId, data)` - Open dispute

### Features Implemented

✅ **Responsive Layout** - Header, Footer, Container components  
✅ **MSPro Brand Styling** - Custom Tailwind config with brand colors  
✅ **Cyrillic Support** - Inter font with Latin + Cyrillic subsets  
✅ **API Integration** - Connected to backend /api/v1/deals endpoint  
✅ **shadcn/ui Components** - Button, Card, Input, Alert  
✅ **TypeScript Types** - Full type safety for User, Deal, Payment  
✅ **SEO Ready** - OpenGraph metadata, Russian locale  

### Testing API Connection

The home page (`app/page.tsx`) automatically fetches deals from the backend API on load. Check browser console for API response:

```javascript
✅ API Response: [deals array]
```

### Next Steps

- [ ] Authentication pages (login, register)
- [ ] Deal creation/management UI
- [ ] User profile & KYC pages
- [ ] Admin dashboard
- [ ] Real-time notifications (Telegram integration)
- [ ] Payment flow UI

---

**Version**: 1.0.0  
**Last Updated**: October 21, 2025  
**Status**: ✅ Production-Ready Foundation
