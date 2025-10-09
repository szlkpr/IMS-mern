import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-corporate-50">
      {/* Professional background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-corporate-100 to-corporate-200"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.1)_1px,_transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      
      <Navbar onLogout={onLogout} />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;