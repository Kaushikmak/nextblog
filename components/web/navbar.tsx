import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

// components can have standard exports, but they must be React components
export function Navbar() {
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
            <Link className={buttonVariants({variant: "ghost"})} href="/blog">About</Link>
            <Link className={buttonVariants({variant: "ghost"})} href="/create">Contact</Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link className={buttonVariants()} href="/auth/signup">Sign up</Link>
        <Link className={buttonVariants({ variant: "secondary" })} href="/auth/login">Login</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}