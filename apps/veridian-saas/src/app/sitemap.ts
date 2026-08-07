import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { blogPosts, docsContent } from "@/data/content";

const STATIC_ROUTES = [
  "",
  "/solutions",
  "/industries",
  "/features",
  "/pricing",
  "/resources",
  "/blog",
  "/docs",
  "/about",
  "/contact",
  "/login",
  "/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const docsEntries: MetadataRoute.Sitemap = Object.keys(docsContent).map((slug) => ({
    url: `${site.url}/docs/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...blogEntries, ...docsEntries];
}
