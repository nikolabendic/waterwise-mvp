import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc' }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
