import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Admin Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="text-dark-text text-sm font-semibold tracking-wider">
                MUSIC<span className="text-brand">SITE</span>
                <span className="text-dark-muted ml-2 text-xs font-normal">Admin</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/admin" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/news" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  News
                </Link>
                <Link href="/admin/import-email" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  PR Import
                </Link>
                <Link href="/admin/email-monitor" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Email Monitor
                </Link>
                <Link href="/admin/events" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Events
                </Link>
                <Link href="/admin/reviews" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Reviews
                </Link>
                <Link href="/admin/competitions" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Competitions
                </Link>
                <Link href="/admin/feeds" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  RSS Feeds
                </Link>
                <Link href="/admin/csv-sources" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  CSV Sources
                </Link>
                <Link href="/admin/subscribers" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Subscribers
                </Link>
                <Link href="/admin/moderation" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Moderation
                </Link>
                <Link href="/admin/settings" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-dark-muted hover:text-dark-text text-xs transition-colors">
                View Site →
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
