import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, Video, Loader2 } from 'lucide-react';
import { FoundationVideoItem, ActiveResourceModalState } from '../types/resources';
import { 
  getYouTubeId, 
  isValidResourceUrl, 
  ResourceVideoModal 
} from './ResourcesViewer';

const FOUNDATION_JSON_URL = 'https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math12BasicsSources_S1.json';

const FALLBACK_FOUNDATION_VIDEOS: FoundationVideoItem[] = [
  {
    videoId: "foundation1",
    videoTitle: "حصة التأسيس 1",
    type: "video",
    url: "https://youtu.be/fvkR1lqlP7w?si=GdBtwCw5USmTpWFr",
    originalTitle: "الحصه الاولى تاسيس جيل 2009",
    author: "نادر اقطيط",
    thumbnail: "https://i.ytimg.com/vi/fvkR1lqlP7w/hqdefault.jpg"
  },
  {
    videoId: "foundation2",
    videoTitle: "حصة التأسيس 2",
    type: "video",
    url: "https://youtu.be/1Rfx5Y95NQE?si=cfRXli8nF7W9f0eT",
    originalTitle: "حصة التأسيس الثانية جيل 2009",
    author: "نادر اقطيط",
    thumbnail: "https://i.ytimg.com/vi/1Rfx5Y95NQE/hqdefault.jpg"
  },
  {
    videoId: "foundation3_part2",
    videoTitle: "حصة التأسيس 3",
    type: "video",
    url: "https://youtu.be/fFLlFVQLu1U?si=TES6u0vPTmUUmGAk",
    originalTitle: "حصة التأسيس الثالثة جيل 2009",
    author: "نادر اقطيط",
    thumbnail: "https://i.ytimg.com/vi/fFLlFVQLu1U/hqdefault.jpg"
  },
  {
    videoId: "foundation4",
    videoTitle: "حصة التأسيس 4",
    type: "video",
    url: "https://youtu.be/tJ_qvDmoVZ0?si=OdZGiKV6qGSLhWVM",
    originalTitle: "حصة التأسيس الرابعة جيل 2009",
    author: "نادر اقطيط",
    thumbnail: "https://i.ytimg.com/vi/tJ_qvDmoVZ0/hqdefault.jpg"
  },
  {
    videoId: "foundation5",
    videoTitle: "حصة التأسيس 5",
    type: "video",
    url: "https://youtu.be/ALI39GNyHfg?si=kvhJVKlZIHIUJ1Ck",
    originalTitle: "حصة التاسيس الخامسة جيل 2009",
    author: "نادر اقطيط",
    thumbnail: "https://i.ytimg.com/vi/ALI39GNyHfg/hqdefault.jpg"
  },
  {
    videoId: "foundation6",
    videoTitle: "حصة التأسيس 6",
    type: "video",
    url: "https://youtu.be/b1RIPx5mhs4?si=YiyDuCpAKvCzXrhW",
    originalTitle: "حصة التاسيس السادسة جيل 2009",
    author: "نادر اقطيط",
    thumbnail: "https://i.ytimg.com/vi/b1RIPx5mhs4/hqdefault.jpg"
  },
  {
    videoId: "foundation7",
    videoTitle: "حصة التأسيس 7",
    type: "video",
    url: "https://youtu.be/UvighMe-P0E?si=1TdVnPYuYh5s0qou",
    originalTitle: "حصة التاسيس السابعة جيل 2009",
    author: "نادر اقطيط",
    thumbnail: "https://i.ytimg.com/vi/UvighMe-P0E/hqdefault.jpg"
  }
];

