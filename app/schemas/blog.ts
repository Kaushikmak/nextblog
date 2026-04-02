import { z } from "zod";

export const postSchema = z.object({
    title: z.string().min(3, { message: "minimum 3 characters for title" }).max(150, { message: "maximum length of title can be 150 characters" }),
    content: z.string().min(10, { message: "content must be longer than 10 characters" }),
    image: z.instanceof(File).optional(),
});