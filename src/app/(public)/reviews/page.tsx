import { prisma } from "@/lib/db";
import Link from "next/link";
import ShareButtons from "@/components/reviews/ShareButtons";

export const metadata = {
  title: "Reviews - MusicSite",
  description: "Concert reviews and photo galleries",
};

async function getReviews() {
  return prisma.review.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      photos: { orderBy: { sortOrder: "asc" }, take: 1 },
      publicReviews: true,
    },
  });
}

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <>
      <section className="bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-dark-text text-3xl md:text-4xl font-bold">Concert Reviews</h1>
          <p className="text-dark-muted mt-2">Live music reviews and photography from gigs across Ireland.</p>
        </div>
      </section>

      <section className="bg-light-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {reviews.map((review) => {
              const avgScore =
                review.publicReviews.length > 0
                  ? (
                      review.publicReviews.reduce((sum, r) => sum + r.score, 0) /
                      review.publicReviews.length
                    ).toFixed(1)
                  : null;

              return (
                <div
                  key={review.id}
                  className="bg-white border border-light-border hover:border-brand transition-colors overflow-hidden flex flex-col"
                >
                  <Link href={`/reviews/${review.slug}`} className="group">
                    {/* Photo or placeholder */}
                    <div className="aspect-video bg-dark-surface overflow-hidden">
                      {review.coverImage ? (
                        <img
                          src={review.coverImage}
                          alt={review.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : review.photos[0] ? (
                        <img
                          src={review.photos[0].url}
                          alt={review.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-dark-muted text-4xl">{"\u266A"}</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col">
                    <Link href={`/reviews/${review.slug}`} className="group">
                      <span className="text-brand text-xs font-medium tracking-widest uppercase">
                        Review
                      </span>
                      <h2 className="text-lg font-bold mt-1 group-hover:text-brand transition-colors">
                        {review.title}
                      </h2>
                    </Link>

                    <p className="text-light-muted text-sm mt-1">
                      {review.artist} {"\u2014"} {review.venue}, {review.city}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-light-muted text-xs">
                        {new Date(review.eventDate).toLocaleDateString("en-IE", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      {avgScore && (
                        <span className="bg-brand text-white text-xs font-bold px-2 py-1">
                          {avgScore}/10
                        </span>
                      )}
                      {review.publicReviews.length > 0 && (
                        <span className="text-light-muted text-xs">
                          {review.publicReviews.length} user review{review.publicReviews.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <p className="text-light-muted text-sm mt-3 line-clamp-3">
                      {review.body.substring(0, 180)}...
                    </p>

                    <div className="mt-auto pt-4">
                      <ShareButtons
                        title={review.title}
                        artist={review.artist}
                        venue={review.venue}
                        date={review.eventDate.toISOString()}
                        slug={review.slug}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
