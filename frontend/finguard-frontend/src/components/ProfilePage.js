import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';
import { jwtDecode } from 'jwt-decode';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import SessionStatus from './SessionStatus';

const ProfilePage = () => {
  const { isDarkMode } = useTheme();
  const [userProfile, setUserProfile] = useState({
    id: '',
    username: '',
    email: '',
    role: '',
    phone: '',
    is_banned: false,
    profile_photo: null
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
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [loadingTwoFA, setLoadingTwoFA] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
          phone: profileData.profile.phone || '', // Add phone if it exists in DB
          profile_photo: profileData.profile.profile_photo || null
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

  // Fetch 2FA status
  const fetch2FAStatus = async () => {
    setLoadingTwoFA(true);
    try {
      const twoFAData = await apiCall('/api/2fa/status');
      if (twoFAData) {
        setTwoFAStatus(twoFAData);
      } else {
        // If API call fails, set default status
        setTwoFAStatus({ enabled: false, backup_codes_remaining: 0, last_used: null });
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      // Set default status on error
      setTwoFAStatus({ enabled: false, backup_codes_remaining: 0, last_used: null });
    } finally {
      setLoadingTwoFA(false);
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

  // Handle profile photo selection
  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Upload profile photo
  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    setUploadingPhoto(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profile_photo', photoFile);

      const token = getToken();
      const response = await fetch('http://localhost:5000/api/user/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${errorData}`);
      }

      const data = await response.json();
      
      setSuccess('Profile photo updated successfully!');
      setPhotoFile(null);
      setPhotoPreview(null);
      
      // Refetch profile data to get the updated photo
      await fetchUserProfile();

    } catch (error) {
      console.error('Photo upload error:', error);
      setError('Failed to upload photo: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove profile photo
  const handlePhotoRemove = async () => {
    setUploadingPhoto(true);
    setError('');

    try {
      const response = await apiCall('/api/user/remove-photo', {
        method: 'DELETE'
      });

      if (response) {
        setSuccess('Profile photo removed successfully!');
        // Refetch profile data to get the updated state
        await fetchUserProfile();
      }
    } catch (error) {
      setError('Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchUserProfile();
    fetch2FAStatus();
  }, []);

  // Add listener for when user returns to this page (e.g., from 2FA setup)
  useEffect(() => {
    const handleFocus = () => {
      // Refresh 2FA status when page regains focus
      fetch2FAStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
      <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 transition-colors duration-300 ${
        type === 'error' 
          ? (isDarkMode ? 'bg-red-900 text-red-200 border border-red-800' : 'bg-red-100 text-red-800 border border-red-200')
          : (isDarkMode ? 'bg-green-900 text-green-200 border border-green-800' : 'bg-green-100 text-green-800 border border-green-200')
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
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen transition-colors ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <Navbar />
        
        {/* Messages */}
        <MessageAlert message={error} type="error" />
        <MessageAlert message={success} type="success" />

        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Profile Info */}
          <div className={`p-6 rounded-lg shadow border transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Profile Information</h2>
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className={`mt-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Loading profile...</p>
              </div>
            )}

            {!loading && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative group">
                    {/* Profile Photo or Initials */}
                    {userProfile.profile_photo || photoPreview ? (
                      <img 
                        src={photoPreview || (userProfile.profile_photo ? `http://localhost:5000${userProfile.profile_photo}` : null)} 
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className={`w-20 h-20 ${profilePic.bgColor} rounded-full flex items-center justify-center text-xl font-bold text-white border-2 border-gray-200`}>
                        {initials}
                      </div>
                    )}
                    
                    {/* Photo Upload Controls */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <label className="cursor-pointer text-white text-xs font-medium hover:text-blue-200">
                        📷 Change
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoSelect}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-blue-500 hover:underline text-sm flex items-center gap-1"
                      >
                        ✏️ {isEditing ? 'Cancel' : 'Edit Profile'}
                      </button>
                    </div>

                    {/* Photo Upload/Remove Buttons */}
                    {photoFile && (
                      <div className="flex gap-2">
                        <button
                          onClick={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50 flex items-center gap-1"
                        >
                          {uploadingPhoto && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                          {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
                        </button>
                        <button
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {userProfile.profile_photo && !photoFile && (
                      <button
                        onClick={handlePhotoRemove}
                        disabled={uploadingPhoto}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded disabled:opacity-50 flex items-center gap-1 w-fit"
                      >
                        {uploadingPhoto && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                        {uploadingPhoto ? 'Removing...' : 'Remove Photo'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={userProfile.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full border rounded px-4 py-2 transition-colors ${
                        !isEditing 
                          ? (isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900')
                          : (isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500')
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={userProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full border rounded px-4 py-2 transition-colors ${
                        !isEditing 
                          ? (isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900')
                          : (isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500')
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
                      <input 
                        type="text" 
                        placeholder="Phone Number" 
                        value={userProfile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full border rounded px-4 py-2 transition-colors ${
                        !isEditing 
                          ? (isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900')
                          : (isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500')
                      }`}
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
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
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

          {/* Theme Settings */}
          <div className={`p-6 rounded-lg shadow border transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Theme</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Choose your preferred theme. Dark mode reduces eye strain in low-light conditions.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {isDarkMode ? 'Dark' : 'Light'}
                  </span>
                  <ThemeToggle variant="switch" size="lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Session Management */}
          <SessionStatus />

          {/* Security */}
          <div className={`p-6 rounded-lg shadow border transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Security & Privacy</h2>
            <div className={`space-y-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                <div>
                  <p>Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {loadingTwoFA ? 'Loading...' : 
                     twoFAStatus?.enabled ? 'Extra security enabled' : 'Add extra security to your account'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {loadingTwoFA ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (twoFAStatus?.enabled === true) ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        ✓ Enabled
                      </span>
                      <button 
                        onClick={() => window.location.href = '/2fa-setup'}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Manage
                      </button>
                      <button 
                        onClick={fetch2FAStatus}
                        className="text-gray-500 hover:text-gray-700 text-xs"
                        title="Refresh 2FA status"
                      >
                        🔄
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => window.location.href = '/2fa-setup'}
                      className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 font-medium"
                    >
                      Enable 2FA
                    </button>
                  )}
                </div>
              </div>
              {!loadingTwoFA && twoFAStatus?.enabled && (
                <div className="ml-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Backup codes remaining: {twoFAStatus.backup_codes_remaining}</div>
                  <div>Last used: {twoFAStatus.last_used ? new Date(twoFAStatus.last_used).toLocaleDateString() : 'Never'}</div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p>Account ID</p>
                <p className="text-gray-600 dark:text-gray-400 font-mono text-xs">#{userProfile.id}</p>
              </div>
              <div className="flex items-center justify-between">
                <p>Account Created</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Registration Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg w-[400px] max-h-[90vh] overflow-y-auto border transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Change Password</h2>
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
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    className={`w-full border p-3 rounded-lg transition-colors focus:ring-green-500 focus:border-green-500 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    className={`w-full border p-3 rounded-lg transition-colors focus:ring-green-500 focus:border-green-500 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    className={`w-full border p-3 rounded-lg transition-colors focus:ring-green-500 focus:border-green-500 ${
                      isDarkMode 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
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