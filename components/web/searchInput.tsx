"use client";

import { Loader2, Search, FileText, X, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SearchInput() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const router = useRouter();

  const results = useQuery(
    api.posts.searchPost,
    term.length >= 2 ? { limit: 8, term } : "skip"
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setTerm("");
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    setActiveIndex(-1);
    itemRefs.current = [];
  }, [results]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!results || results.length === 0) {
      if (e.key === "Escape") handleClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < results.length - 1 ? i + 1 : 0;
        itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const prev = i > 0 ? i - 1 : results.length - 1;
        itemRefs.current[prev]?.scrollIntoView({ block: "nearest" });
        return prev;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(`/blog/${results[activeIndex]._id}`);
        handleClose();
      }
    } else if (e.key === "Escape") {
      handleClose();
    }
  }

  const isLoading = results === undefined && term.length >= 2;
  const isEmpty = results !== undefined && results.length === 0 && term.length >= 2;
  const hasResults = results && results.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-all hover:border-input hover:text-foreground hover:shadow-md"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
        <span className="hidden sm:flex items-center gap-0.5 ml-1">
          <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">⌘</kbd>
          <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">K</kbd>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
          style={{
            backgroundColor: "hsl(var(--background) / 0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Input ── */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 shadow-2xl">
              {isLoading
                ? <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
                : <Search className="size-5 shrink-0 text-muted-foreground" />
              }

              <input
                ref={inputRef}
                type="text"
                placeholder="Search articles…"
                value={term}
                onChange={(e) => { setTerm(e.target.value); setActiveIndex(-1); }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none caret-primary"
              />

              {term ? (
                <button
                  onClick={() => { setTerm(""); setActiveIndex(-1); inputRef.current?.focus(); }}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="inline-flex h-6 items-center rounded border border-border bg-muted px-2 font-mono text-[11px] text-muted-foreground">
                  ESC
                </kbd>
              )}
            </div>

            {/* ── Results panel ── */}
            {term.length >= 2 && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in-0 slide-in-from-top-1 duration-150">

                {/* No results */}
                {isEmpty && (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted">
                      <Search className="size-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No results for{" "}
                      <span className="font-medium text-foreground">"{term}"</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60">Try a different keyword</p>
                  </div>
                )}

                {/* Results */}
                {hasResults && (
                  <div className="py-1.5">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        Articles
                      </span>
                      <span className="text-[11px] text-muted-foreground/50">
                        {results.length} result{results.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {results.map((post, i) => {
                      const isActive = activeIndex === i;
                      return (
                        <Link
                          href={`/blog/${post._id}`}
                          key={post._id}
                          ref={(el) => { itemRefs.current[i] = el; }}
                          onClick={handleClose}
                          data-active={isActive}
                          className={`group flex items-center gap-3 px-4 py-3 transition-colors
                            ${isActive
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                            }`}
                        >
                          {/* Icon */}
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg border border-border transition-colors
                            ${isActive ? "bg-background" : "bg-muted group-hover:bg-background"}`}
                          >
                            <FileText className="size-4 text-muted-foreground" />
                          </div>

                          {/* Title */}
                          <span className="flex-1 truncate text-sm font-medium">
                            <Highlight text={post.title} query={term} />
                          </span>

                          {/* Arrow — visible when active */}
                          <ArrowRight className={`size-4 shrink-0 text-muted-foreground transition-all
                            ${isActive
                              ? "opacity-100 translate-x-0"
                              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                            }`}
                          />
                        </Link>
                      );
                    })}

                    {/* Footer */}
                    <div className="border-t border-border px-4 py-2.5 flex items-center gap-4">
                      <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                        <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono text-[10px]">↑↓</kbd>
                        navigate
                      </span>
                      <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                        <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono text-[10px]">↵</kbd>
                        open
                      </span>
                      <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                        <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono text-[10px]">ESC</kbd>
                        close
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-primary/15 text-primary rounded-sm font-semibold">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}