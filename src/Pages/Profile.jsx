import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confPassword: ''
  });

  // Fetch current user profile
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      const userData = response.data.data;
      setUser(userData);
      setProfileForm({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setMessage(t('profile.errors.fetchFailed'));
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.patch('/users/profile', profileForm);
      setUser(response.data.data);
      setIsEditing(false);
      setMessage(t('profile.messages.updateSuccess'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(error.response?.data?.message || t('profile.errors.updateFailed'));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confPassword) {
      setMessage(t('profile.errors.passwordMismatch'));
      return;
    }

    try {
      await apiClient.post('/users/change-password', passwordForm);
      setIsChangingPassword(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confPassword: '' });
      setMessage(t('profile.messages.passwordChangeSuccess'));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage(error.response?.data?.message || t('profile.errors.passwordChangeFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">{t('profile.loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('profile.title')}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isEditing ? t('profile.buttons.cancel') : t('profile.buttons.editProfile')}
            </button>
            <button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {t('profile.buttons.changePassword')}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.includes('successfully') || message.includes('Success')
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">{t('profile.sections.profileInfo')}</h2>
            
            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.fullName')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.email')}
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.phone')}
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('profile.placeholders.optional')}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {t('profile.buttons.saveChanges')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileForm({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    {t('profile.buttons.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">{t('profile.fields.fullName')}</label>
                  <p className="text-lg text-gray-800">{user?.name || t('profile.values.na')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">{t('profile.fields.email')}</label>
                  <p className="text-lg text-gray-800">{user?.email || t('profile.values.na')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">{t('profile.fields.phone')}</label>
                  <p className="text-lg text-gray-800">{user?.phone || t('profile.values.notProvided')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">{t('profile.fields.role')}</label>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    user?.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.role?.toUpperCase() || 'USER'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">{t('profile.fields.memberSince')}</label>
                  <p className="text-lg text-gray-800">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('profile.values.na')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">{t('profile.sections.securitySettings')}</h2>
            
            {isChangingPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.currentPassword')}
                  </label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.fields.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength="6"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {t('profile.buttons.changePassword')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({ oldPassword: '', newPassword: '', confPassword: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    {t('profile.buttons.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">{t('profile.fields.password')}</label>
                  <p className="text-lg text-gray-800">••••••••••••</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('profile.labels.lastChanged')}: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : t('profile.values.unknown')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">{t('profile.fields.accountSecurity')}</label>
                  <div className="flex items-center mt-1">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">{t('profile.labels.accountSecure')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avatar Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-4">{t('profile.sections.profilePicture')}</h2>
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || "https://www.gravatar.com/avatar/?d=mp"}
              alt={t('profile.alt.profileImage')}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
            <div>
              <p className="text-sm text-gray-600">{t('profile.labels.changePicture')}</p>
              <button className="mt-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                {t('profile.buttons.uploadPhoto')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}