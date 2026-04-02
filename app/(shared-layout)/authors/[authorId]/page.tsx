import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { AuthorProfileClient } from "@/components/web/AuthorProfileClient";

interface AuthorProfileProps {
    params: Promise<{ authorId: string }>;
}

/**
 * generateMetadata - Server Component Export
 * Disallowed in Client Components. Must reside in a Server Component.
 */
export async function generateMetadata({ params }: AuthorProfileProps): Promise<Metadata> {
    const { authorId } = await params;
    const authorData = await fetchQuery(api.authors.getAuthorProfile, { authorId });

    if (!authorData) {
        return { title: "Author Not Found" };
    }

    return {
        title: authorData.fallbackName,
        description: authorData.profile?.bio || `Read articles by ${authorData.fallbackName} on MutexBlog.`,
    };
}

export default async function AuthorProfilePage({ params }: AuthorProfileProps) {
    const { authorId } = await params;

    return <AuthorProfileClient authorId={authorId} />;
}