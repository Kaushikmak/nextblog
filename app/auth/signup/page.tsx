"use client";

import { SignUpSchema } from "@/app/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

export default function Signup(){
    const form = useForm({
        resolver: zodResolver(SignUpSchema),
        defaultValues:{
            name: "",
            email: "",
            password: "",
        }
    });

    function onSubmit() {
        console.log("button pressed")
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
                        <Button variant={"default"} type="submit">Sign up</Button>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}