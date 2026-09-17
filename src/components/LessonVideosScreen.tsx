import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, Video, Loader2, Info } from 'lucide-react';
import { ResourceItem, ActiveResourceModalState } from '../types/resources';
import { 
  getYouTubeId, 
  isValidResourceUrl, 
  ResourceVideoModal,
  useSemesterSources 
} from './ResourcesViewer';

export interface EnrichedLessonVideo {
  url: string;
  title: string;
  originalTitle?: string;
  author?: string;
  thumbnail?: string;
  duration?: string;
}

export interface LessonVideosScreenProps {
  lessonId: number | string;
  lessonTitle: string;
  unitId: number | string;
  unitTitle?: string;
  semesterId: number;
  initialResources?: ResourceItem[];
  onBack: () => void;
}

export const LessonVideosScreen: React.FC<LessonVideosScreenProps> = ({
  lessonId,
  lessonTitle,
  unitId,
  unitTitle,
  semesterId,
  initialResources = [],
  onBack,
}) => {
  const { getLessonResources } = useSemesterSources(semesterId);
  const cacheKey = `cached_math12_lesson_videos_${semesterId}_${unitId}_${lessonId}`;

  // Initial video list from cache, initialResources, or empty
  const [videos, setVideos] = useState<EnrichedLessonVideo[]>(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((v: EnrichedLessonVideo) => isValidResourceUrl(v?.url));
        }
      } catch (e) {}
    }

    // Fallback to initialResources if provided
    const validInitial = (initialResources || [])
      .filter(r => (r?.type || '').toLowerCase() === 'video' && isValidResourceUrl(r?.url))
      .map((r, idx) => {
        const ytId = getYouTubeId(r.url);
        const thumb = r.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
        const title = r.resourceTitle || r.videoTitle || `حصة الشرح ${idx + 1}`;
        return {
          url: r.url,
          title,
          thumbnail: thumb,
          originalTitle: r.description || ''
        };
      });

    return validInitial;
  });

  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ActiveResourceModalState | null>(null);

  // Fetch or update videos from semester sources data and enrich with oEmbed
  useEffect(() => {
    let isMounted = true;

    const loadAndEnrichVideos = async () => {
      setLoading(true);
      try {
        const rawResources = getLessonResources(unitId, lessonId, lessonTitle, unitTitle);
        const videoResources = (rawResources.length > 0 ? rawResources : initialResources)
          .filter(r => (r?.type || '').toLowerCase() === 'video' && isValidResourceUrl(r?.url));

        if (videoResources.length === 0) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        const enrichedList: EnrichedLessonVideo[] = await Promise.all(
          videoResources.map(async (item, idx) => {
            const ytId = getYouTubeId(item.url);
            const defaultThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
            const title = item.resourceTitle || item.videoTitle || `حصة الشرح ${idx + 1}`;
            
            let originalTitle = item.description || '';
            let author = '';
            let thumbnail = item.thumbnail || defaultThumb;

            try {
              const embedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(item.url)}`);
              if (embedRes.ok) {
                const embedData = await embedRes.json();
                if (embedData.title) {
                  originalTitle = embedData.title;
                }
                if (embedData.author_name) {
                  author = embedData.author_name;
                }
                if (embedData.thumbnail_url) {
                  thumbnail = embedData.thumbnail_url;
                }
              }
            } catch (e) {
              // Silently continue if oEmbed fails
            }

            return {
              url: item.url,
              title,
              originalTitle: originalTitle || `${lessonTitle} - الرياضيات العلمي`,
              author,
              thumbnail: thumbnail || defaultThumb
            };
          })
        );

        if (isMounted) {
          setVideos(enrichedList);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(enrichedList));
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Could not fetch or enrich lesson videos:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAndEnrichVideos();

    return () => {
      isMounted = false;
    };
  }, [lessonId, unitId, semesterId, lessonTitle, unitTitle]);

  // Handle browser/phone back button when video modal is active
  useEffect(() => {
    if (!activeVideo) return;

    try {
      window.history.pushState({ lessonVideoOpen: true }, "");
    } catch (e) {
      console.warn("Could not push state to window history:", e);
    }

    const handlePopState = () => {
      setActiveVideo(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeVideo]);

  const handleCardClick = (video: EnrichedLessonVideo) => {
    if (isValidResourceUrl(video.url)) {
      setActiveVideo({
        type: 'video',
        url: video.url,
        title: video.title || lessonTitle || 'حصة الشرح'
      });
    }
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
    try {
      if (window.history.state?.lessonVideoOpen) {
        window.history.back();
      }
    } catch (e) {
      console.warn("Could not step back in history:", e);
    }
  };

  const validVideos = videos.filter(v => isValidResourceUrl(v.url));

  return (
    <div className="min-h-screen bg-[#e8d5c4] py-4 px-3 sm:py-6 sm:px-4 font-mohand select-none text-slate-900" dir="rtl">
      <div className="max-w-xl mx-auto space-y-3.5">
        
        {/* Top Header Card Matching Foundation Videos Header */}
        <div className="bg-[#0c1322] text-white rounded-3xl p-3 sm:p-4 border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3">
          {/* Right Section: Red Play Icon + Header Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#ef233c] flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white translate-x-[-1px]" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-white truncate">
                حصص الشرح - {lessonTitle}
              </h1>
              <p className="text-xs text-slate-300 font-bold truncate mt-0.5">
                {unitTitle ? `${unitTitle} • ` : ''}الفصل {semesterId === 1 ? 'الأول' : 'الثاني'} • فيديوهات الشرح
              </p>
            </div>
          </div>

          {/* Left Section: Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-slate-900 border-2 border-black flex items-center justify-center shrink-0 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="العودة للدرس"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Section Sub-Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block"></span>
            <h2 className="text-sm sm:text-base font-black text-slate-800">
              قائمة فيديوهات الشرح
            </h2>
          </div>

          <div className="px-3 py-1 rounded-xl bg-[#e2e8f0] text-slate-600 text-xs font-black border border-slate-300 flex items-center gap-1.5">
            {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
            <span>{validVideos.length} حصة</span>
          </div>
        </div>

        {/* Video Cards List (Video on the RIGHT, Title on the LEFT in RTL) */}
        {validVideos.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {validVideos.map((vid, index) => {
              const ytId = getYouTubeId(vid.url);
              const thumbUrl = vid.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
              const title = vid.title || `حصة الشرح ${index + 1}`;
              const originalTitle = vid.originalTitle || `${lessonTitle} - رياضيات التوجيهي العلمي`;

              return (
                <motion.div
                  key={`${vid.url}-${index}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleCardClick(vid)}
                  className="bg-white rounded-2xl border border-black shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_#000] p-3 sm:p-3.5 flex items-center justify-between gap-3.5 transition-all group cursor-pointer"
                >
                  {/* 1. Video Thumbnail (First child -> On the RIGHT in RTL) */}
                  <div className="w-32 h-20 sm:w-40 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-black relative bg-slate-900 shadow-2xs">
                    {thumbUrl ? (
                      <img 
                        src={thumbUrl} 
                        alt={title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400">
                        <Video className="w-6 h-6 text-slate-500" />
                      </div>
                    )}

                    {/* Play Indicator Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                      <div className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 active:scale-95 transition-all border border-white opacity-0 group-hover:opacity-100">
                        <Play className="w-3.5 h-3.5 fill-white mr-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* 2. Text Content (Second child -> On the LEFT in RTL) */}
                  <div className="flex-1 min-w-0 text-right">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                      {title}
                    </h3>
                    
                    <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed mt-1" dir="rtl">
                      {originalTitle}
                    </p>

                    {vid.author && (
                      <span className="inline-block text-[10px] font-bold text-slate-400 mt-1">
                        {vid.author}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty state if lesson has no videos yet */
          <div className="bg-white rounded-2xl border border-black shadow-[2px_2px_0px_#000] p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto">
              <Video className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                لا توجد فيديوهات شرح متاحة حالياً
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-sm mx-auto">
                سيتم رفع وإضافة حصص الشرح الخاصة بدرس &quot;{lessonTitle}&quot; فور توفرها وتحديثها من المعلمين.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black border-2 border-black hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة الدروس</span>
            </button>
          </div>
        )}

      </div>

      {/* Video Modal Player */}
      <ResourceVideoModal
        isOpen={Boolean(activeVideo)}
        resource={activeVideo}
        onClose={handleCloseVideo}
      />
    </div>
  );
};
