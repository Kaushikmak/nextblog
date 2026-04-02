"use client"

import { createBlogAction } from "@/app/actions";
import { postSchema } from "@/app/schemas/blog";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConvexAuth } from "convex/react";
import { Loader2, Eye } from "lucide-react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { marked } from "marked";


const TiptapEditor = dynamic(() => import("@/components/web/TiptapEditor"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col w-full min-h-150 border rounded-xl bg-muted/10 animate-pulse p-4">
            <div className="h-10 bg-muted rounded-md mb-4 w-full"></div>
            <div className="flex-1 bg-muted rounded-md w-full"></div>
        </div>
    ),
});

export default function CreatePostPage() {
    const { isAuthenticated } = useConvexAuth();
    const [isPending, startTransition] = useTransition();
    
    const form = useForm({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: "",
            content: "",
            image: undefined,
        }
    });

    // Watch content for the live preview
    const watchContent = form.watch("content");
    const watchTitle = form.watch("title");

    async function onSubmit(values: z.infer<typeof postSchema>) {
        if (!isAuthenticated) {
            toast.error("You must sign in to publish your blog");
            return;
        }
        startTransition(async () => {
            const result = await createBlogAction(values);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Blog published successfully!");
            }
        });
    }

    return (
        <div className="max-w-400 mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
                    <p className="text-muted-foreground">Draft your masterpiece with rich text and media.</p>
                </div>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending} size="lg" className="w-full md:w-auto">
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Publish Post"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Section */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <form className="space-y-6">
                                <FieldGroup>
                                    <Controller name="title" control={form.control} render={({ field, fieldState }) => (
                                        <Field>
                                            <FieldLabel>Post Title</FieldLabel>
                                            <Input placeholder="Enter a catchy title..." {...field} />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )} />

                                    <Controller name="image" control={form.control} render={({ field, fieldState }) => (
                                        <Field>
                                            <FieldLabel>Cover Image (Optional)</FieldLabel>
                                            <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        </Field>
                                    )} />

                                    <Controller name="content" control={form.control} render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Content</FieldLabel>
                                            <TiptapEditor content={field.value} onChange={field.onChange} />
                                        </Field>
                                    )} />
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Preview Section */}
                <div className="hidden lg:block">
                    <div className="sticky top-8 space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Eye className="size-4" />
                            <span className="text-sm font-medium uppercase tracking-wider">Live Preview</span>
                        </div>
                        <Card className="min-h-200 bg-muted/10 overflow-hidden">
                            <CardContent className="p-8 prose dark:prose-invert max-w-none">
                                <h1 className="not-prose text-4xl font-extrabold mb-8">{watchTitle || "Your Title Here"}</h1>
                                <div dangerouslySetInnerHTML={{ __html: marked(watchContent || "<p className='text-muted-foreground italic'>Start typing to see the magic happen...</p>") }} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}