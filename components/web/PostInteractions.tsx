"use client"

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef } from "react";
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
    const hasLiked = useQuery(api.posts.getLikeStatus, { postId });
    
    const viewed = useRef(false);

    useEffect(() => {
        if (!viewed.current) {
            incrementView({ postId });
            viewed.current = true;
        }
    }, [postId, incrementView]);

    const handleLike = async () => {
        try {
            await toggleLike({ postId });
        } catch (error) {
            toast.error("You must be logged in to like posts.");
        }
    };

    return (
        <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
                <Eye className="size-4" />
                <span className="text-sm font-medium">{initialViews} Views</span>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLike}
                    className={hasLiked ? "text-red-500 hover:text-red-600" : ""}
                >
                    <Heart className={`size-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                    {initialLikes} Likes
                </Button>
            </div>
        </div>
    );
}