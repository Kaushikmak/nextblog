"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Menu, X, Lock, Unlock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button, buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SearchInput } from "./searchInput";
import { cn } from "@/lib/utils";

function MutexIcon() {
  return (
    <div className="relative flex items-center justify-center w-8 h-8 bg-primary/10 rounded border border-primary/20 shrink-0">
      <Lock className="size-4 text-primary" />
    </div>
  );
}

export function Navbar() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: session } = authClient.useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const mainLinks = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Authors", href: "/authors" },
  ];

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
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 flex items-center gap-3 overflow-hidden">
              <MutexIcon />
              <div className="text-xl md:text-2xl font-bold flex items-center shrink-0">
                <span className="font-mono">Mutex<span className="text-primary">Blog</span></span>
              </div>
            </Link>

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

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown ... (remains unchanged) */}
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