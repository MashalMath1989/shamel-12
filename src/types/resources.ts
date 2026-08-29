export type ResourceType = 'video' | 'pdf' | 'image' | string;

export interface ResourceItem {
  resourceTitle?: string;
  type: ResourceType;
  url: string;
  videoId?: string;
  videoTitle?: string;
  lessonId?: string | number;
  unitId?: string | number;
  duration?: string;
  thumbnail?: string;
  description?: string;
}

export interface ActiveResourceModalState {
  type: string;
  url: string;
  title: string;
}

export interface FoundationVideoItem {
  videoId?: string;
  videoTitle?: string;
  title?: string;
  originalTitle?: string;
  author?: string;
  type?: string;
  url: string;
  duration?: string;
  thumbnail?: string;
  description?: string;
  part?: number | string;
  badge?: string;
}
