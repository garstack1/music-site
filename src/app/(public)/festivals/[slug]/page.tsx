import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import GallerySection from "@/components/GallerySection";
import RelatedPosts from "@/components/RelatedPosts";


interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.editorialPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      festivalTag: true,
      type: true,
    },
  });

  if (!post) return { title: "Not Found" };

  const siteUrl = process.env.NEXTAUTH_URL || "https://music-site-sigma.vercel.app";

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: `${siteUrl}/festivals/${slug}`,
      type: "article",
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
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

export default async function FestivalPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await prisma.editorialPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      galleryImages: { orderBy: { order: "asc" } },
    },
  });

  if (!post) notFound();


  // Fetch related posts — same festival tag first, fill with recent if needed
  const taggedRelated = post.festivalTag
    ? await prisma.editorialPost.findMany({
        where: {
          festivalTag: post.festivalTag,
          status: "PUBLISHED",
          NOT: { slug },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
        },
        take: 3,
      })
    : [];

  // Count total tagged posts to know if we need a "see all" link
  const totalTagged = post.festivalTag
    ? await prisma.editorialPost.count({
        where: {
          festivalTag: post.festivalTag,
          status: "PUBLISHED",
          NOT: { slug },
        },
      })
    : 0;

  const related = taggedRelated.length >= 3
    ? taggedRelated
    : [
        ...taggedRelated,
        ...(await prisma.editorialPost.findMany({
          where: {
            status: "PUBLISHED",
            NOT: {
              slug: {
                in: [slug, ...taggedRelated.map((p) => p.slug)],
              },
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
          },
          orderBy: { publishedAt: "desc" },
          take: 3 - taggedRelated.length,
        })),
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Main content */}
        <article className="lg:col-span-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-light-muted mb-6">
            <Link href="/festivals" className="hover:text-brand transition-colors">
              Festivals
            </Link>
            <span>→</span>
            {post.festivalTag && (
              <>
                <Link
                  href={`/festivals?tag=${post.festivalTag}`}
                  className="hover:text-brand transition-colors capitalize"
                >
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
            <GallerySection
              images={post.galleryImages}
              style={(post.galleryStyle as "MASONRY" | "GRID" | "SLIDESHOW") || "MASONRY"}
              galleryArtist={post.galleryArtist || undefined}
              galleryVenue={post.galleryVenue || undefined}
              galleryEvent={post.galleryEvent || undefined}
            />
          )}

          {/* Related posts */}
          <RelatedPosts
            posts={related}
            title={post.festivalTag
              ? `More from ${post.festivalTag.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`
              : "Related Content"}
            seeAllLink={totalTagged >= 3 && post.festivalTag
              ? `/festivals?tag=${post.festivalTag}`
              : undefined}
            seeAllLabel={totalTagged >= 3
              ? `See all ${totalTagged + 1} articles`
              : undefined}
          />

          {/* Back link */}
          <div className="mt-12 pt-6 border-t border-light-border">
            <Link href="/festivals" className="text-brand hover:text-brand-hover text-sm transition-colors">
              ← Back to Festivals
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
