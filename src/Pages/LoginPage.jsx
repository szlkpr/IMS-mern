import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient  from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState({ loading: false, message: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginState({ loading: true, message: 'Logging in...' });
    try {
      const { data } = await apiClient.post(
        '/users/login',
        { email, password },
      );
      setLoginState({ loading: false, message: 'Login successful!' });
      localStorage.setItem("accessToken", data.token);
      onLoginSuccess(); // Notify parent component of successful login
      navigate('/'); // Redirect to the dashboard
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please check your credentials.';
      setLoginState({ loading: false, message: errorMessage });
    }
  };

  return (
    <div>
      <h1>Inventory Management</h1>
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loginState.loading}>
          {loginState.loading ? 'Logging in...' : 'Login'}
        </button>
        {loginState.message && <div>{loginState.message}</div>}
      </form>
    </div>
  );
}
