import Link from "next/link";

export default function UnsubscribedPage() {
  return (
    <section className="bg-light-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-gray-900 text-2xl font-bold mb-4">
            You&apos;ve been unsubscribed
          </h1>
          <p className="text-gray-600 mb-8">
            You will no longer receive email updates from us. If you change your mind,
            you can always update your preferences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account/preferences"
              className="bg-brand hover:bg-brand-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Update Preferences
            </Link>
            <Link
              href="/"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
