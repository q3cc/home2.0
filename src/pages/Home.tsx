import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

// 社交平台数据
const socialLinks = [
  {
    name: "GitHub",
    icon: "github",
    url: "https://github.com/Q3CC"
  },
  {
    name: "哔哩哔哩",
    icon: "bilibili",
    url: "https://space.bilibili.com/xxx"
  },
  {
    name: "TikTok",
    icon: "tiktok",
    url: "https://www.tiktok.com/@xxx"
  }
];

// 计算网站运行时间
const calculateRuntime = () => {
  const startDate = dayjs('2025-01-01');
  const now = dayjs();
  const diff = now.diff(startDate, 'day');
  const years = Math.floor(diff / 365);
  const months = Math.floor((diff % 365) / 30);
  const days = (diff % 365) % 30;
  return { years, months, days };
};

export default function Home() {
  const [wallpaper, setWallpaper] = useState<string>('');
  const [contrastColor, setContrastColor] = useState<string>('#ffffff');
  const [currentQuote, setCurrentQuote] = useState({ hitokoto: '', from: '' });
  const [typedQuote, setTypedQuote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [runtime, setRuntime] = useState(calculateRuntime());
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const easterEggRef = useRef<HTMLDivElement>(null);

  // 打字机效果
  const typeWriter = (text: string, speed = 50) => {
    let i = 0;
    setTypedQuote(text.charAt(0)); // 先显示第一个字
    const typing = setInterval(() => {
      if (i < text.length - 1) {
        i++;
        setTypedQuote(prev => prev + text.charAt(i));
      } else {
        clearInterval(typing);
      }
    }, speed);
  };

  // 获取随机壁纸
  const fetchWallpaper = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('https://www.loliapi.com/acg/');
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      setWallpaper(imageUrl);
      setLastUpdateTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    } catch (error) {
      toast.error('壁纸加载失败');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算主色和对比色
  const calculateColor = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      // 获取主色
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0;
      
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
      }
      
      const pixels = imageData.length / 4;
      r = Math.round(r / pixels);
      g = Math.round(g / pixels);
      b = Math.round(b / pixels);
      
      // 计算对比色
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const contrast = brightness > 128 ? '#000000' : '#ffffff';
      
      setContrastColor(contrast);
    };
  };

  // 防抖计时器
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 获取随机一言（带防抖）
  const getRandomQuote = async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('https://v1.hitokoto.cn/');
        const data = await response.json();
        setCurrentQuote({
          hitokoto: data.hitokoto,
          from: data.from || '未知'
        });
        typeWriter(data.hitokoto);
      } catch (error) {
        toast.error('获取一言失败');
        console.error(error);
      } finally {
        debounceTimer.current = null;
      }
    }, 500); // 500ms防抖时间
  };

  useEffect(() => {
    fetchWallpaper();
    getRandomQuote();

    // 实时更新运行时间
    const interval = setInterval(() => {
      setRuntime(calculateRuntime());
    }, 1000 * 60 * 60); // 每小时更新一次

    return () => {
      clearInterval(interval);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (wallpaper) {
      calculateColor(wallpaper);
    }
  }, [wallpaper]);

  // 长按事件处理
  const handlePressStart = () => {
    const timer = setTimeout(() => {
      setShowEasterEgg(true);
    }, 3000);
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // 点击彩蛋容器返回
  const handleEasterEggClick = () => {
    setShowEasterEgg(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 背景壁纸 */}
      {isLoading ? (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      ) : (
        <img 
          src={wallpaper} 
          alt="背景壁纸" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* 隐藏的canvas用于颜色计算 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {/* 主内容区 */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* ID展示区 */}
        <h1 
          className="text-5xl md:text-7xl font-bold mb-8 text-white transition-colors duration-300"
          style={{ color: '#ffffff' }}
        >
          Q3CC
        </h1>
        
        {/* 信息容器 */}

          <div 
            className={cn(
              "backdrop-blur-sm bg-black/30 rounded-xl p-8 shadow-lg",
              "max-w-md w-full transition-all duration-300 text-white"
            )}
            style={{
              boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
            }}

          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {!showEasterEgg ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              {/* 随机一言 */}
              <p className="text-lg mb-2">{typedQuote || currentQuote.hitokoto}</p>
              <p className="text-sm opacity-80">—— {currentQuote.from}</p>
              
              {/* 刷新按钮 */}
              <button 
                onClick={getRandomQuote}
                className="absolute -right-2 -bottom-2 p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                aria-label="刷新一言"
              >
                <i 
                  className="fa-solid fa-rotate text-sm hover:rotate-180 transition-transform duration-300"
                  style={{ color: contrastColor }}
                ></i>
              </button>
            </motion.div>
          ) : (

            <motion.div
              ref={easterEggRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative h-full flex flex-col items-center justify-center cursor-pointer"
              onClick={handleEasterEggClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <p className="text-lg mb-2">你居然发现了彩蛋</p>
                <p className="text-sm">最近一次更新时间 {lastUpdateTime}</p>
                <p className="text-sm mt-2">
                  网站已经运行了 {runtime.years}年{runtime.months}月{runtime.days}天
                </p>
              </div>
            </motion.div>

          )}
          
          {/* 社交链接 */}
          {!showEasterEgg && (
            <div className="mt-6 flex justify-center space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <i 
                    className={`fa-brands fa-${social.icon} text-2xl transition-all duration-300 group-hover:scale-110`}
                    style={{ color: contrastColor }}
                  ></i>
                  <span 
                    className={cn(
                      "absolute -bottom-8 left-1/2 -translate-x-1/2",
                      "px-2 py-1 rounded-md text-xs whitespace-nowrap",
                      "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    )}
                    style={{ 
                      backgroundColor: contrastColor,
                      color: contrastColor === '#ffffff' ? '#000000' : '#ffffff'
                    }}
                  >
                    {social.name}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 页脚 */}
      <footer 
        className={cn(
          "absolute bottom-0 left-0 right-0 py-2 text-center",
          "backdrop-blur-sm bg-black/20 text-white"
        )}
      >
        <p className="text-xs">
          <a 
            href="https://icp.gov.moe/?keyword=20252028" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            萌ICP备20252028号
          </a>
        </p>
      </footer>
    </div>
  );
}