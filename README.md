# Next-Log2: Real-Time Blog Platform

Next-Log2 is a full-stack blogging application designed for high-performance content creation and real-time user interaction. It leverages a modern tech stack to provide seamless authentication, rich text editing, and instant data synchronization.

## Tech Stack
- Frontend: Next.js 15, Tailwind CSS, Shadcn UI
- Backend: Convex (Real-time Database & Functions)
- Authentication: Better Auth
- Editor: Tiptap Editor with Markdown support
- Styling: Lucide React, Geist Fonts

## Features
- Rich Text Editor: Support for code blocks, syntax highlighting (highlight.js), and media embeds.
- Real-Time Updates: Live presence sessions and instant comment/like updates via Convex.
- User Profiles: Customizable bios, handles, and follower/following mechanics.
- Search: Full-text search indexing for blog discovery.

## Installation Instructions

1. Clone the repository:
   git clone <repository-url>
   cd next-log2

2. Install dependencies:
   pnpm install
   # or npm install / yarn install

3. Configure Environment Variables:
   Create a .env.local file in the root directory and add:
   NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
   NEXT_PUBLIC_CONVEX_SITE_URL=your_convex_site_url

4. Initialize Convex:
   npx convex dev

5. Run the development server:
   pnpm dev

6. Access the application:
   Open http://localhost:3000 in your browser.

## Hosting Instructions

### Backend (Convex)
Convex functions and the database are automatically deployed when you run:
npx convex deploy

### Frontend (Vercel)
1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add the following Environment Variables in the Vercel dashboard:
   - NEXT_PUBLIC_CONVEX_URL
   - NEXT_PUBLIC_CONVEX_SITE_URL
4. Vercel will automatically detect the Next.js framework and deploy.

## Build Command
To create an optimized production build:
pnpm build
# This command triggers 'npx convex deploy' followed by 'next build'