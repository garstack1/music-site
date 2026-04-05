import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicReviewForm from "@/components/reviews/PublicReviewForm";

async function getReview(slug: string) {
  return prisma.review.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      publicReviews: {
        where: { approved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function isPublicReviewsEnabled() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "public_reviews_enabled" },
  });
  return setting?.value === "true";
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [review, reviewsEnabled] = await Promise.all([
    getReview(slug),
    isPublicReviewsEnabled(),
  ]);

  if (!review) notFound();

  const avgScore =
    review.publicReviews.length > 0
      ? (
          review.publicReviews.reduce((sum, r) => sum + r.score, 0) /
          review.publicReviews.length
        ).toFixed(1)
      : null;

  return (
    <>
      {/* Hero */}
      <section className="bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/reviews" className="text-dark-muted hover:text-dark-text text-sm transition-colors">
            {"<-"} Back to Reviews
          </Link>
          <span className="block text-brand text-xs font-medium tracking-widest uppercase mt-6">
            Concert Review
          </span>
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold mt-2">
            {review.title}
          </h1>
          <div className="text-dark-muted text-sm mt-4 space-y-1">
            <p className="text-lg text-dark-text">{review.artist}</p>
            <p>{review.venue}, {review.city}</p>
            <p>
              {new Date(review.eventDate).toLocaleDateString("en-IE", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          {avgScore && (
            <div className="flex items-center gap-3 mt-4">
              <span className="bg-brand text-white text-lg font-bold px-3 py-1">
                {avgScore}/10
              </span>
              <span className="text-dark-muted text-sm">
                from {review.publicReviews.length} user review{review.publicReviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Photo Gallery */}
          {review.photos.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {review.photos.map((photo) => (
                  <div key={photo.id} className="aspect-square bg-light-surface overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption || review.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Body */}
          <div className="prose max-w-none">
            {review.body.split("\n\n").map((para, i) => (
              <p key={i} className="text-light-text leading-relaxed mb-4 text-lg">
                {para}
              </p>
            ))}
          </div>

          {/* Setlist */}
          {review.setlist && (
            <div className="mt-10 bg-light-surface p-6 border border-light-border">
              <h2 className="text-lg font-bold mb-3">Setlist</h2>
              <ol className="list-decimal list-inside space-y-1 text-light-muted">
                {review.setlist.split(",").map((song, i) => (
                  <li key={i} className="text-sm">{song.trim()}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Public Reviews */}
          <div className="mt-10">
            <h2 className="text-lg font-bold mb-6">
              User Reviews
              {review.publicReviews.length === 0 && reviewsEnabled && (
                <span className="text-light-muted text-sm font-normal ml-2">
                  No reviews yet — be the first!
                </span>
              )}
            </h2>
            <div className="space-y-4">
              {review.publicReviews.map((pr) => (
                <div key={pr.id} className="border-b border-light-border pb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-brand text-white text-xs font-bold px-2 py-1">
                      {pr.score}/10
                    </span>
                    <span className="font-medium text-sm">{pr.user.name || "Anonymous"}</span>
                    <span className="text-light-muted text-xs">
                      {new Date(pr.createdAt).toLocaleDateString("en-IE", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                  {pr.text && (
                    <p className="text-light-muted text-sm mt-2">{pr.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Review Form */}
          <PublicReviewForm slug={slug} enabled={reviewsEnabled} />
        </div>
      </section>
    </>
  );
}
