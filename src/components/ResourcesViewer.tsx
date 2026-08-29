import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  FileText, 
  Image as ImageIcon, 
  X, 
  ExternalLink, 
  Video, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw 
} from 'lucide-react';
import { ResourceItem, ActiveResourceModalState } from '../types/resources';

// --- Normalization & Validation Utilities ---

export const normalizeArabic = (str: string = ''): string => {
  return str
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .replace(/الوحدة\s*(\d+|الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|الاولى|الثانيه|الثالثه|الرابعه|الخامسه|السادسه|الأول|الثاني|الثالث|الرابع|الخامس|السادس|الاول|الثانى)\s*[:\-–]\s*/gi, '')
    .replace(/الدرس\s*(\d+|الأول|الثاني|الثالث|الرابع|الخامس|السادس|الاولى|الاول|الثانى)\s*[:\-–]\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

export const isValidResourceUrl = (url?: any): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === '#' || trimmed === 'null' || trimmed === 'undefined') return false;
  if (trimmed.includes('رابط_') || trimmed.startsWith('placeholder')) return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
};

export const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
  const match = clean.match(regExp);
  return match && match[1] ? match[1] : null;
};

export const getYouTubeEmbedUrl = (url: string): string => {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  }
  // If Google Drive video
  if (url.includes('drive.google.com/file/d/')) {
    return url.replace(/\/view(\?.*)?$/, '/preview');
  }
  return url;
};

// --- In-App Resource Modals ---

