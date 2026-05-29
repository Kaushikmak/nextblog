"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

export function TableOfContents({ html }: { html: string }) {
    const [headings, setHeadings] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        // Create a temporary div to parse headings
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const elements = Array.from(temp.querySelectorAll("h1, h2, h3"));
        
        const parsedHeadings: TocItem[] = elements.map((elem) => {
            let id = elem.id;
            if (!id && elem.textContent) {
                id = elem.textContent
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
            }
            return {
                id,
                text: elem.textContent || "",
                level: Number(elem.tagName.substring(1)),
            };
        }).filter(h => h.id && h.text);

        setHeadings(parsedHeadings);
    }, [html]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "0% 0% -80% 0%" }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
                On this page
            </h4>
            <ul className="space-y-2.5 text-sm">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                    >
                        <a
                            href={`#${heading.id}`}
                            className={cn(
                                "block hover:text-foreground transition-colors line-clamp-2",
                                activeId === heading.id
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground"
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({
                                    behavior: "smooth",
                                });
                                // Update URL without full navigation
                                history.pushState(null, "", `#${heading.id}`);
                                setActiveId(heading.id);
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
