import { z } from "zod";

export const SignUpSchema = z.object({
    name: z.string().min(2,{error: "Name must contain atleat 2 characters"}),
    email: z.email({error:"Invalid email address"}),
    password: z.string().min(6,{error: "password must have atleast 6 characters"}).max(30,{error: "password must be less than 30 characters"}),
});