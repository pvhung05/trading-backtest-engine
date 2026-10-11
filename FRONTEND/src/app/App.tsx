import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, AuthProvider, OHLCVProvider, useAuth } from './context';
import { LoginPage } from './components/auth';
import { AppLayout } from './components/layout/AppLayout';
import { CommunityLayout } from './components/layout/CommunityLayout';
import {
  ProductsPage,
  CommunityPage,
  FeedPage,
  GroupsPage,
  FriendsPage,
  IdeaDetailPage,
  UserProfilePage,
  NotFoundPage,
} from './pages';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Authentication Gate:
 * If session is loading, show spinner.
 * If unauthenticated, show LoginPage.
 * Once authenticated, mount the full Routed App within OHLCVProvider and BrowserRouter.
 */
function AppGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="size-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <OHLCVProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Home redirects to products */}
            <Route path="/" element={<Navigate to="/products" replace />} />
            
            {/* Products Page (Trading & Backtest Engine) */}
            <Route path="/products" element={<ProductsPage />} />
            
            {/* Community Suite wrapped in permanent persistent CommunityLayout */}
            <Route element={<CommunityLayout />}>
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/ideas" element={<CommunityPage />} />
              <Route path="/community/feed" element={<FeedPage />} />
              <Route path="/community/groups" element={<GroupsPage />} />
              <Route path="/community/friends" element={<FriendsPage />} />
              <Route path="/community/profile" element={<UserProfilePage />} />
              <Route path="/community/profile/:userId" element={<UserProfilePage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/profile/:userId" element={<UserProfilePage />} />
              <Route path="/community/category/:category" element={<CommunityPage />} />
            </Route>

            <Route path="/community/:category" element={<CommunityPage />} />
            
            {/* Single Idea Detail View */}
            <Route path="/community/ideas/:id" element={<IdeaDetailPage />} />
            
            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </OHLCVProvider>
  );
}