export const ResourceVideoModal: React.FC<{
  isOpen: boolean;
  resource: ActiveResourceModalState | null;
  onClose: () => void;
}> = ({ isOpen, resource, onClose }) => {
  if (!isOpen || !resource) return null;

  const embedUrl = getYouTubeEmbedUrl(resource.url);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 select-none" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-3xl bg-slate-950 border-2 border-black rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col font-mohand text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center shrink-0">
                <Play className="w-3.5 h-3.5 fill-red-500" />
              </div>
              <h3 className="text-sm font-extrabold text-white truncate max-w-[200px] sm:max-w-md">
                {resource.title || 'مشاهدة الفيديو'}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 text-xs"
                title="فتح الرابط في نافذة جديدة"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Container (16:9 Aspect Ratio) */}
          <div className="relative w-full pb-[56.25%] bg-black">
            <iframe
              src={embedUrl}
              title={resource.title || "مشغل الفيديو"}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const ResourceImageModal: React.FC<{
  isOpen: boolean;
  resource: ActiveResourceModalState | null;
  onClose: () => void;
}> = ({ isOpen, resource, onClose }) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen) setZoom(1);
  }, [isOpen, resource?.url]);

  if (!isOpen || !resource) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-3xl bg-slate-900 border-2 border-black rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col font-mohand text-white max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {resource.title || 'عرض الصورة'}
              </h3>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer text-xs"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer text-xs"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer text-xs"
                  title="إعادة ضبط الحجم"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <a
                href={resource.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 text-xs"
                title="تنزيل الصورة"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image Canvas */}
          <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-slate-950 min-h-[300px]">
            <img
              src={resource.url}
              alt={resource.title || "الصورة"}
              style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg select-none"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const ResourcePdfModal: React.FC<{
  isOpen: boolean;
  resource: ActiveResourceModalState | null;
  onClose: () => void;
  pdfViewerComponent?: React.ReactNode;
}> = ({ isOpen, resource, onClose, pdfViewerComponent }) => {
  if (!isOpen || !resource) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 select-none" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border-2 border-black rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col font-mohand text-white h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h3 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {resource.title || 'ملف PDF'}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={resource.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors border border-blue-500 text-xs font-bold"
                title="تنزيل ملف PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تنزيل</span>
              </a>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 text-xs"
                title="فتح الرابط في نافذة جديدة"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Viewer Area */}
          <div className="flex-1 w-full h-full bg-slate-950 overflow-hidden relative">
            {pdfViewerComponent ? (
              pdfViewerComponent
            ) : (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
                title={resource.title || 'عرض PDF'}
                className="w-full h-full border-0"
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// --- Horizontal Rows for Lessons and Units ---

export const LessonResourcesRow: React.FC<{
  resources: ResourceItem[];
  onOpenResource: (res: ResourceItem) => void;
  lessonTitle?: string;
}> = ({ resources, onOpenResource }) => {
  const validResources = (resources || []).filter(r => isValidResourceUrl(r?.url));
  if (validResources.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 px-2 pb-1 font-mohand">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-black text-slate-600 ml-1 select-none shrink-0">
          المصادر:
        </span>
        {validResources.map((res, idx) => {
          const type = (res.type || '').toLowerCase();
          const title = res.resourceTitle?.trim() || (
            type === 'video' ? 'شرح فيديو' :
            type === 'pdf' ? 'ملخص PDF' :
            type === 'image' ? 'صورة توضيحية' : 'مورد إضافي'
          );

          let icon = <Video className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
          let badgeStyle = "bg-rose-50 hover:bg-rose-100/90 text-rose-900 border-rose-200";

          if (type === 'pdf') {
            icon = <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
            badgeStyle = "bg-blue-50 hover:bg-blue-100/90 text-blue-900 border-blue-200";
          } else if (type === 'image') {
            icon = <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
            badgeStyle = "bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border-emerald-200";
          }

          return (
            <button
              key={`${type}-${idx}-${res.url}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenResource(res);
              }}
              className={`h-7 px-2.5 rounded-md text-[11px] font-bold border flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer hover:shadow-xs ${badgeStyle}`}
              title={title}
            >
              {icon}
              <span className="truncate max-w-[140px] whitespace-nowrap">{title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const UnitResourcesRow: React.FC<{
  resources: ResourceItem[];
  onOpenResource: (res: ResourceItem) => void;
  unitTitle?: string;
}> = ({ resources, onOpenResource }) => {
  const validResources = (resources || []).filter(r => isValidResourceUrl(r?.url));
  if (validResources.length === 0) return null;

  return (
    <div className="mt-3 mx-2 mb-2 p-2.5 bg-blue-50/90 rounded-md border border-blue-200/80 font-mohand shadow-2xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-black text-slate-700 select-none shrink-0">
          مصادر الوحدة:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {validResources.map((res, idx) => {
            const type = (res.type || '').toLowerCase();
            const title = res.resourceTitle?.trim() || (
              type === 'pdf' ? 'ملخص الوحدة (PDF)' :
              type === 'video' ? 'شرح فيديو للوحدة' :
              type === 'image' ? 'مخطط الوحدة' : 'مورد الوحدة'
            );

            let icon = <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
            let badgeStyle = "bg-white hover:bg-slate-100 text-slate-800 border-black";

            if (type === 'video') {
              icon = <Play className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />;
            } else if (type === 'image') {
              icon = <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
            }

            return (
              <button
                key={`${type}-${idx}-${res.url}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenResource(res);
                }}
                className={`h-7 px-2.5 rounded-md text-[11px] font-bold border flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer ${badgeStyle}`}
                title={title}
              >
                {icon}
                <span className="truncate max-w-[160px] whitespace-nowrap">{title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Custom Hook to Fetch Structure Sources from Dynamic GitHub JSON ---

export const useSemesterSources = (semesterId: number) => {
  const [sourcesData, setSourcesData] = useState<any[]>(() => {
    const cached = localStorage.getItem(`cached_math12_sources_s${semesterId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    let isMounted = true;

    const fetchSources = async () => {
      try {
        const primaryUrl = semesterId === 1
          ? 'https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math12StructureSources_S1.json'
          : 'https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math12StructureSources_S2.json';
        
        const fallbackUrl = semesterId === 1
          ? 'https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/MathStructureSources11_S1.json'
          : 'https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/JoSchool112010/MathStructureSources11_S2.json';

        // Cache-busting URL parameter to always get fresh data from GitHub
        const cacheBuster = `?t=${Date.now()}`;

        let res = await fetch(`${primaryUrl}${cacheBuster}`, { cache: 'no-cache' }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(primaryUrl).catch(() => null);
        }
        if (!res || !res.ok) {
          res = await fetch(fallbackUrl).catch(() => null);
        }

        if (res && res.ok) {
          const json = await res.json();
          const parsedData = Array.isArray(json) ? json : [json];
          if (isMounted) {
            setSourcesData(parsedData);
            try {
              localStorage.setItem(`cached_math12_sources_s${semesterId}`, JSON.stringify(parsedData));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn(`Could not fetch dynamic sources for semester ${semesterId}:`, err);
      }
    };

    fetchSources();
    return () => {
      isMounted = false;
    };
  }, [semesterId]);

  const getUnitResources = (unitId: number | string, unitTitle?: string): ResourceItem[] => {
    const results: ResourceItem[] = [];

    if (sourcesData && sourcesData.length > 0) {
      const root = sourcesData[0];
      const unitsList = root?.units || (Array.isArray(sourcesData) && sourcesData[0]?.unitId ? sourcesData : []);
      
      if (Array.isArray(unitsList)) {
        const unitStr = typeof unitId === 'number' ? `unit${unitId}` : String(unitId);
        const normUnitTitle = normalizeArabic(unitTitle);

        const unitObj = unitsList.find((u: any) => 
          u.unitId === unitStr || 
          String(u.unitId) === String(unitId) ||
          u.unitId === `u${unitId}` ||
          (normUnitTitle && u.unitTitle && (
            normalizeArabic(u.unitTitle).includes(normUnitTitle) || 
            normUnitTitle.includes(normalizeArabic(u.unitTitle))
          ))
        );

        if (unitObj && Array.isArray(unitObj.resources)) {
          unitObj.resources.forEach((r: any) => {
            if (isValidResourceUrl(r?.url)) {
              results.push(r);
            }
          });
        }
      }
    }

    return results;
  };

  const getLessonResources = (
    unitId: number | string, 
    lessonId: number | string, 
    lessonTitle?: string, 
    unitTitle?: string
  ): ResourceItem[] => {
    if (!sourcesData || sourcesData.length === 0) return [];
    const root = sourcesData[0];
    const unitsList = root?.units || (Array.isArray(sourcesData) && sourcesData[0]?.unitId ? sourcesData : []);
    if (!Array.isArray(unitsList)) return [];

    const unitStr = typeof unitId === 'number' ? `unit${unitId}` : String(unitId);
    const normUnitTitle = normalizeArabic(unitTitle);

    const unitObj = unitsList.find((u: any) => 
      u.unitId === unitStr || 
      String(u.unitId) === String(unitId) ||
      u.unitId === `u${unitId}` ||
      (normUnitTitle && u.unitTitle && (
        normalizeArabic(u.unitTitle).includes(normUnitTitle) || 
        normUnitTitle.includes(normalizeArabic(u.unitTitle))
      ))
    );

    if (!unitObj || !Array.isArray(unitObj.lessons)) return [];

    const lessonStr = typeof lessonId === 'number' ? `L${lessonId}` : String(lessonId);
    const normLessonTitle = normalizeArabic(lessonTitle);

    const lessonObj = unitObj.lessons.find((l: any) => 
      l.lessonId === lessonStr || 
      String(l.lessonId) === String(lessonId) ||
      l.lessonId === `lesson${lessonId}` ||
      (normLessonTitle && l.lessonTitle && (
        normalizeArabic(l.lessonTitle).includes(normLessonTitle) || 
        normLessonTitle.includes(normalizeArabic(l.lessonTitle))
      ))
    );

    return (lessonObj?.resources || []).filter((r: any) => isValidResourceUrl(r?.url));
  };

  return {
    sourcesData,
    getUnitResources,
    getLessonResources
  };
};
