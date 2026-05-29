"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";

interface TocItem {
    id: string;
    text: string;
    level: number;
    parentId?: string;
    hasChildren?: boolean;
}

export function TableOfContents({ html }: { html: string }) {
    const [headings, setHeadings] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const elements = Array.from(temp.querySelectorAll("h1, h2, h3"));
        
        const parsedHeadings: TocItem[] = [];
        const currentParents: Record<number, string> = {};

        elements.forEach((elem) => {
            let id = elem.id;
            if (!id && elem.textContent) {
                id = elem.textContent
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)+/g, "");
            }
            if (!id || !elem.textContent) return;

            const level = Number(elem.tagName.substring(1));
            
            let parentId: string | undefined = undefined;
            for (let l = level - 1; l >= 1; l--) {
                if (currentParents[l]) {
                    parentId = currentParents[l];
                    break;
                }
            }

            parsedHeadings.push({ id, text: elem.textContent, level, parentId, hasChildren: false });
            currentParents[level] = id;
            
            for (let l = level + 1; l <= 6; l++) {
                delete currentParents[l];
            }

            if (parentId) {
                const parent = parsedHeadings.find(h => h.id === parentId);
                if (parent) parent.hasChildren = true;
            }
        });

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
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    useEffect(() => {
        if (!activeId) return;
        const activeItem = headings.find(h => h.id === activeId);
        if (activeItem) {
            setExpandedIds(prev => {
                const next = new Set(prev);
                let curr = activeItem.hasChildren ? activeItem.id : activeItem.parentId;
                while (curr) {
                    next.add(curr);
                    const p = headings.find(h => h.id === curr);
                    curr = p?.parentId;
                }
                return next;
            });
        }
    }, [activeId, headings]);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (headings.length === 0) return null;

    // Find the minimum heading level to determine the baseline padding
    const minLevel = Math.min(...headings.map(h => h.level));

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-tight uppercase text-foreground">
                On this page
            </h4>
            <ul className="space-y-2 text-sm">
                {headings.map((heading) => {
                    let isVisible = true;
                    let curr = heading.parentId;
                    while (curr) {
                        if (!expandedIds.has(curr)) {
                            isVisible = false;
                            break;
                        }
                        const p = headings.find(h => h.id === curr);
                        curr = p?.parentId;
                    }
                    if (!isVisible) return null;

                    // Calculate indentation based on relative heading level
                    const indent = (heading.level - minLevel) * 12;

                    return (
                        <li
                            key={heading.id}
                            style={{ paddingLeft: `${indent}px` }}
                            className="flex items-start gap-1"
                        >
                            <div className="shrink-0 w-4 pt-[3px] flex justify-center">
                                {heading.hasChildren && (
                                    <button
                                        onClick={(e) => toggleExpand(heading.id, e)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {expandedIds.has(heading.id) ? (
                                            <ChevronDown className="size-4" />
                                        ) : (
                                            <ChevronRight className="size-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <a
                                href={`#${heading.id}`}
                                className={cn(
                                    "block hover:text-foreground transition-colors",
                                    activeId === heading.id
                                        ? "text-foreground font-bold"
                                        : "text-foreground/80 font-medium"
                                )}
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById(heading.id)?.scrollIntoView({
                                        behavior: "smooth",
                                    });
                                    history.pushState(null, "", `#${heading.id}`);
                                    setActiveId(heading.id);
                                    if (heading.hasChildren) {
                                        setExpandedIds(prev => new Set(prev).add(heading.id));
                                    }
                                }}
                            >
                                {heading.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
