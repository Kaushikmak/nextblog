import {z} from "zod";


export const postSchema = z.object(
    {
        title: z.string().min(3,{error: "minimum 3 characters for title"}).max(50,{error: "maximum lenght of title an be 100 characters"}),
        content: z.string().min(10,{error: "content must be longer than 10 characters"}),
        image: z.instanceof(File),
    }
);