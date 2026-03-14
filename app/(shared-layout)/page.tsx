"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const posts = useQuery(api.posts.getPosts);

  return (
    <div className="flex flex-col gap-16 py-10">
      {/* Hero Section */}
      <section className="text-center flex flex-col items-center gap-6 py-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Share your <span className="text-primary">thoughts</span> with the world.
        </h1>
        <p className="text-muted-foreground text-lg max-w-150">
          NextBlog is an open platform where developers and writers share their latest 
          insights on technology, engineering, and creative coding.
        </p>
        <div className="flex gap-4">
          <Link href="/create" className={buttonVariants({ size: "lg" })}>
            Start Writing
          </Link>
          <Link href="/blog" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Read Articles
          </Link>
        </div>
      </section>

      {/* Featured/Recent Posts Section */}
      <section className="flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold">Recent Stories</h2>
            <p className="text-muted-foreground">The latest updates from our community</p>
          </div>
          <Link href="/blog" className="text-primary hover:underline font-medium">
            View all posts →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts === undefined ? (
            // Loading State using existing Skeleton component
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-50 w-full rounded-xl" />
                <Skeleton className="h-4 w-62.5" />
                <Skeleton className="h-4 w-50" />
              </div>
            ))
          ) : posts.length > 0 ? (
            // Displaying the top 3-6 most recent posts
            posts.slice(0, 3).map((post) => (
              <Card key={post._id} className="flex flex-col overflow-hidden border-2">
                {post.imageURL && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={post.imageURL} 
                      alt={post.title} 
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {post.body}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Link 
                    href={`/blog/${post._id}`} 
                    className={buttonVariants({ variant: "secondary", className: "w-full" })}
                  >
                    Read More
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No posts found. Be the first to write one!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}