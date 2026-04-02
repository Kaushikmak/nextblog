"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Menu, X } from "lucide-react";
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
  const pathname = usePathname();

  // Primary navigation links next to logo
  const mainLinks = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Authors", href: "/authors" },
  ];

  // Conditional link for authenticated users
  const navLinks = isAuthenticated 
    ? [...mainLinks, { name: "Create", href: "/create" }] 
    : mainLinks;

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Logged out successfully");
          setIsMobileMenuOpen(false);
          router.push("/");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
          return;
        },
      },
    });
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LEFT SIDE: Logo + Navigation Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="shrink-0">
              <h1 className="text-3xl font-bold">
                Next<span className="text-primary">Blog</span>
              </h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    pathname === link.href && "bg-muted text-primary",
                    "text-sm font-medium"
                  )} 
                  href={link.href}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Search + Auth + Theme */}
          <div className="hidden md:flex items-center gap-3">
            <SearchInput />
            
            {!isLoading && (
              isAuthenticated ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        pathname === "/dashboard" && "border-primary text-primary"
                    )}
                  >
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

          {/* Mobile Menu Button */}
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
                className={cn(
                    buttonVariants({ variant: "ghost" }), 
                    "justify-start",
                    pathname === link.href && "bg-muted text-primary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t">
            {!isLoading && (
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
                  <Link className={buttonVariants()} href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
                  <Link className={buttonVariants({ variant: "secondary" })} href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}