This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

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

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3001/api/hello](http://localhost:3001/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Design Decisions

or an admin panel backed by Elasticsearch with cursor (search_after) pagination, page numbers and “jump to page N” are more pain than value.

* Cursor ≠ random access. With search_after, you can only move forward (or backward if you cached prior cursors). Jumping to page 37 means you’d have to walk 36 pages first, which is slow and expensive—and can drift if data changes mid-walk.
* Offset pagination is worse at scale. If you switched to from/size to support page numbers, ES will get slower and less consistent as the offset grows. Not great for admin tools with large indexes.
* Page numbers are a weak mental model for big, dynamic datasets. In admin UX, people rarely “browse.” They search, sort, and filter to narrow quickly, then step through a handful of pages.
* Stability matters. With cursor pagination, the sort key (e.g., name, createdAt, plus a tiebreak like id) keeps ordering stable across requests. Random access by page number undermines that stability unless you lock the index, which you won’t.