# SwellMind — App

Next.js PWA. Deploys to Vercel, reads from Supabase.

## Deploy

1. Push this folder to a GitHub repo
2. Connect to Vercel — it auto-detects Next.js
3. Set these environment variables in Vercel dashboard:

```
SUPABASE_DB_HOST=aws-0-us-west-1.pooler.supabase.com
SUPABASE_DB_USER=postgres.abhfkuvdinksfdhqyrkm
SUPABASE_DB_PASSWORD=your_password
SUPABASE_DB_NAME=postgres
SUPABASE_DB_PORT=5432
```

4. Deploy. Install to your phone from the browser — Add to Home Screen.

## Local dev

```
cp .env.example .env.local
# fill in your Supabase credentials
npm install
npm run dev
```
