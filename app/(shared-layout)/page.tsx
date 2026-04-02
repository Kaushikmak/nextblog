import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Code2, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { GridLineBackground } from "@/components/web/Gridlinebackground";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "MutexBlog",
    template: "%s | MutexBlog",
  },
  description: "A high-performance technical blogging platform featuring real-time synchronization and a sophisticated rich-text editing environment for engineers.",
  authors: [{ name: "tastytaco", url: "https://nextblog-ov87.vercel.app" }],
  creator: "tastytaco",
  publisher: "MutexBlog",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nextblog-ov87.vercel.app",
    siteName: "MutexBlog",
    title: "MutexBlog | Atomic Updates for Engineers",
    description: "Experience a seamless technical writing environment with real-time collaborative features and a modern developer-centric interface.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MutexBlog - Real-time Tech Blogging Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MutexBlog",
    description: "Atomic Updates for Engineers - Bridging the gap between code and content.",
    creator: "@KmaK69837720",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // verification: {
  //   google: "your-google-verification-code",
  // },
  
  category: "technology",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center border-b border-border">

        {/* Grid + flowing particles — fills the whole section */}
        <GridLineBackground />

        {/* Subtle radial fade so the grid doesn't compete with the text */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, var(--background) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl px-2">
          <div className="inline-flex items-center rounded-full border border-border bg-background/60 backdrop-blur-sm px-3 py-1 text-sm font-medium text-muted-foreground mb-6">
            <Code2 className="h-4 w-4 mr-2 text-primary" />
            V 0.1
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
            Share Your <span className="text-primary">Learning Journey</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A simple space for students and developers to write about their projects, 
            coding tips, and technical thoughts. Connect with a community of builders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8 shadow-lg">
              <Link href="/auth/signup">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 bg-background/50 backdrop-blur-md"
            >
              <Link href="/blog">Read Articles</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────────────── */}
      <section className="container relative z-10 mx-auto px-4 py-24 bg-background">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Why Write Here?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to document your growth and share your knowledge.
          </p>
        </div>

      </section>
    </div>
  );
}