"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import FacePile from "@convex-dev/presence/facepile";

interface iAppProps {
  roomId: Id<"posts">;
  userID?: string | null;
}

// Stable session ID per browser tab (not per render)
function getSessionId(roomId: string) {
  const key = `presence_session_${roomId}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `sess_${Math.random().toString(36).substring(2, 12)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getUserId(roomId: string, userID?: string | null) {
  if (userID) return userID;
  const key = `presence_anon_${roomId}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `anon_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function PostPresence({ roomId, userID }: iAppProps) {
  const [ids] = useState(() => ({
    sessionId: getSessionId(roomId),
    userId: getUserId(roomId, userID),
  }));

  const join = useMutation(api.presence.join);
  const leave = useMutation(api.presence.leave);
  const viewers = useQuery(api.presence.list, { roomId });

  useEffect(() => {
    // Join immediately on mount
    join({ roomId, sessionId: ids.sessionId, userId: ids.userId });

    // Leave when tab is hidden or closed
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        leave({ sessionId: ids.sessionId });
      } else {
        join({ roomId, sessionId: ids.sessionId, userId: ids.userId });
      }
    };

    // Fallback for browsers that don't fire visibilitychange on close
    const handleBeforeUnload = () => {
      leave({ sessionId: ids.sessionId });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Unmount = navigating away in Next.js
      leave({ sessionId: ids.sessionId });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [ids, roomId, join, leave]);

  if (!viewers || viewers.length === 0) return null;

  const anonCount = viewers.filter((v) => v.userId.startsWith("anon_")).length;
  const authUsers = viewers
  .filter((v) => !v.userId.startsWith("anon_"))
  .map((v) => ({
    ...v,
    online: true,
    lastDisconnected: 0,
  }));

  return (
    <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-foreground">
          {viewers.length} Viewing
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