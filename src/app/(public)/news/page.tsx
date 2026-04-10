"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  imageUrl: string | null;
  featured: boolean;
  publishedAt: string;
  sourceUrl: string;
  manual: boolean;
  tags: Array<{
    id: string;
    genre: { id: string; name: string };
  }>;
  rssFeed?: {
    id: string;
    name: string;
  };
}

function ShareButtons({ article }: { article: NewsArticle }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/news/${article.slug}` : "";
  const text = `Check out: ${article.title}`;
  
  // For most platforms, include both text and URL
  const twitterText = encodeURIComponent(`${text}\n\n${url}`);
  const facebookUrl = encodeURIComponent(url);
  const facebookText = encodeURIComponent(text);
  
  // WhatsApp uses a different format - just text parameter
  const whatsappText = encodeURIComponent(`${text}\n${url}`);
  
  // Bluesky
  const blueskyText = encodeURIComponent(`${text}\n\n${url}`);

  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-light-muted text-xs mr-1">Share:</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${facebookUrl}&quote=${facebookText}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-[#1877F2] transition-colors" title="Facebook">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${twitterText}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-black transition-colors" title="X">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-[#25D366] transition-colors" title="WhatsApp">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <a href={`https://bsky.app/intent/compose?text=${blueskyText}`} target="_blank" rel="noopener noreferrer" className="text-light-muted hover:text-[#0085FF] transition-colors" title="Bluesky">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.6 3.476 6.158 3.181-4.515.538-8.183 2.354-4.91 8.572.018.019 1.81-4.578 7.128-4.578h2c5.318 0 7.11 4.597 7.128 4.578 3.273-6.218-.395-8.034-4.91-8.572 2.558.295 5.374-.554 6.158-3.181.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C12.046 4.747 9.087 8.686 12 10.8z"/></svg>
      </a>
    </div>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  // Determine source label
  let sourceText = "";
  if (article.sourceLabel) {
    sourceText = article.sourceLabel;
  } else if (article.rssFeed) {
    sourceText = `via ${article.rssFeed.name}`;
  } else if (article.manual) {
    sourceText = "Manual";
  }

  return (
    <div className="bg-white border border-light-border hover:border-brand transition-colors overflow-hidden flex flex-col h-full relative group">
      {/* Main card content - clickable link */}
      <Link href={`/news/${article.slug}`} className="flex-1 flex flex-col">
        <div className="aspect-video bg-light-surface overflow-hidden relative">
          {article.imageUrl ? (
            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-surface">
              <span className="text-dark-muted text-4xl">♪</span>
            </div>
          )}
          {article.featured && (
            <div className="absolute top-2 left-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-brand text-white">Featured</span>
            </div>
          )}
          {sourceText && (
            <div className="absolute bottom-2 right-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/70 text-white whitespace-nowrap">{sourceText}</span>
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-lg leading-tight group-hover:text-brand transition-colors">{article.title}</h3>
          {article.summary && <p className="text-light-muted text-sm mt-2 line-clamp-2">{article.summary}</p>}
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-3 flex-wrap">
              {article.tags.map((tag) => (
                <span key={tag.id} className="text-xs bg-light-surface text-light-muted px-2 py-0.5 rounded">
                  {tag.genre.name}
                </span>
              ))}
            </div>
            <div className="text-light-muted text-xs">
              {new Date(article.publishedAt).toLocaleDateString("en-IE", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Share buttons - separate from link to avoid nested anchors */}
      <div className="p-4 border-t border-light-border">
        <ShareButtons article={article} />
      </div>
    </div>
  );
}

function MonthGroup({ month, articles, defaultOpen }: { month: string; articles: NewsArticle[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [y, m] = month.split("-");
  const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-IE", { month: "long", year: "numeric" });

  return (
    <div className="mb-8">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 w-full text-left mb-4 group">
        <svg className={`w-4 h-4 text-brand transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <h3 className="text-lg font-bold group-hover:text-brand transition-colors">{label}</h3>
        <span className="text-light-muted text-sm">({articles.length})</span>
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        // API returns array directly
        const newsArticles = Array.isArray(data) ? data : [];
        setArticles(newsArticles);
      })
      .catch((err) => {
        console.error("Failed to load news:", err);
        setArticles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = articles.filter((a) => a.featured);
  const regular = articles.filter((a) => !a.featured);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const months = useMemo(() => {
    const m = new Set<string>();
    articles.forEach((a) => {
      const d = new Date(a.publishedAt);
      m.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return [...m].sort().reverse();
  }, [articles]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, NewsArticle[]> = {};
    regular.forEach((a) => {
      const d = new Date(a.publishedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    // Sort each month by date descending
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [regular]);

  if (loading) {
    return (
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">News</h1>
          <p className="text-dark-muted mt-2">Loading news...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">News</h1>
          <p className="text-dark-muted mt-2">Latest music news, announcements and updates.</p>
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured Articles */}
          {featured.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-6"><span className="text-brand">Featured</span> News</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                {featured.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          {/* All Articles by Month */}
          {groupedByMonth.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-light-muted">No news articles yet.</p>
            </div>
          ) : (
            groupedByMonth.map(([month, monthArticles]) => (
              <MonthGroup key={month} month={month} articles={monthArticles} defaultOpen={month === currentMonthKey} />
            ))
          )}
        </div>
      </section>
    </>
  );
}
