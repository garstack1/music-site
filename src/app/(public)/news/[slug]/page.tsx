import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

// Clean up special characters that might be stored incorrectly in database
function cleanSpecialCharacters(text: string): string {
  return text
    .replace(/[""]/g, '"')      // Smart quotes → straight quote
    .replace(/['']/g, "'")      // Smart apostrophes → straight apostrophe
    .replace(/–/g, "-")         // En dash → hyphen
    .replace(/—/g, "-")         // Em dash → hyphen
    .replace(/…/g, "...");      // Ellipsis → three dots
}

async function getArticle(slug: string) {
  return prisma.newsArticle.findUnique({
    where: { slug },
    include: {
      rssFeed: true,
      tags: { include: { genre: true } },
    },
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/news" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
            ← Back to News
          </Link>
          <div className="flex items-center gap-3 mt-6">
            {article.tags.map((tag) => (
              <span key={tag.id} className="text-xs bg-brand text-white px-2 py-1">
                {tag.genre.name}
              </span>
            ))}
          </div>
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold mt-3">
            {cleanSpecialCharacters(article.title)}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-dark-muted text-sm">
            <span>
              {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            {article.rssFeed && <span>via {article.rssFeed.name}</span>}
          </div>
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {article.imageUrl && (
            <div className="aspect-video bg-light-surface overflow-hidden mb-8">
              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}
          {article.summary && (
            <p className="text-lg text-light-muted mb-6 leading-relaxed italic">
              {cleanSpecialCharacters(article.summary)}
            </p>
          )}
          {article.body && (
            <div className="prose prose-invert max-w-none">
              {article.body.split("\n").map((line, i) => {
                // Clean the line of special characters
                const cleanedLine = cleanSpecialCharacters(line);
                
                // Skip empty lines but preserve them visually
                if (!cleanedLine.trim()) {
                  return <div key={i} className="h-2" />;
                }
                
                // Check if line is a YouTube link - render as embed
                const youtubeMatch = cleanedLine.match(/(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
                if (youtubeMatch) {
                  return (
                    <div key={i} className="my-6 rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="400"
                        src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full"
                      />
                    </div>
                  );
                }
                
                // Check if line is part of a list
                if (cleanedLine.trim().startsWith("•")) {
                  return (
                    <div key={i} className="flex gap-3 text-light-text leading-relaxed mb-2">
                      <span className="text-brand">•</span>
                      <span>{cleanedLine.substring(1).trim()}</span>
                    </div>
                  );
                }
                
                // Check if line looks like a bold heading (common in press releases)
                if (cleanedLine === cleanedLine.toUpperCase() && cleanedLine.length > 5 && cleanedLine.length < 100) {
                  return (
                    <h3 key={i} className="text-lg font-bold text-light-text mt-4 mb-2">
                      {cleanedLine}
                    </h3>
                  );
                }
                
                return (
                  <p key={i} className="text-light-text leading-relaxed mb-4">
                    {cleanedLine}
                  </p>
                );
              })}
            </div>
          )}
          {article.sourceUrl && article.sourceUrl !== "https://example.com" && (
            <a
            
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 text-brand hover:text-brand-hover text-sm font-medium transition-colors"
            >
              Read original article →
            </a>
          )}
        </div>
      </section>
    </>
  );
}
