"use client"

import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useConvexAuth } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


// components can have standard exports, but they must be React components
export function Navbar() {
  const {isAuthenticated, isLoading} = useConvexAuth();
  const router = useRouter();
  return (
    <nav className="flex w-full py-5 items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/">
            <h1 className="text-3xl font-bold">
                Next<span className="text-blue-500">Blog</span>
            </h1>
        </Link>
        <div className="flex items-center gap-2">
            <Link className={buttonVariants({variant: "ghost"})} href="/">Home</Link>
            <Link className={buttonVariants({variant: "ghost"})} href="/blog">Blog</Link>
            <Link className={buttonVariants({variant: "ghost"})} href="/create">Create</Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        { isLoading ? null : isAuthenticated ? (
          <Button onClick={() => authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                toast.success("Logged out successfully");
                router.push("/");
              },
              onError: (error) => {
                toast.error(error.error.message);
              }
            }
          })}>Log out</Button>
        ) : (
        <>
          <Link className={buttonVariants()} href="/auth/signup">Sign up</Link>
          <Link className={buttonVariants({ variant: "secondary" })} href="/auth/login">Login</Link>
        </>
        )
      }
        
        <ThemeToggle />
      </div>
    </nav>
  );
}