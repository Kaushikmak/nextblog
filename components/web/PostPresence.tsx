"use client";

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel";
import FacePile from "@convex-dev/presence/facepile";
import usePresence from "@convex-dev/presence/react"
import { useState } from "react";

interface iAppProps {
    roomId: Id<"posts">;
    userID?: string | null; // Made optional to support anonymous viewers
}

export function PostPresence({ roomId, userID }: iAppProps) {
    // Generate a stable anonymous ID for this session if the user isn't logged in
    const [localId] = useState(() => userID || `anon_${Math.random().toString(36).substring(2, 10)}`);
    
    // Subscribe to presence in this specific post room
    const presenceState = usePresence(api.presence, roomId, localId);
    
    if (!presenceState || presenceState.length === 0) {
        return null;
    }

    // Filter out anonymous users (who start with "anon_") from authenticated users
    const anonCount = presenceState.filter((p: any) => p.user && p.user.startsWith("anon_")).length;
    const authUsers = presenceState.filter((p: any) => !p.user || !p.user.startsWith("anon_"));

    return (
        <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border">
            {/* Pulsing online indicator */}
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {presenceState.length} Viewing
                </p>
            </div>
            
            {/* Display Logic */}
            <div className="flex items-center border-l pl-3">
                {/* Show avatars only for logged-in users */}
                {authUsers.length > 0 && (
                    <div className="text-black scale-90 origin-left">
                        <FacePile presenceState={authUsers} />
                    </div>
                )}
                
                {/* Show text count for anonymous users */}
                {anonCount > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">
                        {authUsers.length > 0 ? "+" : ""}{anonCount} guest{anonCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    )
}