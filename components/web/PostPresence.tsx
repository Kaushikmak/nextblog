"use client";

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel";
import FacePile from "@convex-dev/presence/facepile";
import usePresence from "@convex-dev/presence/react"

interface iAppProps{
    roomId: Id<"posts">,
    userID: string

};


export function PostPresence({roomId, userID}: iAppProps) {
    const presenceState = usePresence(api.presence,roomId,userID);
    if(!presenceState || presenceState.length === 0){
        return null;
    }
  return (
    <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Online</p>
        <div className="text-black">
            <FacePile presenceState={presenceState} />
        </div>
    </div>
  )
}
