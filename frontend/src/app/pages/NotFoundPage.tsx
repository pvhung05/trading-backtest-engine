import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, TrendingUp } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-white dark:bg-[#131722] text-gray-900 dark:text-gray-100">
      <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl bg-gray-50 dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] shadow-xl">
        <div className="size-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
          <Compass className="size-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-blue-600">404</h1>
          <h2 className="text-lg font-bold mt-1">Trang không tồn tại</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được chuyển sang vị trí mới.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <TrendingUp className="size-4" />
            <span>Vào Trading Chart</span>
          </button>
          <button
            onClick={() => navigate('/community')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-[#131722] dark:hover:bg-[#2a2e39] text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Vào Community</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default NotFoundPage;
