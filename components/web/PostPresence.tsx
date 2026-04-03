"use client";

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel";
import FacePile from "@convex-dev/presence/facepile";
import usePresence from "@convex-dev/presence/react"
import { useState, useMemo } from "react";

interface iAppProps {
    roomId: Id<"posts">;
    userID?: string | null;
}

export function PostPresence({ roomId, userID }: iAppProps) {
    const [localId] = useState(() => userID || `anon_${Math.random().toString(36).substring(2, 10)}`);
    const presenceState = usePresence(api.presence, roomId, localId);
    
    // FIX: Deduplicate by 'userId' to remove "Extra User" caused by stale sessions
    const uniquePresence = useMemo(() => {
        if (!presenceState) return [];
        const seen = new Set();
        return presenceState.filter((p: any) => {
            const id = p.userId; // Use userId to match your library version
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [presenceState]);

    if (!uniquePresence || uniquePresence.length === 0) return null;

    const anonCount = uniquePresence.filter((p: any) => p.userId && p.userId.startsWith("anon_")).length;
    const authUsers = uniquePresence.filter((p: any) => p.userId && !p.userId.startsWith("anon_"));

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
                        {/* NOTE: If FacePile specifically expects 'user' instead of 'userId', 
                          you might need to map it: authUsers.map(u => ({ ...u, user: u.userId }))
                        */}
                        <FacePile presenceState={authUsers} />
                    </div>
                )}
                
                {anonCount > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">
                        {authUsers.length > 0 ? "+" : ""}{anonCount} guest{anonCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    );
}