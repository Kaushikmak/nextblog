"use client"

import { Loader2, MessagesSquare } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema } from "@/app/schemas/comments";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Preloaded, useMutation, usePreloadedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import z from "zod";
import { toast } from "sonner";
import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "../ui/separator";
import { Spinner } from "@/components/ui/spinner"

export function CommentSection(props: {preLoadedComments: Preloaded<typeof api.comments.getCommentsByPostId>}){

    const params = useParams<{postId: Id<"posts">}>(); 

    const data  =  usePreloadedQuery(props.preLoadedComments);

    const [isPending,startTransition] = useTransition()

    // now we are using mutation on cleint side
    const createComment  = useMutation(api.comments.createComment);

    const form  = useForm({
        resolver: zodResolver(commentSchema),
        defaultValues: {
            body: "",
            postId: params.postId,
        }
    })

    async function onSubmit(values: z.infer<typeof commentSchema>){
        startTransition(async () => {
            try{
            await createComment(values);
            form.reset();
            toast.success("comment posted");
        }catch{
            toast.error("Failed to create comment");
        }
        })
    }

    if(data==undefined){
        return (
            <div className="flex flex-col items-center gap-4">
                <Button disabled size="sm">
                  <Spinner data-icon="inline-start" />
                  Loading comments...
                </Button>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 border-b">
                <MessagesSquare className="size-5"/>
                <h2 className="text-xl text-bold">{data.length} comments</h2>
            </CardHeader>
            <CardContent className=" space-y-8">
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <Controller 
                        name="body"
                        control={form.control}
                        render={({field,fieldState})=>{return (
                            <Field>
                                <FieldLabel>what you think about this blog...</FieldLabel>
                                <Textarea 
                                    aria-invalid={fieldState.invalid}
                                    {...field}
                                />
                                {fieldState.invalid  && (<FieldError errors={[fieldState.error]}/>)}
                                 
                            </Field>
                        )}}

                    />
                    <Button className="mt-1 mb-3" disabled={isPending}>{
                            isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>posting you comment</span>
                                </>
                            ) : (
                                <span>comment</span>
                            )
                        }</Button>
                </form>

                {data?.length > 0 && <Separator />}

                <section className="space-y-6">
                        {
                            data?.map((comment) =>  (
                                <div className="flex gap-4" key={comment._id}>
                                    <Avatar className="size-10 shrink-0">
                                        <AvatarImage 
                                        src={`https://avatar.vercel.sh/${comment.authorName}}`} 
                                        alt={comment.authorName}
                                        />
                                        <AvatarFallback>
                                            {comment.authorName.slice(0,2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{comment.authorName}</p>
                                            <p className="text-muted-foreground text-xs">{new Date(comment._creationTime).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{comment.body}</p>
                                    </div>
                                </div>
                            ))
                        }
                </section>
            </CardContent>
        </Card>
    )
}