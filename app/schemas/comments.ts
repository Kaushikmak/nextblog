import { Id } from "@/convex/_generated/dataModel";
import z from "zod";

export const commentSchema = z.object({
    body: z.string().min(4,"Comment must have 4 letters"),
    postId: z.custom<Id<"posts">>()
});