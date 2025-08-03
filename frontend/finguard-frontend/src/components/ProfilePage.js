import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import { jwtDecode } from 'jwt-decode';

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState({
    id: '',
    username: '',
    email: '',
    role: '',
    phone: '',
    is_banned: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Get token for API calls
  const getToken = () => localStorage.getItem('finguard-token');

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getToken();
    if (!token) {
      setError('Please login to continue');
      return null;
    }

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      setError(`Failed to ${options.method || 'fetch'} data: ${error.message}`);
      return null;
    }
  };

  // Generate profile picture based on username
  const generateProfilePicture = (username) => {
    if (!username) return '👤';
    
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Use username length to pick a consistent color
    const colorIndex = username.length % colors.length;
    const bgColor = colors[colorIndex];
    
    return { letter: firstLetter, bgColor };
  };

  // Get user initials for profile picture
  const getUserInitials = (username, email) => {
    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    } else if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const profileData = await apiCall('/api/user/profile');
      if (profileData && profileData.profile) {
        setUserProfile({
          ...profileData.profile,
          phone: profileData.profile.phone || '' // Add phone if it exists in DB
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to token data if API fails
      const token = getToken();
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUserProfile({
            id: decoded.userId,
            username: decoded.username || '',
            email: decoded.email || '',
            role: decoded.role || 'User',
            phone: '',
            is_banned: false
          });
        } catch (err) {
          setError('Failed to load profile data');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!userProfile.username || !userProfile.email) {
      setError('Username and email are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          username: userProfile.username,
          email: userProfile.email,
          phone: userProfile.phone
        })
      });

      if (response) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        
        // Update token if username/email changed
        // Note: You might want to refresh the token on the backend
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Current password and new password are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiCall('/api/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response) {
        setSuccess('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-500 text-white';
      case 'Premium User': return 'bg-yellow-400 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  // Get subscription renewal date (mock for now)
  const getSubscriptionRenewal = (role) => {
    if (role === 'Premium User') {
      return 'Jan 15, 2026';
    } else if (role === 'Admin') {
      return 'Permanent';
    }
    return 'Free Plan';
  };

  const profilePic = generateProfilePicture(userProfile.username);
  const initials = getUserInitials(userProfile.username, userProfile.email);

  // Message Alert Component
  const MessageAlert = ({ message, type }) => {
    if (!message) return null;
    
    return (
      <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
        type === 'error' 
          ? 'bg-red-100 text-red-800 border border-red-200' 
          : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        <span className="flex-shrink-0">
          {type === 'error' ? '⚠️' : '✅'}
        </span>
        <span className="flex-1">{message}</span>
      </div>
    );
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />
        
        {/* Messages */}
        <MessageAlert message={error} type="error" />
        <MessageAlert message={success} type="success" />

        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Profile Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Profile Information</h2>
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading profile...</p>
              </div>
            )}

            {!loading && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 ${profilePic.bgColor} rounded-full flex items-center justify-center text-xl font-bold text-white`}>
                    {initials}
                  </div>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-500 hover:underline text-sm flex items-center gap-1"
                  >
                    ✏️ {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={userProfile.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full border rounded px-4 py-2 ${!isEditing ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={userProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full border rounded px-4 py-2 ${!isEditing ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="text" 
                        placeholder="Phone Number" 
                        value={userProfile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full border rounded px-4 py-2 ${!isEditing ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                      />
                    </div>
                    {!isEditing && (
                      <button className="text-blue-500 text-sm hover:underline mt-6">Verify</button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          fetchUserProfile(); // Reset to original data
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="text-sm mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(userProfile.role)}`}>
                      {userProfile.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {userProfile.role === 'Premium User' ? 'Renews: ' : 'Plan: '}{getSubscriptionRenewal(userProfile.role)}
                    </p>
                    {userProfile.is_banned && (
                      <p className="text-red-600 text-xs mt-1">⚠️ Account Status: Restricted</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Security */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Security & Privacy</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <p>Change Password</p>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
                >
                  Change Password
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p>Two-Factor Authentication</p>
                <p className="text-blue-600 hover:underline cursor-pointer">Enable (Coming Soon)</p>
              </div>
              <div className="flex items-center justify-between">
                <p>Account ID</p>
                <p className="text-gray-600 font-mono text-xs">#{userProfile.id}</p>
              </div>
              <div className="flex items-center justify-between">
                <p>Account Created</p>
                <p className="text-gray-600 text-xs">Registration Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[400px] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Change Password</h2>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-green-500 focus:border-green-500"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default ProfilePage;