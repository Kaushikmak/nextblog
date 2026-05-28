import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function test() {
  const posts = await client.query("posts:getPosts", {});
  console.log("Posts:", posts.length);
  if (posts.length > 0) {
    const post = posts[0];
    console.log("Updating post:", post._id);
    try {
      await client.mutation("posts:updatePost", {
        id: post._id,
        title: post.title,
        body: post.body,
        wordCount: post.wordCount || 0,
        readTime: post.readTime || 0,
        coAuthors: post.coAuthors || [],
        isPrivate: post.isPrivate || false,
      });
      console.log("Update success!");
    } catch (e) {
      console.error("Update failed:", e);
    }
  }
}
test();
