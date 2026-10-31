import React, { useState, useEffect, useRef } from 'react';

export interface FastPdfViewerProps {
  url: string;
  title?: string;
}

export const FastPdfViewer: React.FC<FastPdfViewerProps> = ({ url, title }) => {
  const cleanUrl = (url || '').trim();
  const [progress, setProgress] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!cleanUrl) return;

    // Reset loading state and progress
    setIsLoading(true);
    setProgress(15);

    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    // Smooth horizontal progress stepping
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        if (prev < 45) return prev + Math.floor(Math.random() * 8) + 6;
        if (prev < 75) return prev + Math.floor(Math.random() * 5) + 3;
        return prev + Math.floor(Math.random() * 2) + 1;
      });
    }, 130);

    // Fallback safety timeout so the viewer is always revealed even if iframe onLoad doesn't trigger
    safetyTimeoutRef.current = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 300);
    }, 8500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [cleanUrl, reloadKey]);

  const handleIframeLoad = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  if (!cleanUrl) return null;

  // Display the document directly using Google Docs viewer (no file download triggered)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true`;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none font-mohand" dir="rtl">
      {/* Top horizontal progress indicator */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-slate-800 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 transition-all duration-200 ease-out shadow-sm shadow-blue-500/50"
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          />
        </div>
      )}

      {/* Central Horizontal Progress Bar & Percentage display */}
      {isLoading && (
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 transition-opacity duration-300"
          dir="rtl"
        >
          <div className="w-80 max-w-[90%] bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-3.5">
            {/* Header with Title and Percentage */}
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-500/50 shrink-0" />
                <span className="text-slate-100 truncate">
                  {title || 'جاري فتح ملف PDF...'}
                </span>
              </div>
              {/* Percentage Badge */}
              <div className="flex items-baseline gap-0.5 text-blue-400 font-black font-mono text-sm bg-blue-950/70 px-2 py-0.5 rounded-md border border-blue-800/50 shrink-0" dir="ltr">
                <span>{Math.min(100, Math.round(progress))}</span>
                <span className="text-xs text-blue-300">%</span>
              </div>
            </div>

            {/* Horizontal Loading Bar Track */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-200 ease-out shadow-md shadow-blue-500/30"
                style={{ width: `${Math.min(100, Math.round(progress))}%` }}
              />
            </div>

            {/* Status text */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-0.5">
              <span>
                {progress >= 100 
                  ? 'تم تجهيز الملف! جاري العرض...' 
                  : 'جاري معالجة وعرض المستند...'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                {Math.min(100, Math.round(progress))}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewport via Google Docs Viewer */}
      <iframe
        key={reloadKey}
        src={googleViewerUrl}
        title={title || "عارض مستند PDF"}
        className="w-full h-full border-0 bg-white"
        allow="fullscreen"
        allowFullScreen
        onLoad={handleIframeLoad}
      />
    </div>
  );
};
