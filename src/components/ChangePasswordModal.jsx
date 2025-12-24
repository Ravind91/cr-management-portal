import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Key } from 'lucide-react';

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const sessionResult = await window.storage.get('current:session').catch(() => null);
      if (sessionResult) {
        const sessionData = JSON.parse(sessionResult.value);
        setCurrentUser(sessionData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;
    const hasMaxLength = password.length <= 50;
    
    return {
      isValid: hasUpperCase && hasLowerCase && hasNumber && hasMinLength && hasMaxLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasMinLength,
      hasMaxLength
    };
  };

  const getPasswordStrength = (password) => {
    const validation = validatePassword(password);
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (validation.hasMinLength) strength += 25;
    if (validation.hasUpperCase) strength += 25;
    if (validation.hasLowerCase) strength += 25;
    if (validation.hasNumber) strength += 25;
    
    if (strength <= 25) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 50) return { strength, label: 'Fair', color: 'bg-orange-500' };
    if (strength <= 75) return { strength, label: 'Good', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Old Password validation
    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }

    // New Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.newPassword.length > 50) {
      newErrors.newPassword = 'Password must not exceed 50 characters';
    } else if (!validatePassword(formData.newPassword).isValid) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    // Check if new password is same as old password
    if (formData.newPassword && formData.oldPassword && formData.newPassword === formData.oldPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'User session not found. Please login again.' 
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const userKey = `user:${currentUser.email.toLowerCase()}`;
      
      // Get current user data
      const userResult = await window.storage.get(userKey).catch(() => null);
      
      if (!userResult) {
        setSubmitStatus({ 
          type: 'error', 
          message: 'User account not found.' 
        });
        setIsSubmitting(false);
        return;
      }

      const userData = JSON.parse(userResult.value);

      // Verify old password
      if (userData.password !== formData.oldPassword) {
        setErrors({ oldPassword: 'Current password is incorrect' });
        setSubmitStatus({ 
          type: 'error', 
          message: 'Current password is incorrect. Please try again.' 
        });
        setIsSubmitting(false);
        return;
      }

      // Update password
      userData.password = formData.newPassword;
      userData.passwordChangedAt = new Date().toISOString();

      // Save updated user data
      await window.storage.set(userKey, JSON.stringify(userData));

      setSubmitStatus({ 
        type: 'success', 
        message: 'Password changed successfully!' 
      });

      // Reset form
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      console.error('Error changing password:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Failed to change password. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <p className="text-sm text-blue-100">Update your account password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              submitStatus.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {submitStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <p className={`text-sm ${submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {submitStatus.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Password Fields */}
            <div className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.oldPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.oldPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.strength === 100 ? 'text-green-600' : 
                        passwordStrength.strength >= 75 ? 'text-yellow-600' : 
                        passwordStrength.strength >= 50 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Right Column - Password Requirements */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900">Password Requirements</p>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><span className="font-medium">Length:</span> Minimum 8 characters, maximum 50 characters</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><span className="font-medium">Uppercase:</span> At least one uppercase letter (A-Z)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><span className="font-medium">Lowercase:</span> At least one lowercase letter (a-z)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><span className="font-medium">Number:</span> At least one number (0-9)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span><span className="font-medium">Uniqueness:</span> Must be different from current password</span>
                  </li>
                </ul>

                <div className="mt-4 pt-4 border-t border-blue-300">
                  <p className="text-xs text-blue-700 italic">
                    💡 Tip: Use a combination of letters, numbers, and avoid common words for a stronger password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}