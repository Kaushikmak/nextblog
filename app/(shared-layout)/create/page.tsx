"use client"

import { postSchema } from "@/app/schemas/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConvexAuth, useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export default function (){
    const {isAuthenticated} = useConvexAuth();
    const [isPending, startTransition] = useTransition();
    const mutation = useMutation(api.posts.createPost);
    console.log("mutatuion", mutation.toString());
    const router = useRouter();
    const form = useForm(
        {
            resolver: zodResolver(postSchema),
            defaultValues: {
                title: "",
                content: ""
            }
        }
    );

    function onSubmit(values: z.infer<typeof postSchema>){
        if(!isAuthenticated){
            toast.error("Your must sign in to publish your blog");
            return;
        }
        startTransition(()=>{
            mutation({
                body: values.content,
                title: values.title,
            
            });

            toast.success("Blog posted successfully");
            router.push("/");
            
        });

    }

    return (
        <div className="py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    Create Post
                </h1>
                <p className="text-xl text-muted-foreground pt-4">
                    Create, Share, Explore your thoughts
                </p>
            </div>
            <Card className="w-full max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Blog Article</CardTitle>
                    <CardDescription>Create a new blog article</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup className="gap-y-5">
                            <Controller name="title" control={form.control} render={({field,fieldState}) => (
                                <Field>
                                    <FieldLabel>Title</FieldLabel>
                                    <Input aria-invalid={fieldState.invalid} type={"text"} placeholder="Cool title" {...field} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}

                                </Field>
                            )}  />
                            <Controller name="content" control={form.control} render={({field,fieldState}) => (
                                <Field>
                                    <FieldLabel>Description</FieldLabel>
                                    <Textarea aria-invalid={fieldState.invalid} placeholder="what is this blog about" {...field} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}

                                </Field>
                            )}  />
                        <Button disabled={isPending}>{
                            isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>publising your blog the world!</span>
                                </>
                            )     : (
                                <span>Create Post</span>
                            )
                        }</Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}