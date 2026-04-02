"use client"

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Eye } from "lucide-react";
import { toast } from "sonner";

interface PostInteractionsProps {
    postId: Id<"posts">;
    initialViews: number;
    initialLikes: number;
}

export function PostInteractions({ postId, initialViews, initialLikes }: PostInteractionsProps) {
    const incrementView = useMutation(api.posts.incrementView);
    const toggleLike = useMutation(api.posts.toggleLike);
    
    // Subscribe to real-time database changes
    const post = useQuery(api.posts.getPostById, { postId });
    const hasLikedQuery = useQuery(api.posts.getLikeStatus, { postId });

    // Local state for immediate, zero-latency visual feedback
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState<boolean | undefined>(undefined);
    const [views, setViews] = useState(initialViews);
    
    const viewed = useRef(false);

    // Sync local state when real-time data is received from Convex
    useEffect(() => {
        if (post) {
            setLikes(post.likes ?? 0);
            setViews(post.views ?? 0);
        }
    }, [post]);

    useEffect(() => {
        if (hasLikedQuery !== undefined) {
            setIsLiked(hasLikedQuery);
        }
    }, [hasLikedQuery]);

    // Execute view increment on mount with an optimistic state bump
    useEffect(() => {
        if (!viewed.current) {
            setViews(prev => prev + 1); // Instantly update UI
            incrementView({ postId });  // Mutate database in background
            viewed.current = true;
        }
    }, [postId, incrementView]);

    const handleLike = async () => {
        if (isLiked === undefined) return; 

        // 1. Optimistically calculate new state
        const newIsLiked = !isLiked;
        
        // 2. Apply state instantly before awaiting the server response
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

        try {
            // 3. Execute network request
            await toggleLike({ postId });
        } catch (error) {
            // 4. Rollback state if network request fails (e.g., unauthorized)
            setIsLiked(!newIsLiked);
            setLikes(prev => !newIsLiked ? prev + 1 : Math.max(0, prev - 1));
            toast.error("You must be logged in to like posts.");
        }
    };

    return (
        <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
                <Eye className="size-4" />
                <span className="text-sm font-medium">{views} Views</span>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLike}
                    className={isLiked ? "text-red-500 hover:text-red-600" : ""}
                >
                    <Heart className={`size-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                    {likes} Likes
                </Button>
            </div>
        </div>
    );
}