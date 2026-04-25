"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Gallery from "@/components/Gallery";

interface EditorialPost {
  id: string;
  title: string;
  slug: string;
  type: string;
  excerpt: string | null;
  body: string;
  coverImage: string | null;
  festivalTag: string | null;
  publishedAt: string | null;
  galleryImages?: Array<{
    id: string;
    url: string;
    caption?: string;
    shutterSpeed?: string;
    aperture?: string;
    iso?: string;
    order: number;
  }>;
  galleryStyle?: string;
}

const TYPE_LABELS: Record<string, string> = {
  FESTIVAL_PREVIEW: "Preview",
  FESTIVAL_UPDATE: "Update",
  FESTIVAL_RECAP: "Recap",
};

const TYPE_COLOURS: Record<string, string> = {
  FESTIVAL_PREVIEW: "bg-blue-600",
  FESTIVAL_UPDATE: "bg-purple-600",
  FESTIVAL_RECAP: "bg-teal-600",
};

export default function FestivalPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<EditorialPost | null>(null);
  const [related, setRelated] = useState<EditorialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/editorial/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPost(data.post);
        // Fetch related posts by festival tag
        if (data.post?.festivalTag) {
          fetch(`/api/editorial?festivalTag=${data.post.festivalTag}&limit=10`)
            .then((r) => r.json())
            .then((d) => setRelated((d.posts || []).filter((p: EditorialPost) => p.slug !== slug)));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-light-surface rounded w-3/4 mb-4" />
        <div className="aspect-video bg-light-surface rounded mb-8" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-light-surface rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-light-muted text-lg mb-4">Post not found.</p>
        <Link href="/festivals" className="text-brand hover:text-brand-hover text-sm">
          ← Back to Festivals
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content */}
        <article className="lg:col-span-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-light-muted mb-6">
            <Link href="/festivals" className="hover:text-brand transition-colors">Festivals</Link>
            <span>→</span>
            {post.festivalTag && (
              <>
                <Link href={`/festivals?tag=${post.festivalTag}`} className="hover:text-brand transition-colors capitalize">
                  {post.festivalTag.replace(/-/g, " ")}
                </Link>
                <span>→</span>
              </>
            )}
            <span className="text-light-text line-clamp-1">{post.title}</span>
          </div>

          {/* Type badge */}
          <div className="mb-4">
            <span className={`${TYPE_COLOURS[post.type] || "bg-brand"} text-white text-xs font-medium px-2 py-1`}>
              {TYPE_LABELS[post.type] || post.type}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-light-text text-3xl font-bold leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          {post.publishedAt && (
            <p className="text-light-muted text-sm mb-6">
              {new Date(post.publishedAt).toLocaleDateString("en-IE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-light-text text-lg leading-relaxed mb-6 font-medium border-l-4 border-brand pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Cover image */}
          {post.coverImage && (
            <div className="aspect-video overflow-hidden mb-8">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Body */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-light-text prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-light-text prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-brand prose-a:no-underline hover:prose-a:underline
              prose-strong:text-light-text
              prose-blockquote:border-brand prose-blockquote:bg-light-surface prose-blockquote:px-4 prose-blockquote:py-2
              prose-ul:text-light-text prose-ol:text-light-text
              prose-li:mb-1
              prose-img:w-full prose-img:my-6
              prose-hr:border-light-border"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* Gallery */}
          {post.galleryImages && post.galleryImages.length > 0 && (
            <Gallery
              images={post.galleryImages}
              style={(post.galleryStyle as "MASONRY" | "GRID" | "SLIDESHOW") || "MASONRY"}
              siteName="MUSICSITE"
            />
          )}

          {/* Back link */}
          <div className="mt-12 pt-6 border-t border-light-border">
            <Link href="/festivals" className="text-brand hover:text-brand-hover text-sm transition-colors">
              ← Back to Festivals
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {related.length > 0 && (
            <div className="sticky top-24">
              <h3 className="text-light-text font-semibold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-light-border">
                More from this festival
              </h3>
              <div className="space-y-4">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/festivals/${p.slug}`}
                    className="group block"
                  >
                    {p.coverImage && (
                      <div className="aspect-video overflow-hidden mb-2">
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <span className={`${TYPE_COLOURS[p.type] || "bg-brand"} text-white text-xs font-medium px-1.5 py-0.5 mb-1 inline-block`}>
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                    <p className="text-light-text text-sm font-medium group-hover:text-brand transition-colors line-clamp-2">
                      {p.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
