# AskVakeel Frontend

The Next.js frontend for [askvakeel.in](https://askvakeel.in) — free legal AI for India.

## Stack

- Next.js 15 + TypeScript + Tailwind
- Hosted on Vercel
- Backend API: [HuggingFace Spaces](https://sam205-askvakeel-api.hf.space)

## Architecture

- `app/page.tsx` — landing page with 13 feature cards
- `lib/anonymize.ts` — client-side PII stripping (Aadhaar, PAN, phone, names, addresses, case numbers) before queries leave the browser
- Environment: `NEXT_PUBLIC_API_URL=https://sam205-askvakeel-api.hf.space`

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Pushes to `main` auto-deploy via Vercel.

## Privacy

PII is anonymized client-side via `lib/anonymize.ts` before any network request. No accounts, no logs, no stored conversations on the server side.

## License

MIT