import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Loader2 } from 'lucide-react';

type Mode = 'signin' | 'signup';

// ===== SOCIAL BUTTONS CONFIG =====
const SOCIALS = [
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877f2',
    glow: 'rgba(24,119,242,0.5)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    color: '#000',
    glow: 'rgba(0,0,0,0.3)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'yahoo',
    label: 'Yahoo',
    color: '#6001d2',
    glow: 'rgba(96,1,210,0.5)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M0 0l6.563 13.505v7.745h3.75v-7.765L17 0h-3.885L9.375 9.285 5.863 0zm17.625 0l-3.51 7.5h6.51L23.625 0z" />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple',
    color: '#000',
    glow: 'rgba(0,0,0,0.3)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0a66c2',
    glow: 'rgba(10,102,194,0.5)',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

// ===== RIPPLE EFFECT HOOK =====
function useRipple() {
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    circle.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      left:${x}px;top:${y}px;border-radius:50%;
      background:rgba(255,255,255,0.35);pointer-events:none;
      transform:scale(0);animation:ripple 600ms linear;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 700);
  };
  return createRipple;
}

// ===== PASSWORD STRENGTH =====
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Rất yếu', color: '#ef4444' };
  if (score === 2) return { score, label: 'Yếu', color: '#f97316' };
  if (score === 3) return { score, label: 'Trung bình', color: '#f59e0b' };
  if (score === 4) return { score, label: 'Mạnh', color: '#22c55e' };
  return { score, label: 'Rất mạnh', color: '#10b981' };
}

