"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminInitPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const router = useRouter();

    const handleInit = async () => {
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch("/api/admin/init");
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                error: "Failed to initialize admin users",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-4">Admin Role Initialization</h1>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">What does this do?</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>This will update the database to add <code className="bg-blue-100 px-1 rounded">role: "admin"</code> field for users specified in your <code className="bg-blue-100 px-1 rounded">ADMIN_EMAILS</code> environment variable.</p>
                                <p className="mt-2">Currently, you can access admin pages because your email is in <code className="bg-blue-100 px-1 rounded">ADMIN_EMAILS</code>, but the role field in database shows "user". This will fix that.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Current Status:</h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>✅ You have access to admin panel (via ADMIN_EMAILS check)</li>
                        <li>⚠️ Database role field shows "user" (not yet updated)</li>
                        <li>🎯 After initialization: Database will show "admin"</li>
                    </ul>
                </div>

                {!result && (
                    <button
                        onClick={handleInit}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Initializing...
                            </span>
                        ) : (
                            "🚀 Initialize Admin Roles"
                        )}
                    </button>
                )}

                {result && (
                    <div className="mt-6">
                        {result.success ? (
                            <div className="bg-green-50 border-l-4 border-green-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">{result.message}</h3>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p><strong>Summary:</strong></p>
                                            <ul className="mt-1 space-y-1">
                                                <li>✅ Updated: {result.summary.updated}</li>
                                                <li>ℹ️ Already Admin: {result.summary.alreadyAdmin}</li>
                                                <li>⚠️ Not Found: {result.summary.notFound}</li>
                                                {result.summary.errors > 0 && <li>❌ Errors: {result.summary.errors}</li>}
                                            </ul>
                                        </div>

                                        {result.details && result.details.length > 0 && (
                                            <div className="mt-4">
                                                <p className="font-semibold">Details:</p>
                                                <ul className="mt-2 space-y-1">
                                                    {result.details.map((item: any, idx: number) => (
                                                        <li key={idx} className="text-sm">
                                                            {item.email || item.userId}: {item.message}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {result.instructions && (
                                            <div className="mt-4 space-y-2">
                                                {result.instructions.success && (
                                                    <p className="text-green-700 font-semibold">{result.instructions.success}</p>
                                                )}
                                                {result.instructions.notFound && (
                                                    <p className="text-yellow-700">{result.instructions.notFound}</p>
                                                )}
                                                {result.instructions.nextStep && (
                                                    <p className="text-blue-700">{result.instructions.nextStep}</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-4 space-x-4">
                                            <button
                                                onClick={() => router.push("/admin/users")}
                                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                View User Management
                                            </button>
                                            <button
                                                onClick={() => router.push("/admin")}
                                                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                            >
                                                Back to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{result.error}</p>
                                            {result.details && <p className="mt-1 text-xs">{result.details}</p>}
                                            {result.message && <p className="mt-2">{result.message}</p>}
                                            {result.example && (
                                                <p className="mt-2">
                                                    <strong>Example:</strong> <code className="bg-red-100 px-1 rounded">{result.example}</code>
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setResult(null)}
                                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">ℹ️ How it works:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                        <li>Reads <code className="bg-gray-200 px-1 rounded">ADMIN_EMAILS</code> from your .env file</li>
                        <li>Finds users in database matching those emails</li>
                        <li>Updates their <code className="bg-gray-200 px-1 rounded">role</code> field to "admin"</li>
                        <li>Now the database shows correct role in user management</li>
                    </ol>
                    <p className="mt-3 text-sm text-gray-600">
                        <strong>Note:</strong> You only need to run this once. After initialization, the role will be stored in the database permanently.
                    </p>
                </div>
            </div>
        </div>
    );
}

