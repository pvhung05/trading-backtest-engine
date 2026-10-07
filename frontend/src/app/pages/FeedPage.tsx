import { SocialFeedView } from '../community/features/feed/SocialFeedView';

export function FeedPage() {
  return (
    <div className="flex-1 py-6 px-4 lg:px-8 max-w-[1440px] mx-auto w-full">
      <SocialFeedView />
    </div>
  );
}

export default FeedPage;
