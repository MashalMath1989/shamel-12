import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export interface FastPdfViewerProps {
  url: string;
  title?: string;
}

export const FastPdfViewer: React.FC<FastPdfViewerProps> = ({ url, title }) => {
  // Always use the authentic original vector PDF engine (preserves Arabic font shaping and math formatting 100%)
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);

  // Original vector PDF viewer URL via Google Docs Viewer
  const originalViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  useEffect(() => {
    setIframeLoading(true);
  }, [url]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden" dir="rtl">
      {iframeLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-950 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-3 shadow-lg">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <h4 className="text-sm font-extrabold text-white mb-1">
            جاري تحميل ملف الـ PDF...
          </h4>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            يرجى الانتظار لحظات حتى اكتمال تجهيز صفحات المستند.
          </p>
        </div>
      )}

      <iframe
        src={originalViewerUrl}
        title={title || "عارض مستند PDF"}
        className="w-full h-full border-0 bg-white"
        allow="fullscreen"
        allowFullScreen
        onLoad={() => setIframeLoading(false)}
      />
    </div>
  );
};
