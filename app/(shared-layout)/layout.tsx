import { Navbar } from "@/components/web/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "MutexBlog",
    template: "%s | MutexBlog",
  },
  description: "A specialized platform for technical discourse, focusing on core computer science, discrete mathematics, and advanced engineering principles.",
  authors: [{ name: "tastytaco", url: "https://nextblog-ov87.vercel.app" }],
  creator: "tastytaco",
  publisher: "MutexBlog",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nextblog-ov87.vercel.app",
    siteName: "MutexBlog",
    title: "MutexBlog | Atomic Updates for Engineers",
    description: "Experience a seamless technical writing environment with real-time collaborative features and a modern developer-centric interface.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MutexBlog - Real-time Tech Blogging Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MutexBlog",
    description: "Atomic Updates for Engineers - Bridging the gap between code and content.",
    creator: "@KmaK69837720",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    google: "OmzJnIQ1e1Pe6kyp3S7DL8AuEn0DuVUX80OCScnJ7io",
  },
  
  category: "technology",
};

export default function SharedLayout({children,}:{children: React.ReactNode;}) 
{
  return (
    <div>
      <Navbar />
      {children}
    </div>
    );
}