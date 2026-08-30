import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  RefreshCcw,
  ExternalLink
} from 'lucide-react';

export interface FastPdfViewerProps {
  url: string;
  title: string;
}

export const FastPdfViewer: React.FC<FastPdfViewerProps> = ({ url, title }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [targetPageInput, setTargetPageInput] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pagesInnerRef = useRef<HTMLDivElement>(null);

  const [zoomScale, setZoomScale] = useState<number>(1.0);

  const touchStartRef = useRef<{
    distance: number;
    initialScale: number;
    lastTap: number;
  }>({
    distance: 0,
    initialScale: 1.0,
    lastTap: 0,
  });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const now = Date.now();
      const timeDiff = now - touchStartRef.current.lastTap;
      if (timeDiff < 280) {
        // Double tap toggle zoom
        e.preventDefault();
        setZoomScale((prev) => (prev > 1.05 ? 1.0 : 2.0));
        touchStartRef.current.lastTap = 0;
        return;
      }
      touchStartRef.current.lastTap = now;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartRef.current.distance = distance;
      touchStartRef.current.initialScale = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
      if (e.cancelable) e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = distance / touchStartRef.current.distance;
      
      let newScale = touchStartRef.current.initialScale * factor;
      if (newScale < 1.0) newScale = 1.0;
      if (newScale > 3.5) newScale = 3.5;
      
      setZoomScale(Math.round(newScale * 10) / 10);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current.distance = 0;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoomScale((prev) => (prev > 1.05 ? 1.0 : 2.0));
  };

  // Monitor browser native fullscreen events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return;
    try {
      const elem = viewerRef.current as any;
      if (!isFullscreen) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pdfDoc: any = null;
    const renderTasks: any[] = [];

    const isCancellationError = (err: any) => {
      if (!err) return false;
      if (err.name === 'RenderingCancelledException' || err.name === 'AbortException') return true;
      const msg = String(err.message || err).toLowerCase();
      return msg.includes('rendering cancelled') || msg.includes('cancelled') || msg.includes('aborted');
    };

    const loadAndRender = async () => {
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        if (isMounted) {
          setError("رابط الملف غير متوفر أو غير صالح");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setProgress(5);

        // Load PDF.js from a robust public cdnjs dynamically
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
            script.async = true;
            script.onload = () => {
              try {
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
              } catch (e) {}
              resolve();
            };
            script.onerror = () => {
              reject(new Error("تعذر تحميل مكتبة عرض الـ PDF"));
            };
            document.head.appendChild(script);
          });
        }

        if (!isMounted) return;

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("تعذر تهيئة قارئ الـ PDF");

        // Request document via typed array to avoid automatic browser downloads
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          withCredentials: false
        });

        loadingTask.onProgress = (progressData: any) => {
          if (progressData.total > 0 && isMounted) {
            const percentage = Math.round((progressData.loaded / progressData.total) * 100);
            setProgress(percentage);
          }
        };

        pdfDoc = await loadingTask.promise;
        if (!isMounted) return;

        setTotalPages(pdfDoc.numPages);
        setLoading(false);

        const container = pagesInnerRef.current;
        if (!container) return;
        container.innerHTML = '';

        // Sequential rendering of pages in high definition scale
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (!isMounted) break;

          try {
            const page = await pdfDoc.getPage(pageNum);
            if (!isMounted) break;
            
            const pageWrapper = document.createElement('div');
            pageWrapper.id = `pdf-page-${pageNum}`;
            pageWrapper.className = 'relative bg-white my-3.5 shadow-md rounded-xl overflow-hidden border border-slate-300 p-1 flex flex-col items-center select-none w-full max-w-2xl';
            
            const label = document.createElement('div');
            label.className = 'text-[9.5px] text-slate-400 font-extrabold mb-1 font-mohand select-none';
            label.textContent = `صفحة ${pageNum} من ${pdfDoc.numPages}`;
            pageWrapper.appendChild(label);

            const canvas = document.createElement('canvas');
            canvas.className = 'w-full h-auto max-w-full rounded shadow-sm';
            pageWrapper.appendChild(canvas);

            container.appendChild(pageWrapper);

            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            // Render scale 1.6 - crisp readability
            const viewport = page.getViewport({ scale: 1.6 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };

            const renderTask = page.render(renderContext);
            renderTasks.push(renderTask);
            await renderTask.promise;
          } catch (pageErr: any) {
            if (!isMounted || isCancellationError(pageErr)) {
              break;
            }
            console.warn(`Warning rendering page ${pageNum}:`, pageErr);
          }
        }

      } catch (err: any) {
        if (!isMounted || isCancellationError(err)) {
          return;
        }
        console.error("PDF Loading failed:", err);
        if (isMounted) {
          setError(err.message || "تعذر عرض ملف الـ PDF حالياً");
          setLoading(false);
        }
      }
    };

    loadAndRender();

    return () => {
      isMounted = false;
      try {
        renderTasks.forEach(t => {
          if (t) {
            if (typeof t.cancel === 'function') {
              try { t.cancel(); } catch (e) {}
            }
            if (typeof t.destroy === 'function') {
              try { t.destroy(); } catch (e) {}
            }
          }
        });
        if (pdfDoc && typeof pdfDoc.destroy === 'function') {
          try { pdfDoc.destroy(); } catch (e) {}
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [url]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white rounded-2xl min-h-[300px] h-full">
        <FileText className="w-12 h-12 text-red-400 mb-3" />
        <span className="text-red-300 font-black mb-2 text-sm font-mohand">{error}</span>
        <p className="text-slate-400 text-xs font-bold mb-4 font-mohand">
          يمكنك تنزيل الملف مباشرة وقراءته على جهازك
        </p>
        <a 
          href={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors font-mohand flex items-center gap-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>فتح في المتصفح</span>
        </a>
      </div>
    );
  }

  const handleScroll = () => {
    if (!containerRef.current || totalPages === 0) return;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    let activePage = 1;
    let minDistance = Infinity;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageEl = document.getElementById(`pdf-page-${pageNum}`);
      if (pageEl) {
        const rect = pageEl.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerRect.top);
        if (distance < minDistance) {
          minDistance = distance;
          activePage = pageNum;
        }
      }
    }
    
    if (currentPage !== activePage) {
      setCurrentPage(activePage);
    }
  };

  const jumpToPage = (pageNum: number) => {
    if (isNaN(pageNum)) return;
    let target = pageNum;
    if (target < 1) target = 1;
    if (target > totalPages) target = totalPages;
    
    const pageElement = document.getElementById(`pdf-page-${target}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(target);
      setTargetPageInput("");
    }
  };

  return (
    <div 
      ref={viewerRef}
      className={`relative w-full h-full flex flex-col bg-slate-950 transition-all duration-350 select-none ${
        isFullscreen 
          ? 'fixed inset-0 z-[9999] w-screen h-screen p-4 bg-slate-950' 
          : 'rounded-2xl overflow-hidden'
      }`}
    >
      {/* Immersive interactive floating action panel */}
      {!loading && totalPages > 0 && (
        <div className="absolute top-3 left-3 z-40 flex flex-wrap items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-1.5 shadow-xl select-none max-w-[calc(100vw-2rem)]">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-blue-600 active:bg-blue-700 text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md border border-slate-700 text-xs"
            title={isFullscreen ? "تصغير الشاشة" : "تكبير ملء الشاشة"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <div className="h-4 w-[1px] bg-slate-700" />

          {/* Quick Manual Zoom Controls */}
          <button
            type="button"
            onClick={() => setZoomScale((prev) => Math.max(1.0, prev - 0.2))}
            disabled={zoomScale <= 1.0}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md border border-slate-700 text-xs"
            title="تصغير"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] font-mono font-black text-blue-400 min-w-[32px] text-center" dir="ltr">
            {Math.round(zoomScale * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoomScale((prev) => Math.min(3.5, prev + 0.2))}
            disabled={zoomScale >= 3.5}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:cursor-not-allowed text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md border border-slate-700 text-xs"
            title="تكبير"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700" />

          {/* Page Selector input form */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-white" dir="rtl">
            <span className="text-[10px] font-black text-slate-300 font-mohand">صفحة:</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={targetPageInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setTargetPageInput(val);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const num = parseInt(targetPageInput, 10);
                  if (!isNaN(num)) {
                    jumpToPage(num);
                  }
                }
              }}
              placeholder={currentPage.toString()}
              className="w-9 h-6 text-center bg-slate-900 border border-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-white rounded font-mono text-xs font-black transition-all"
            />
            {totalPages > 0 && (
              <span className="text-[10px] font-black text-slate-300 font-mono">/ {totalPages}</span>
            )}
            <button
              type="button"
              onClick={() => {
                const num = parseInt(targetPageInput, 10);
                if (!isNaN(num)) {
                  jumpToPage(num);
                }
              }}
              className="px-2 h-6 rounded bg-blue-600 hover:bg-blue-700 text-[10px] font-extrabold font-mohand text-white transition-all cursor-pointer border border-blue-500 shadow-sm"
            >
              انتقال
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-6 z-35 rounded-2xl">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-xs font-black font-mohand leading-relaxed text-center text-slate-200">
            جاري تحضير واستعراض صفحات الملف بدقة عالية...
          </p>
          <div className="w-48 bg-slate-800 h-2 rounded-full overflow-hidden mt-3 border border-slate-700">
            <div 
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${progress || 10}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-blue-400 mt-2 font-mono">{progress}% loaded</span>
        </div>
      )}

      <div 
        ref={containerRef} 
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full p-2 bg-slate-950 transition-all ${
          zoomScale > 1.05 ? 'overflow-auto touch-pan-x touch-pan-y' : 'overflow-y-auto overflow-x-hidden'
        }`}
        dir="rtl"
        style={{
          maxHeight: '100%',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div
          ref={pagesInnerRef}
          className="transition-transform duration-150 ease-out origin-top-center w-full min-h-full flex flex-col items-center"
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            marginBottom: `${(zoomScale - 1) * 85}%`
          }}
        />
      </div>
    </div>
  );
};
