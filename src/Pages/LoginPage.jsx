import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient  from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState({ loading: false, message: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginState({ loading: true, message: t('auth.loggingIn') });
    try {
      const response = await apiClient.post(
        '/users/login',
        { email, password },
      );

      // Backend wraps payload in { success, statusCode, message, data: { user, accessToken, refreshToken } }
      const accessToken = response?.data?.data?.accessToken;

      if (!accessToken) {
        throw new Error('Invalid login response. No access token.');
      }

      setLoginState({ loading: false, message: t('auth.loginSuccess') });
      localStorage.setItem('accessToken', accessToken);
      onLoginSuccess(); // Notify parent component of successful login
      navigate('/'); // Redirect to the dashboard
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.message || t('auth.loginFailed');
      setLoginState({ loading: false, message: errorMessage });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-corporate-50">
      {/* Professional background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-corporate-100 to-corporate-200"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.1)_1px,_transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white p-8 shadow-lg border border-corporate-200 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-corporate-gradient flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-sm">
              IMS
            </div>
            <h1 className="text-3xl font-bold text-corporate-700 mb-2">
              {t('app.title')}
            </h1>
            <p className="text-corporate-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-corporate-700 mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-corporate-300 sharp-sm focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-200 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-corporate-700 mb-2">
                {t('auth.password')}
              </label>
              <input
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-corporate-300 sharp-sm focus:ring-2 focus:ring-corporate-500 focus:border-corporate-500 transition-all duration-200 focus:outline-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loginState.loading}
              className="w-full py-3 px-4 bg-corporate-gradient text-white font-medium sharp-sm hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loginState.loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('auth.loggingIn')}
                </div>
              ) : (
                t('auth.login')
              )}
            </button>
            
            {loginState.message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                loginState.message === t('auth.loginSuccess') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {loginState.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
