import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Code2, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { GridLineBackground } from "@/components/web/Gridlinebackground";

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
            V 0.1.0-alpha
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors duration-300">
            <CardHeader>
              <Code2 className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Code Support</CardTitle>
              <CardDescription>
                Write clean code snippets easily.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our editor supports markdown and syntax highlighting so your code 
                is always easy to read.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors duration-300">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Build a Portfolio</CardTitle>
              <CardDescription>Document what you learn.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep a record of your engineering progress and share it with 
                potential employers or peers.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors duration-300">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Community</CardTitle>
              <CardDescription>Connect with other students.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Read what others are building and exchange feedback through 
                simple comments.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}