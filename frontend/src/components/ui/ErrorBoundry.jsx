import { useRouteError, Link } from 'react-router-dom';

export default function ErrorBoundary() {
    const error = useRouteError();
    console.error("Caught by ErrorBoundary:", error);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-[#0F1117] rounded-xl border border-[#1F2A40] m-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#E2E8F0] mb-2">Oops! Something went wrong.</h1>

            <p className="text-[#94A3B8] mb-6 max-w-md">
                {error.statusText || error.message || "An unexpected error occurred while loading this page."}
            </p>

            <Link
                to="/"
                className="px-6 py-2.5 bg-[#3B72F6] hover:bg-[#2563EB] text-white rounded-lg font-semibold transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    );
}