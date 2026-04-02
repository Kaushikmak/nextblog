"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User, FileText } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthorsDirectoryPage() {
    const authors = useQuery(api.authors.getAuthorsList);
    const [searchTerm, setSearchTerm] = useState("");

    if (authors === undefined) {
        return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
    }

    const filteredAuthors = authors.filter(author => 
        author.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Authors</h1>
                    <p className="text-muted-foreground mt-2">Discover and follow the minds behind the content.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search authors..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAuthors.map((author) => (
                    <Card key={author.authorId} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="size-12 bg-muted rounded-full flex items-center justify-center shrink-0">
                                <User className="size-6 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{author.name}</CardTitle>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <FileText className="size-3 mr-1" />
                                    {author.postCount} Published Posts
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/authors/${author.authorId}`}>
                                <Button variant="secondary" className="w-full">View Profile</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                
                {filteredAuthors.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                        No authors found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}