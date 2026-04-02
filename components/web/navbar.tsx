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
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLocked((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-8 h-8 bg-primary/10 rounded border border-primary/20">
      {isLocked ? (
        <Lock className="size-4 text-primary animate-in zoom-in duration-300" />
      ) : (
        <Unlock className="size-4 text-primary animate-in zoom-in duration-300" />
      )}
      {/* OS Style scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-full w-full animate-pulse pointer-events-none" />
    </div>
  );
}

/**
 * Typewriter Component
 * Handles the linear synthesis of the brand name string.
 */
function Typewriter({ text, speed = 100 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return (
    <span className="font-mono">
      {/* Prefix style like a terminal prompt */}
      <span className="text-muted-foreground mr-1">~</span>
      <span className="text-primary font-bold">$</span>{" "}
      {displayText.slice(0, 5)}
      <span className="text-primary">{displayText.slice(5)}</span>
    </span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LEFT SIDE: Logo + Navigation Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 flex items-center gap-3">
              <MutexIcon />
              <div className="text-xl md:text-2xl font-bold flex items-center">
                <Typewriter text="MutexBlog" />
                {/* Blinking Caret */}
                <span className="ml-1 w-2 h-6 bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary))] " />
              </div>
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