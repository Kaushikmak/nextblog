"use client";

import { SignUpSchema } from "@/app/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export default function Signup()
{
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(SignUpSchema),
        defaultValues:{
            name: "",
            email: "",
            password: "",
        },
        
    },);

    function onSubmit(data : z.infer<typeof SignUpSchema>){ {
        startTransition(async ()=>{
            await authClient.signUp.email({
            email: data.email,
            password: data.password,
            name: data.name,
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Account created successfully");
                    router.push("/");
                },
                onError: (error) => {
                    toast.error("Error during sign up", {description: error.error.message})    
                }
            }
            });
        })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Don't have account? Sign up now</CardTitle>
                <CardDescription>create new account by email and password</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup className="gap-y-4">
                        <Controller name="email" control={form.control} render={({field,fieldState})=>(
                            <Field>
                                <FieldLabel>Email</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} placeholder="abc@xyz.com" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}/>
                        <Controller name="name" control={form.control} render={({field,fieldState})=>(
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} placeholder="John Doe" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}/>
                        <Controller name="password" control={form.control} render={({field,fieldState})=>(
                            <Field>
                                <FieldLabel>Password</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} type="password" placeholder="******" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}/>
                        <Button disabled={isPending}>{
                            isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Creating your account</span>
                                </>
                            ) : (
                                <span>Sign Up</span>
                            )
                        }</Button>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}