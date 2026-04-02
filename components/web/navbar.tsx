"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Menu, X, TerminalSquare } from "lucide-react"; // Use icons for hamburger
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button, buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SearchInput } from "./searchInput";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: session } = authClient.useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Create", href: "/create" },
  ];

  const handleSignOut = () => {
  authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        toast.success("Logged out successfully");
        router.push("/");
        // Ensure no value is returned here if needed
      },
      onError: (ctx) => {
        // Explicitly calling the function without returning its result
        toast.error(ctx.error.message); 
        return; // Explicitly return void to satisfy the type constraint
      },
    },
  });
};

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <TerminalSquare className="size-6 text-primary" />
              <span className="font-bold text-xl tracking-tight">NextBlog</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-2">
              {navLinks.map((link) => (
                <Link key={link.name} className={buttonVariants({ variant: "ghost" })} href={link.href}>
                  {link.name}
                </Link>
              ))}
            </div>
            <SearchInput />
            
            { !isLoading && (
              isAuthenticated ? (
                <>
                  <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
                    {session?.user?.name || "Dashboard"}
                  </Link>
                  <Button onClick={handleSignOut}>Log out</Button>
                </>
              ) : (
                <>
                  <Link className={buttonVariants()} href="/auth/signup">Sign up</Link>
                  <Link className={buttonVariants({ variant: "secondary" })} href="/auth/login">Login</Link>
                </>
              )
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4 animate-in slide-in-from-top-2">
          <SearchInput />
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t">
            { !isLoading && (
              isAuthenticated ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {session?.user?.name || "Dashboard"}
                  </Link>
                  <Button onClick={handleSignOut} className="justify-start">Log out</Button>
                </>
              ) : (
                <>
                  <Link className={buttonVariants()} href="/auth/signup">Sign up</Link>
                  <Link className={buttonVariants({ variant: "secondary" })} href="/auth/login">Login</Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}