import { Metadata } from "next";
import CreatePostClient from "@/components/web/CreatePostClient";

/**
 * Technical Metadata for Discourse Creation
 * * This object is synthesized on the server to define the SEO profile 
 * for the creation route. 
 */
export const metadata: Metadata = {
  title: "Draft a New Insight",
  description: "Formalize your discourse on core computer science and mathematical foundations within the MutexBlog technical ecosystem.",
  
  // Security: Excludes the editor tool from public search indexing
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  // Internal Social Graph configuration
  openGraph: {
    title: "MutexBlog Editor",
    description: "Compose and synchronize technical articles.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MutexBlog Editor Interface",
      },
    ],
  },
};

export default function CreatePostPage() {
  return <CreatePostClient />;
}