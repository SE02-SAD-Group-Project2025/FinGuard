import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import AnimatedPage from './AnimatedPage';

const TwoFactorSetup = () => {
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Complete
  const [qrCode, setQrCode] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [twoFAStatus, setTwoFAStatus] = useState(null);

  useEffect(() => {
    checkTwoFAStatus();
  }, []);

  const checkTwoFAStatus = async () => {
    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/2fa/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('2FA status fetch failed:', response.status);
        setTwoFAStatus({ enabled: false, backup_codes_remaining: 0, last_used: null });
        return;
      }
      
      const data = await response.json();
      setTwoFAStatus(data);
    } catch (err) {
      console.error('Error checking 2FA status:', err);
      setTwoFAStatus({ enabled: false, backup_codes_remaining: 0, last_used: null });
    }
  };

  const initiate2FASetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qr_code);
        setManualKey(data.manual_entry_key);
        setBackupCodes(data.backup_codes);
        setStep(2);
      } else {
        setError(data.error || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationCode })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
        checkTwoFAStatus(); // Refresh status
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async (password, token) => {
    setLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, token })
      });

      const data = await response.json();

      if (response.ok) {
        checkTwoFAStatus(); // Refresh status
        setStep(1);
      } else {
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  // Generate new backup codes
  const generateBackupCodes = async (password) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('finguard-token');
      const response = await fetch('http://localhost:5000/api/2fa/backup-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`New backup codes generated:\n\n${data.backup_codes.join('\n')}\n\nPlease save these codes in a secure location.`);
        checkTwoFAStatus(); // Refresh status
      } else {
        setError(data.error || 'Failed to generate backup codes');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (twoFAStatus === null) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar />
          <div className="max-w-2xl mx-auto p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading 2FA status...</p>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // If 2FA is already enabled, show management interface
  if (twoFAStatus.enabled) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar />
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication Enabled</h2>
                <p className="text-gray-600 mt-2">Your account is secured with 2FA</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Backup Codes Remaining</span>
                    <span className="font-semibold text-gray-900">{twoFAStatus.backup_codes_remaining}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Last Used</span>
                    <span className="text-sm text-gray-600">
                      {twoFAStatus.last_used ? new Date(twoFAStatus.last_used).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={async () => {
                    const password = prompt('Enter your password to generate new backup codes:');
                    if (password) {
                      await generateBackupCodes(password);
                      // Force refresh the 2FA status after generating backup codes
                      checkTwoFAStatus();
                    }
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate New Backup Codes
                </button>
                
                <button
                  onClick={async () => {
                    const password = prompt('Enter your password to disable 2FA:');
                    const token = prompt('Enter a verification code from your authenticator app:');
                    if (password && token) {
                      await disable2FA(password, token);
                      // Force refresh the 2FA status after disable
                      checkTwoFAStatus();
                    }
                  }}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Disable Two-Factor Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Main setup flow
  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navbar />
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Setup Instructions */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 9a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Set up Two-Factor Authentication</h2>
                  <p className="text-gray-600 mt-2">Add an extra layer of security to your FinGuard account</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-semibold text-blue-600">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Download an authenticator app</h3>
                      <p className="text-gray-600 text-sm">Get Google Authenticator, Authy, or any compatible TOTP app from your app store</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Scan QR code or enter setup key</h3>
                      <p className="text-gray-600 text-sm">Use your authenticator app to scan the QR code we'll provide</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-semibold text-blue-600">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Verify with a code</h3>
                      <p className="text-gray-600 text-sm">Enter the 6-digit code from your app to complete setup</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={initiate2FASetup}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Start Setup'}
                </button>
              </div>
            )}

            {/* Step 2: QR Code and Manual Entry */}
            {step === 2 && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
                  <p className="text-gray-600 mt-2">Use your authenticator app to scan this code</p>
                </div>

                {qrCode && (
                  <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                  </div>
                )}

                {manualKey && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Can't scan? Enter this key manually:</h3>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <code className="text-sm font-mono break-all">{manualKey}</code>
                      <button
                        onClick={() => copyToClipboard(manualKey)}
                        className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter the 6-digit code from your authenticator app:
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                    maxLength="6"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={verify2FA}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </button>
                  
                  <button
                    onClick={() => setStep(1)}
                    className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success and Backup Codes */}
            {step === 3 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">2FA Successfully Enabled!</h2>
                  <p className="text-gray-600 mt-2">Your account is now secured with two-factor authentication</p>
                </div>

                {backupCodes && backupCodes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">🔑 Save Your Backup Codes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-3">
                        These backup codes can be used to access your account if you lose your authenticator device.
                        Store them in a safe place - each code can only be used once.
                      </p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="bg-white p-2 rounded border text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => copyToClipboard(backupCodes.join('\n'))}
                        className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Copy All Backup Codes
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Important Reminders:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Keep your authenticator app synced and backed up</li>
                    <li>• Store your backup codes in a secure location</li>
                    <li>• You'll need a code from your app or a backup code to sign in</li>
                  </ul>
                </div>

                <button
                  onClick={() => window.location.href = '/profile'}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default TwoFactorSetup;