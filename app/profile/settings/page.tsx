export default function ProfileSettingsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Delete Account</h2>
                <p className="text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                </p>

                <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
                    Delete My Account
                </button>
            </div>
        </div>
    );
}

