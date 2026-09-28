import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TradingViewNavbar } from '../../community/components/TradingViewNavbar';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Detail page manages its own top header
  const isDetailPage = location.pathname.startsWith('/community/ideas/');

  const activeNav = location.pathname.startsWith('/community') ? 'community' : 'products';

  const handleNavChange = (nav: 'products' | 'community') => {
    if (nav === 'products') {
      navigate('/products');
    } else {
      navigate('/community');
    }
  };

  return (
    <div className="size-full flex flex-col bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Render global navbar on all pages except single idea detail page */}
      {!isDetailPage && (
        <TradingViewNavbar
          activeNav={activeNav}
          onNavChange={handleNavChange}
          onPublishClick={() => navigate('/community')}
        />
      )}

      {/* Main Routed Page Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
export default AppLayout;