export const FoundationVideosScreen: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const [videos, setVideos] = useState<FoundationVideoItem[]>(() => {
    const cached = localStorage.getItem('cached_math12_foundation_videos');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((v: FoundationVideoItem) => isValidResourceUrl(v?.url));
        }
      } catch (e) {}
    }
    return FALLBACK_FOUNDATION_VIDEOS;
  });

  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ActiveResourceModalState | null>(null);

  // Fetch foundation videos from the specified JSON URL and fetch original titles
  useEffect(() => {
    let isMounted = true;

    const fetchVideosAndTitles = async () => {
      setLoading(true);
      try {
        const res = await fetch(FOUNDATION_JSON_URL);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json[0]?.foundation) {
            // Filter only items with valid URLs
            const rawList: FoundationVideoItem[] = json[0].foundation.filter((item: FoundationVideoItem) => isValidResourceUrl(item.url));

            // Enrich items with original titles and thumbnails
            const enrichedList: FoundationVideoItem[] = await Promise.all(
              rawList.map(async (item) => {
                const ytId = getYouTubeId(item.url);
                const defaultThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
                
                // If item already has an original title or fallback exists
                const fallbackItem = FALLBACK_FOUNDATION_VIDEOS.find(f => f.videoId === item.videoId || f.url === item.url);
                let originalTitle = item.originalTitle || fallbackItem?.originalTitle || '';
                let author = item.author || fallbackItem?.author || '';
                let thumbnail = item.thumbnail || defaultThumb;

                if (!originalTitle) {
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
                    console.warn("Could not fetch oEmbed for", item.url, e);
                  }
                }

                return {
                  ...item,
                  originalTitle,
                  author,
                  thumbnail: thumbnail || defaultThumb
                };
              })
            );

            if (isMounted) {
              setVideos(enrichedList);
              try {
                localStorage.setItem('cached_math12_foundation_videos', JSON.stringify(enrichedList));
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.warn("Could not fetch latest foundation videos, using cached/fallback list:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideosAndTitles();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle phone/browser back button to gracefully return to foundation videos list from video playback
  useEffect(() => {
    if (!activeVideo) return;

    try {
      window.history.pushState({ videoOpen: true }, "");
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

  const handleCardClick = (video: FoundationVideoItem) => {
    if (isValidResourceUrl(video.url)) {
      setActiveVideo({
        type: 'video',
        url: video.url,
        title: video.videoTitle || video.title || video.originalTitle || 'حصة التأسيس'
      });
    }
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
  };

  // Only show videos with valid URLs
  const validVideos = videos.filter(v => isValidResourceUrl(v.url));

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-3 sm:py-6 sm:px-4 font-mohand select-none text-slate-900" dir="rtl">
      <div className="max-w-xl mx-auto space-y-3.5">
        
        {/* Top Header Card Matching the Design */}
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
                حصص التأسيس - الرياضيات
              </h1>
              <p className="text-xs text-slate-300 font-bold truncate mt-0.5">
                الفصل الأول • فيديوهات التأسيس الشاملة
              </p>
            </div>
          </div>

          {/* Left Section: Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-slate-900 border-2 border-black flex items-center justify-center shrink-0 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="العودة"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Section Sub-Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block"></span>
            <h2 className="text-sm sm:text-base font-black text-slate-800">
              قائمة فيديوهات التأسيس
            </h2>
          </div>

          <div className="px-3 py-1 rounded-xl bg-[#e2e8f0] text-slate-600 text-xs font-black border border-slate-300 flex items-center gap-1.5">
            {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
            <span>{validVideos.length} حصة</span>
          </div>
        </div>

        {/* Video Cards List (Video on the RIGHT, Title on the LEFT) */}
        <div className="flex flex-col gap-3.5">
          {validVideos.map((vid, index) => {
            const ytId = getYouTubeId(vid.url);
            const thumbUrl = vid.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');
            const title = vid.videoTitle || vid.title || `حصة التأسيس ${index + 1}`;
            const originalTitle = vid.originalTitle || 'فيديو تأسيس مادة الرياضيات';

            return (
              <motion.div
                key={vid.videoId || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleCardClick(vid)}
                className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] p-3 sm:p-3.5 flex items-center justify-between gap-3.5 transition-all group hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_#000] cursor-pointer"
              >
                {/* 1. Video Thumbnail (First child -> On the RIGHT in RTL) */}
                <div className="w-32 h-20 sm:w-40 sm:h-24 shrink-0 rounded-xl overflow-hidden border-2 border-black relative bg-slate-900 shadow-2xs">
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
                </div>
              </motion.div>
            );
          })}
        </div>

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
