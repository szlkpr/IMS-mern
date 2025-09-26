import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = ({ onLogout }) => {
  return (
    <div className="min-h-screen">
      <Navbar onLogout={onLogout} />
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;