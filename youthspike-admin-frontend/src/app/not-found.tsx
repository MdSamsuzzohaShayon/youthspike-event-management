import Link from "next/link";

export default function Page404NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Animated illustration */}
        <div className="mb-8">
          <div className="relative mx-auto w-64 h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-yellow-600 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center">
                  <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-black">404</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0">
              <svg
                className="w-16 h-16 text-yellow-400 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Sorry, we couldn't find the page you're looking for. It may have been
          moved, deleted, or the URL was entered incorrectly.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors duration-300 shadow-md hover:shadow-yellow-500/50"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
