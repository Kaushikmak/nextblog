"use client"

import { LogInSchema, SignUpSchema } from "@/app/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Login(){
    const [isPending, startTransition] = useTransition()
    const router = useRouter();
    const form = useForm({
            resolver: zodResolver(LogInSchema),
            defaultValues:{
                email: "",
                password: "",
            }
        });

    function onSubmit(data : z.infer<typeof LogInSchema>){ {
        startTransition(async () => {
            await authClient.signIn.email({
                email: data.email,
                password: data.password,
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Logged in successfully");
                        router.push("/");
                    },
                    onError: () => {
                        toast.error("Error during logging", {
                            description: "check your credentials",
                        });
                    }
                }
                });
        }
    );
            
            }
        }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Already have account? Log In now</CardTitle>
                <CardDescription>Log In by email and password</CardDescription>
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
                        <Controller name="password" control={form.control} render={({field,fieldState})=>(
                            <Field>
                                <FieldLabel>Password</FieldLabel>
                                <Input aria-invalid={fieldState.invalid} type="password" placeholder="******" {...field} />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}/>
                        <Button disabled={isPending}>{isPending? (<>
                            <Loader2 className="size-4 animate-spin"/>
                            <span>Loading...</span>
                            </>) : (
                                <span>Log in</span>
                            )
                        }</Button>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}