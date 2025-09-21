import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = ({ onLogout }) => {
  return (
    <>
      <Navbar onLogout={onLogout} />
      <div className="container" style={{ padding: '20px' }}>
        <Outlet />
      </div>
    </>
  );
};

export default MainLayout;