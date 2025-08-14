import React from 'react';
import Navbar from './Navbar';

const ProfilePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Navbar />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Profile Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Profile Information</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-white">
              JD
            </div>
            <button className="text-blue-500 hover:underline text-sm">✏️ Edit</button>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Name" className="w-full border rounded px-4 py-2" />
            <input type="email" placeholder="Email" className="w-full border rounded px-4 py-2" />
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Phone" className="w-full border rounded px-4 py-2" />
              <button className="text-blue-500 text-sm hover:underline">Verify</button>
            </div>
            <div className="text-sm mt-4">
              <span className="bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Premium User
              </span>
              <p className="text-xs text-gray-500 mt-1">Renews: Jan 15, 2026</p>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Security & Privacy</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <p>Change Password</p>
              <button className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600">
                Change Password
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p>Two-Factor Authentication</p>
              <p className="text-blue-600 hover:underline cursor-pointer">Enable</p>
            </div>
            <div className="flex items-center justify-between">
              <p>Connected Devices</p>
              <p className="text-blue-600 hover:underline cursor-pointer">Show Devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