// ===== CANVAS ANIMATION COMPONENT - QUANT BACKTEST ENGINE =====
function AnimatedBackground({ paused, mouseX, mouseY }: { paused: boolean; mouseX: number; mouseY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const pausedRef = useRef(paused);
  const candleDataRef = useRef<{ open: number; close: number; high: number; low: number; signal?: 'BUY' | 'SELL' }[]>([]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const genCandles = () => {
      const data: typeof candleDataRef.current = [];
      let price = 0.46;
      for (let i = 0; i < 30; i++) {
        const trend = i > 10 && i < 22 ? 0.03 : -0.015;
        const move = (Math.random() - 0.47) * 0.075 + trend * 0.05;
        const open = price;
        price = Math.max(0.12, Math.min(0.88, price + move));
        const close = price;
        const bodyH = Math.abs(close - open);
        const high = Math.max(open, close) + Math.random() * bodyH * 0.7 + 0.015;
        const low = Math.min(open, close) - Math.random() * bodyH * 0.7 - 0.015;

        let signal: 'BUY' | 'SELL' | undefined;
        if (i === 7) signal = 'BUY';
        if (i === 19) signal = 'SELL';
        if (i === 24) signal = 'BUY';

        data.push({
          open,
          close,
          high: Math.min(high, 0.96),
          low: Math.max(low, 0.04),
          signal,
        });
      }
      candleDataRef.current = data;
    };
    genCandles();

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: -(Math.random() * 0.0004 + 0.00015),
      r: Math.random() * 1.6 + 0.4,
      op: Math.random() * 0.45 + 0.1,
      life: Math.random(),
    }));

    const draw = () => {
      if (!pausedRef.current) timeRef.current += 0.009;
      const t = timeRef.current;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const data = candleDataRef.current;

      // ── Deep futuristic space navy background ──
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#060a14');
      bg.addColorStop(0.5, '#0b1329');
      bg.addColorStop(1, '#050811');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Ambient radial neon glow
      const glow1 = ctx.createRadialGradient(W * 0.65, H * 0.45, 0, W * 0.65, H * 0.45, W * 0.6);
      glow1.addColorStop(0, 'rgba(59,130,246,0.12)');
      glow1.addColorStop(0.5, 'rgba(16,185,129,0.04)');
      glow1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, W, H);

      // Mouse spotlight
      if (mouseX > 0) {
        const sg = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 200);
        sg.addColorStop(0, 'rgba(99,102,241,0.12)');
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
      }

      // Cyber Grid lines
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      const gridStep = 48;
      for (let x = 0; x < W; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();

      // Chart Padding (Positioned below the top title area to never overlap)
      const PAD_L = W * 0.08;
      const PAD_R = W * 0.06;
      const PAD_T = H * 0.36; // Start lower down to give ample headroom for slogan & HUD
      const PAD_B = H * 0.16;
      const chartH = H - PAD_T - PAD_B;
      const chartW = W - PAD_L - PAD_R;

      // Price Grid
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const gy = PAD_T + (g / 4) * chartH;
        ctx.beginPath();
        ctx.moveTo(PAD_L, gy);
        ctx.lineTo(W - PAD_R, gy);
        ctx.stroke();
      }
      ctx.restore();

      // Price labels on the left
      ctx.save();
      ctx.font = `500 10px 'Inter', monospace`;
      ctx.fillStyle = 'rgba(147,197,253,0.5)';
      ctx.textAlign = 'right';
      const priceLabels = ['68,500', '67,800', '67,100', '66,400', '65,700'];
      for (let g = 0; g <= 4; g++) {
        const gy = PAD_T + (g / 4) * chartH;
        ctx.fillText(priceLabels[g] || '', PAD_L - 8, gy + 3.5);
      }
      ctx.restore();

      // Candlesticks
      const count = data.length;
      const gap = chartW / count;
      const cw = Math.max(gap * 0.54, 4);

      const signalPositions: { x: number; y: number; type: 'BUY' | 'SELL'; price: string }[] = [];

      data.forEach((d, i) => {
        const isBull = d.close >= d.open;
        const candleCX = PAD_L + (i + 0.5) * gap;
        const proximity = mouseX > 0 ? Math.max(0, 1 - Math.abs(candleCX - mouseX) / (gap * 2.5)) : 0;

        const bullColor = proximity > 0.25 ? '#10b981' : '#059669';
        const bearColor = proximity > 0.25 ? '#f43f5e' : '#e11d48';
        const color = isBull ? bullColor : bearColor;

        const yHigh = PAD_T + (1 - d.high) * chartH;
        const yLow = PAD_T + (1 - d.low) * chartH;
        const yOpen = PAD_T + (1 - d.open) * chartH;
        const yClose = PAD_T + (1 - d.close) * chartH;
        const bodyY = Math.min(yOpen, yClose);
        const bodyH = Math.max(Math.abs(yClose - yOpen), 3);

        ctx.save();
        if (proximity > 0.25) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
        }

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(candleCX, yHigh);
        ctx.lineTo(candleCX, yLow);
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(candleCX - cw / 2, bodyY, cw, bodyH, 2.5);
        ctx.fill();
        ctx.restore();

        // Save Signal Position
        if (d.signal === 'BUY') {
          signalPositions.push({
            x: candleCX,
            y: yLow + 16,
            type: 'BUY',
            price: '$65,420',
          });
        } else if (d.signal === 'SELL') {
          signalPositions.push({
            x: candleCX,
            y: yHigh - 16,
            type: 'SELL',
            price: '$68,150 (+4.17%)',
          });
        }
      });

      // Neon EMA Curve
      const emaPoints: { x: number; y: number }[] = [];
      let ema = data[0].close;
      const k = 2 / (8 + 1);
      data.forEach((d, i) => {
        ema = d.close * k + ema * (1 - k);
        const wave = Math.sin(t * 1.5 + i * 0.4) * 0.008;
        emaPoints.push({
          x: PAD_L + (i + 0.5) * gap,
          y: PAD_T + (1 - Math.min(Math.max(ema + wave, 0.05), 0.95)) * chartH,
        });
      });

      ctx.save();
      ctx.beginPath();
      emaPoints.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Gradient Area fill under EMA
      if (emaPoints.length > 0) {
        ctx.lineTo(emaPoints[emaPoints.length - 1].x, PAD_T + chartH);
        ctx.lineTo(emaPoints[0].x, PAD_T + chartH);
        ctx.closePath();
        const fillG = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
        fillG.addColorStop(0, 'rgba(56,189,248,0.15)');
        fillG.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = fillG;
        ctx.shadowBlur = 0;
        ctx.fill();
      }
      ctx.restore();

      // Strategy Buy / Sell Execution Badges
      signalPositions.forEach((sig) => {
        ctx.save();
        const isBuy = sig.type === 'BUY';
        const badgeColor = isBuy ? '#10b981' : '#f43f5e';
        const label = isBuy ? '▲ BUY' : '▼ TAKE PROFIT';

        // Little anchor dot
        ctx.beginPath();
        ctx.arc(sig.x, isBuy ? sig.y - 10 : sig.y + 10, 3, 0, Math.PI * 2);
        ctx.fillStyle = badgeColor;
        ctx.shadowColor = badgeColor;
        ctx.shadowBlur = 8;
        ctx.fill();

        // Badge pill
        ctx.font = `600 10px 'Inter', sans-serif`;
        const textW = ctx.measureText(label).width;
        const pillW = textW + 14;
        const pillH = 18;
        const pillX = sig.x - pillW / 2;
        const pillY = isBuy ? sig.y + 2 : sig.y - 20;

        ctx.fillStyle = isBuy ? 'rgba(6,78,59,0.85)' : 'rgba(136,19,55,0.85)';
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, sig.x, pillY + pillH / 2);
        ctx.restore();
      });

      // Volume bars
      const volH = chartH * 0.14;
      const volY = PAD_T + chartH + 10;
      data.forEach((d, i) => {
        const isBull = d.close >= d.open;
        const vol = 0.25 + ((i * 7) % 10) * 0.07;
        const bh = vol * volH;
        const bx = PAD_L + (i + 0.5) * gap - cw / 2;
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = isBull ? '#10b981' : '#f43f5e';
        ctx.beginPath();
        ctx.roundRect(bx, volY + volH - bh, cw, bh, 1.5);
        ctx.fill();
        ctx.restore();
      });

      // Floating Light Particles
      particles.forEach((p) => {
        if (!pausedRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.life += 0.004;
          if (p.life > 1 || p.y < 0) {
            p.x = Math.random();
            p.y = 1;
            p.life = 0;
          }
        }
        const alpha = Math.sin(p.life * Math.PI) * p.op;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#93c5fd';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [mouseX, mouseY]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ===== FLOATING LABEL INPUT =====
function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  rightElement,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative mb-1">
      <div
        className={`relative rounded-lg transition-all duration-200 bg-white dark:bg-gray-800 border ${
          error
            ? 'border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
            : focused
            ? 'border-blue-600 shadow-[0_0_0_3px_rgba(41,98,255,0.15)]'
            : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <label
          htmlFor={id}
          className={`absolute left-3.5 transition-all duration-200 pointer-events-none z-10 leading-none ${
            lifted
              ? 'top-2 scale-75 -translate-y-0 bg-white dark:bg-gray-800 px-1 text-xs'
              : 'top-1/2 -translate-y-1/2 text-sm'
          } ${
            error
              ? 'text-red-500'
              : focused
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500'
          }`}
          style={{ transformOrigin: 'left center' }}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full outline-none text-sm text-gray-900 dark:text-gray-100 bg-transparent rounded-lg font-sans ${
            lifted ? 'pt-5 pb-2 px-3.5' : 'py-3.5 px-3.5'
          } ${rightElement ? 'pr-11' : 'pr-3.5'}`}
          aria-label={label}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-red-500 text-xs mt-1 pl-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ===== TOAST =====
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl z-50 flex items-center gap-2.5 animate-bounce">
      <span className="text-emerald-400 dark:text-emerald-600 text-lg">✓</span>
      <span>{message}</span>
    </div>
  );
}

