import { useState, useEffect } from 'react';
import { communityApi, type UserProfileResponse } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { X, Award, User, Sparkles, Check } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfileResponse) => void;
}

const BADGES = ['TRADER', 'QUANT DEV', 'ANALYST', 'PRO', 'VIP'];

export function ProfileEditModal({ isOpen, onClose, onProfileUpdated }: ProfileEditModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [badge, setBadge] = useState('TRADER');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      communityApi
        .getMyProfile()
        .then((res) => {
          if (res) {
            setDisplayName(res.displayName || user?.name || '');
            setBio(res.bio || '');
            setAvatarUrl(res.avatarUrl || user?.avatarUrl || '');
            setBadge(res.badge || 'TRADER');
          }
        })
        .catch(() => {
          setDisplayName(user?.name || '');
          setAvatarUrl(user?.avatarUrl || '');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await communityApi.updateMyProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        badge: badge,
      });
      onProfileUpdated?.(res);
      onClose();
    } catch (err) {
      console.warn('Update profile API error:', err);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2a2e39] pb-3">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Hồ Sơ Thành Viên Cộng Đồng
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Đang tải hồ sơ...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop'}
                alt="Avatar"
                className="size-14 rounded-full object-cover border-2 border-blue-600"
              />
              <div className="flex-1">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Đường dẫn ảnh đại diện
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tên hiển thị trong cộng đồng
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Giới thiệu bản thân (Bio)
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Quantitative Trader chuyên chiến lược EMA / RSI trên thị trường Crypto & Forex..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Huy hiệu chuyên môn (Badge)
              </label>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBadge(b)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      badge === b
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#2a2e39]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-xs"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfileEditModal;
