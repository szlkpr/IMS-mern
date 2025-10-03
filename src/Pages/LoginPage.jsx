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
      const { data } = await apiClient.post(
        '/users/login',
        { email, password },
      );
      setLoginState({ loading: false, message: t('auth.loginSuccess') });
      localStorage.setItem("accessToken", data.token);
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
    <div>
      <h1>{t('app.title')}</h1>
      <form onSubmit={handleLogin}>
        <h2>{t('auth.login')}</h2>
        <input
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loginState.loading}>
          {loginState.loading ? t('auth.loggingIn') : t('auth.login')}
        </button>
        {loginState.message && <div>{loginState.message}</div>}
      </form>
    </div>
  );
}