// ===== MAIN LOGIN PAGE =====
export function LoginPage() {
  const { login, register } = useAuth();
  const { isDark, toggle } = useTheme();

  const [mode, setMode] = useState<Mode>('signin');
  const [paused, setPaused] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [parallaxPos, setParallaxPos] = useState({ x: 0, y: 0 });
  const leftRef = useRef<HTMLDivElement>(null);
  const ripple = useRipple();

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const [shakeFields, setShakeFields] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const pwStrength = getPasswordStrength(password);

  // Staggered slogan reveal
  const [sloganVisible, setSloganVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSloganVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Parallax mouse tracking
  const handleLeftMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = leftRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    setParallaxPos({ x: dx * 18, y: dy * 12 });
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleLeftMouseLeave = () => {
    setParallaxPos({ x: 0, y: 0 });
    setMousePos({ x: 0, y: 0 });
  };

  // Switch mode
  const switchMode = (next: Mode) => {
    setMode(next);
    setShowEmailForm(false);
    setErrors({});
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPw('');
    setAgreeTerms(false);
  };

  // Validate form
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const shakes: string[] = [];

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      errs.username = 'Vui lòng nhập tên đăng nhập';
      shakes.push('username');
    }

    if (mode === 'signup') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        errs.email = 'Vui lòng nhập email hợp lệ';
        shakes.push('email');
      }
    }

    if (!password || password.length < 8) {
      errs.password = 'Mật khẩu tối thiểu 8 ký tự';
      shakes.push('password');
    }

    if (mode === 'signup') {
      if (confirmPw !== password) {
        errs.confirmPw = 'Mật khẩu xác nhận không khớp';
        shakes.push('confirmPw');
      }
      if (!agreeTerms) {
        errs.terms = 'Vui lòng đồng ý điều khoản dịch vụ';
        shakes.push('terms');
      }
    }

    setErrors(errs);
    setShakeFields(shakes);
    setTimeout(() => setShakeFields([]), 600);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement> | FormEvent) => {
    if ('currentTarget' in e && e.currentTarget instanceof HTMLButtonElement) {
      ripple(e as React.MouseEvent<HTMLButtonElement>);
    }
    e.preventDefault();
    if (!validate() || busy) return;

    setBusy(true);
    setErrors({});

    try {
      if (mode === 'signup') {
        await register({
          username: username.trim(),
          email: email.trim(),
          password,
        });
        setToast('Đăng ký tài khoản thành công 🎉');
      } else {
        await login({
          username: username.trim(),
          password,
        });
        setToast('Đăng nhập thành công 🎉');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg =
        err?.message ||
        (err?.errors ? Object.values(err.errors).join(', ') : null) ||
        'Xác thực không thành công. Vui lòng kiểm tra lại thông tin đăng nhập.';
      setErrors({ form: msg });
      setShakeFields(['username', 'password']);
    } finally {
      setBusy(false);
    }
  };

  // Magnetic button effect
  const [magnetOffset, setMagnetOffset] = useState({ x: 0, y: 0 });
  const submitRef = useRef<HTMLButtonElement>(null);
  const handleSubmitMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setMagnetOffset({
      x: (e.clientX - cx) * 0.2,
      y: (e.clientY - cy) * 0.2,
    });
  };

  const slogan = 'Test first. Then trade.';

  return (
    <>
      <style>{`
        @keyframes ripple { to { transform: scale(4); opacity: 0; } }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes slideDown {
          from { opacity:0; max-height:0; transform:translateY(-8px); }
          to   { opacity:1; max-height:800px; transform:translateY(0); }
        }
        @keyframes fadeSlide {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shake { animation: shake 0.5s cubic-bezier(0.4,0,0.2,1); }
        .email-form-open {
          animation: slideDown 0.35s cubic-bezier(0.4,0,0.2,1) forwards;
          overflow: hidden;
        }
        .mode-content { animation: fadeSlide 0.3s cubic-bezier(0.4,0,0.2,1); }
        .social-btn:hover { transform: scale(1.08); }
        .social-btn { transition: transform 0.2s cubic-bezier(0.4,0,0.2,1); position: relative; }
        .social-btn .tooltip {
          position: absolute; bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: #131722; color: #fff; font-size: 11px;
          padding: 4px 8px; border-radius: 5px; white-space: nowrap;
          pointer-events: none; opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 30;
        }
        .social-btn:hover .tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
      `}</style>

      {/* ===== FULLSCREEN LAYOUT ===== */}
      <div className="flex h-screen w-screen bg-white dark:bg-gray-900 font-sans overflow-hidden text-gray-900 dark:text-gray-100">
        {/* ===== LEFT COLUMN: ANIMATED CANVAS CHART ===== */}
        <div
          ref={leftRef}
          className="hidden lg:block lg:flex-[0_0_52%] p-4 relative h-full select-none"
          onMouseMove={handleLeftMouseMove}
          onMouseLeave={handleLeftMouseLeave}
        >
          <div className="w-full h-full rounded-[24px] overflow-hidden relative shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_40px_rgba(41,98,255,0.12)] border border-white/10">
            <AnimatedBackground paused={paused} mouseX={mousePos.x} mouseY={mousePos.y} />

            {/* Parallax Overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-transform duration-100"
              style={{
                transform: `translate(${parallaxPos.x * -0.3}px, ${parallaxPos.y * -0.3}px)`,
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
            </div>

            {/* Slogan & Branding Header */}
            <div
              className="absolute top-8 left-8 right-8 transition-transform duration-120 pointer-events-none"
              style={{
                transform: `translate(${parallaxPos.x * 0.4}px, ${parallaxPos.y * 0.4}px)`,
              }}
            >
              {/* Top Row: Logo & Status Badge */}
              <div className="flex items-center justify-between mb-5 pointer-events-auto">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-blue-500/20 backdrop-blur-md flex items-center justify-center border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2.4">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <span className="text-white font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                    BacktestPro
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium backdrop-blur-md">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Engine v2.4 Live</span>
                </div>
              </div>

              {/* Staggered Character Reveal Headline */}
              <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                {slogan.split('').map((char, i) => (
                  <span
                    key={i}
                    className="inline-block transition-all duration-400"
                    style={{
                      opacity: sloganVisible ? 1 : 0,
                      transform: sloganVisible ? 'translateY(0)' : 'translateY(12px)',
                      transitionDelay: `${i * 0.025}s`,
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </h1>
              <p
                className="text-slate-300/85 text-sm xl:text-base mt-2 font-normal leading-relaxed max-w-lg transition-all duration-500 drop-shadow"
                style={{
                  opacity: sloganVisible ? 1 : 0,
                  transform: sloganVisible ? 'translateY(0)' : 'translateY(8px)',
                  transitionDelay: '0.6s',
                }}
              >
                Kiểm tra & tối ưu hóa chiến lược định lượng trên dữ liệu lịch sử chuẩn xác.
              </p>
            </div>

            {/* Floating Strategy HUD Card (Middle Overlay) */}
            <div
              className="absolute top-[32%] right-8 transition-transform duration-150 pointer-events-none hidden xl:block"
              style={{
                transform: `translate(${parallaxPos.x * -0.5}px, ${parallaxPos.y * -0.5}px)`,
              }}
            >
              <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 shadow-2xl flex items-center gap-4 text-xs">
                <div className="size-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
                  ⚡
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Strategy Alpha</div>
                  <div className="text-white font-semibold text-sm">EMA Trend Breakout</div>
                </div>
                <div className="h-6 w-[1px] bg-white/10" />
                <div>
                  <div className="text-slate-400">Win Rate</div>
                  <div className="text-emerald-400 font-bold text-sm">68.4%</div>
                </div>
                <div>
                  <div className="text-slate-400">Profit Factor</div>
                  <div className="text-blue-400 font-bold text-sm">2.45</div>
                </div>
              </div>
            </div>

            {/* Floating Net PnL Card (Bottom Left Overlay) */}
            <div
              className="absolute bottom-6 left-8 transition-transform duration-150 pointer-events-none"
              style={{
                transform: `translate(${parallaxPos.x * 0.3}px, ${parallaxPos.y * 0.3}px)`,
              }}
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-5">
                <div>
                  <div className="text-slate-400 text-xs font-medium">Net Backtest PnL</div>
                  <div className="text-emerald-400 font-extrabold text-xl tracking-tight flex items-center gap-1.5">
                    <span>+$48,250.00</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      +142.8%
                    </span>
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">Max DD</div>
                    <div className="text-rose-400 font-bold">-3.8%</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Sharpe</div>
                    <div className="text-blue-300 font-bold">2.34</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Trades</div>
                    <div className="text-white font-bold">428</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pause / Play Button */}
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Chạy animation' : 'Dừng animation'}
              className="absolute bottom-6 right-8 size-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white cursor-pointer flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              {paused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: AUTH FORM ===== */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-y-auto px-6 py-8">
          {/* Theme Toggle Button */}
          <button
            aria-label="Chuyển theme"
            onClick={toggle}
            className="absolute top-6 right-6 size-9 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer flex items-center justify-center text-base hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Logo & Brand Header */}
          <div className="text-center mb-6">
            <div className="flex items-center gap-2.5 justify-center mb-2">
              <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2.4">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-gray-100">
                BacktestPro
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
              Nền tảng kiểm thử và phân tích chiến lược giao dịch tự động
            </p>
          </div>

          {/* Form Card Container */}
          <div className="w-full max-w-[370px] mode-content" key={mode}>
            {/* Form Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center tracking-tight">
              {mode === 'signup' ? 'Tạo tài khoản mới' : 'Chào mừng trở lại'}
            </h2>

            {/* Form-level Error Alert */}
            {errors.form && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-medium shake">
                {errors.form}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={(e) => {
                ripple(e);
                setToast('Google OAuth đang được liên kết…');
              }}
              aria-label="Đăng nhập với Google"
              className="w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200 mb-3 hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* 5 Social Network Buttons */}
            <div className="flex gap-2 mb-4 justify-center">
              {SOCIALS.map((s) => (
                <button
                  key={s.id}
                  className="social-btn flex-1 aspect-square border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 cursor-pointer flex items-center justify-center p-2.5 hover:border-blue-500 hover:shadow-md transition-all"
                  aria-label={`Đăng nhập với ${s.label}`}
                  onClick={() => setToast(`Đăng nhập với ${s.label} đang kích hoạt…`)}
                  style={{ color: s.color }}
                >
                  <span className="tooltip">{s.label}</span>
                  {s.icon}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Email Form Toggle Button */}
            <button
              onClick={(e) => {
                ripple(e);
                setShowEmailForm((f) => !f);
              }}
              aria-expanded={showEmailForm}
              className="w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200 hover:border-blue-600 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10 mb-1"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>{mode === 'signup' ? 'Đăng ký với Tài khoản' : 'Đăng nhập với Tài khoản'}</span>
            </button>

            {/* Slide-down Form */}
            {showEmailForm && (
              <form onSubmit={onSubmit} className="email-form-open pt-3 space-y-2.5">
                {/* Username */}
                <div className={shakeFields.includes('username') ? 'shake' : ''}>
                  <FloatingInput
                    id="username"
                    label="Tên đăng nhập"
                    type="text"
                    value={username}
                    onChange={setUsername}
                    error={errors.username}
                    autoComplete="username"
                  />
                </div>

                {/* Email (signup only) */}
                {mode === 'signup' && (
                  <div className={shakeFields.includes('email') ? 'shake' : ''}>
                    <FloatingInput
                      id="email"
                      label="Địa chỉ Email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      error={errors.email}
                      autoComplete="email"
                    />
                  </div>
                )}

                {/* Password */}
                <div className={shakeFields.includes('password') ? 'shake' : ''}>
                  <FloatingInput
                    id="password"
                    label="Mật khẩu"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    error={errors.password}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    rightElement={
                      <button
                        type="button"
                        aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        onClick={() => setShowPw((p) => !p)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                      >
                        {showPw ? (
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    }
                  />
                </div>

                {/* Password strength meter (signup only) */}
                {mode === 'signup' && password.length > 0 && (
                  <div className="pt-0.5">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-sm transition-all duration-300"
                          style={{
                            backgroundColor:
                              i <= pwStrength.score ? pwStrength.color : 'rgba(156, 163, 175, 0.2)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: pwStrength.color }}>
                      {pwStrength.label}
                    </span>
                  </div>
                )}

                {/* Confirm password (signup only) */}
                {mode === 'signup' && (
                  <div className={shakeFields.includes('confirmPw') ? 'shake' : ''}>
                    <FloatingInput
                      id="confirmPw"
                      label="Xác nhận mật khẩu"
                      type={showPw ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={setConfirmPw}
                      error={errors.confirmPw}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {/* Terms agreement checkbox (signup only) */}
                {mode === 'signup' && (
                  <div className={`pt-1 ${shakeFields.includes('terms') ? 'shake' : ''}`}>
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-400 leading-normal">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 accent-blue-600 rounded shrink-0 cursor-pointer"
                      />
                      <span>
                        Tôi đồng ý với{' '}
                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline">
                          Điều khoản dịch vụ
                        </a>{' '}
                        và{' '}
                        <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline">
                          Chính sách bảo mật
                        </a>
                      </span>
                    </label>
                    {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
                  </div>
                )}

                {/* Magnetic Shimmer Submit Button */}
                <button
                  ref={submitRef}
                  type="submit"
                  disabled={busy}
                  onMouseMove={handleSubmitMouseMove}
                  onMouseLeave={() => setMagnetOffset({ x: 0, y: 0 })}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] text-white text-sm font-semibold cursor-pointer shadow-md shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                  style={{
                    transform: `translate(${magnetOffset.x}px, ${magnetOffset.y}px)`,
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Đang xử lý…</span>
                    </>
                  ) : mode === 'signup' ? (
                    'Tạo tài khoản'
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Mode Switcher Footer */}
          <div className="mt-7 w-full max-w-[370px] pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'signup' ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
              <button
                onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer underline underline-offset-2 hover:text-blue-700"
              >
                {mode === 'signup' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
