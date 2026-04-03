"use client";

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel";
import FacePile from "@convex-dev/presence/facepile";
import usePresence from "@convex-dev/presence/react"
import { useMutation } from "convex/react";
import { useState, useMemo, useEffect, useRef } from "react";

interface iAppProps {
    roomId: Id<"posts">;
    userID?: string | null;
}

export function PostPresence({ roomId, userID }: iAppProps) {
    const [localId] = useState(() => {
        if (userID) return userID;
        // Reuse the same anon ID for this tab+post, so refreshing
        // doesn't register a brand-new ghost session
        const key = `anon_presence_${roomId}`;
        const existing = sessionStorage.getItem(key);
        if (existing) return existing;
        const fresh = `anon_${Math.random().toString(36).substring(2, 10)}`;
        sessionStorage.setItem(key, fresh);
        return fresh;
    });

    const presenceState = usePresence(api.presence, roomId, localId);

    // Deduplicate by userId — keeps only the most-recent session per user
    const uniquePresence = useMemo(() => {
        if (!presenceState) return [];
        const seen = new Set();
        // presenceState is already sorted newest-first by the library
        return presenceState.filter((p: any) => {
            const id = p.userId;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [presenceState]);

    if (!uniquePresence || uniquePresence.length === 0) return null;

    const anonCount = uniquePresence.filter((p: any) => p.userId?.startsWith("anon_")).length;
    const authUsers  = uniquePresence.filter((p: any) => p.userId && !p.userId.startsWith("anon_"));

    return (
        <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border shadow-sm">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                    {uniquePresence.length} Viewing
                </p>
            </div>

            <div className="flex items-center border-l pl-3 gap-2">
                {authUsers.length > 0 && (
                    <div className="text-black scale-90 origin-left">
                        <FacePile presenceState={authUsers} />
                    </div>
                )}
                {anonCount > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">
                        {authUsers.length > 0 ? "+" : ""}{anonCount} guest{anonCount > 1 ? "s" : ""}
                    </span>
                )}
            </div>
        </div>
    );
}