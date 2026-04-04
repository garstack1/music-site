import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-dark-bg border-t border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="text-dark-text text-lg font-semibold tracking-wider">
              MUSIC<span className="text-brand">SITE</span>
            </span>
            <p className="text-dark-muted text-sm mt-2">
              Music news, events and concert reviews.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-dark-text text-sm font-medium mb-3">Navigate</h3>
            <div className="flex flex-col gap-2">
              <Link href="/news" className="text-dark-muted hover:text-dark-text text-sm transition-colors">News</Link>
              <Link href="/events" className="text-dark-muted hover:text-dark-text text-sm transition-colors">Events</Link>
              <Link href="/reviews" className="text-dark-muted hover:text-dark-text text-sm transition-colors">Reviews</Link>
            </div>
          </div>

          {/* Events */}
          <div>
            <h3 className="text-dark-text text-sm font-medium mb-3">Discover</h3>
            <div className="flex flex-col gap-2">
              <Link href="/events?type=concert" className="text-dark-muted hover:text-dark-text text-sm transition-colors">Concerts</Link>
              <Link href="/events?type=festival" className="text-dark-muted hover:text-dark-text text-sm transition-colors">Festivals</Link>
              <Link href="/search" className="text-dark-muted hover:text-dark-text text-sm transition-colors">Search</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-border mt-8 pt-8 text-center">
          <p className="text-dark-muted text-xs">
            &copy; {new Date().getFullYear()} MusicSite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
