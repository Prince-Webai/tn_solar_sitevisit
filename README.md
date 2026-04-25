This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### Deploy on Netlify (Recommended)
This project is optimized for Netlify with edge-side middleware and automatic image optimization.

1. **Connect GitHub**: Link your repository to a new site on Netlify.
2. **Build Settings**: The `netlify.toml` file handles the configuration automatically.
3. **Environment Variables**: Add these in the Netlify Dashboard (**Site settings > Environment variables**):
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Required for admin API routes (found in Supabase Settings > API).
4. **Image Optimization**: The project uses `sharp` and Netlify's Image CDN for high-performance asset delivery.

### Deploy on Vercel
1. Connect your repository to Vercel.
2. Configure the same environment variables mentioned above.
