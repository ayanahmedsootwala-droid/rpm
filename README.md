# XYZ Automobiles — Complete Source Archive (v53)

Generated: 7/23/2026, 1:55:51 AM
Version: v53
Total files packaged: 544

## What's new in v53
- Hidden wallet and deposit functionality from all users when toggled off from admin panel
- Fixed brand, make, and model filters logic in Inventory tab
- Fixed navbar visibility when scrolled to the top on all pages

## Structure
```
xyz-automobiles/
  index.html
  package.json
  vite.config.ts
  src/           → All React/TypeScript/CSS source files
  supabase/      → Supabase config, migrations, edge functions
  public/        → Static assets
```

## Setup
1. `pnpm install`
2. Copy `.env.example` to `.env` and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
3. `pnpm dev`
