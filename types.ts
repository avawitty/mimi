
export interface ZinePage {
  pageNumber: number;
  layoutType: 
    | 'cover' 
    | 'full-bleed-image' 
    | 'text-spread' 
    | 'minimal-quote' 
    | 'credits' 
    | 'source-artifact'
    | 'collage'; // Displays multiple raw artifacts in a grid
  headline?: string;
  subhead?: string;
  bodyCopy?: string;
  imagePrompt: string;
  audioNotes?: string;
  originalMediaUrl?: string; // URL to the user's uploaded audio/video
  mediaType?: 'audio' | 'video' | 'image';
  // For collage layout
  artifacts?: { url: string, type: 'image' | 'video' | 'audio', caption?: string }[];
}

export interface ZineAnalysis {
  visualPalette: string[]; // HEX Codes
  colorTheory?: string; // e.g. "Monochromatic", "Triadic"
  emotionalPalette: string[];
  recurringThemes: string[];
  centralMetaphor: string;
}

export interface ZineContent {
  title: string;
  archetype_identity?: string; // e.g. "The Velvet Rot", "Neon Nostalgia"
  culturalContext?: string; // Derived from Google Search
  analysis?: ZineAnalysis; // Made optional for legacy support
  pages: ZinePage[];
  voiceoverScript: string;
  ambientDirection: string;
}

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  REVEALED = 'REVEALED',
  ERROR = 'ERROR'
}

export interface UserTasteProfile {
  inspirations: string; // Comma separated list or block text
  favoriteMedia: string; // Movies, books, albums
  keywords: string; // Personal semantic markers
}

export interface UserProfile {
  uid: string;
  handle: string;
  photoURL?: string;
  processingMode: 'movie' | 'list' | 'fever-dream';
  currentSeason: 'rotting' | 'blooming' | 'frozen' | 'burning';
  coreNeed: 'truth' | 'comfort' | 'chaos' | 'silence';
  tasteProfile?: UserTasteProfile;
  createdAt: number;
}

export interface ZineMetadata {
  id: string;
  userId: string;
  userHandle: string;
  userAvatar?: string;
  title: string;
  tone: ToneTag;
  coverImagePrompt?: string;
  coverImageUrl?: string;
  timestamp: number;
  likes: number;
  content: ZineContent;
}

export interface Echo {
  id: string;
  userId: string;
  userHandle: string;
  type?: 'audio' | 'text'; // New field
  audioUrl?: string;
  text?: string; // New field for footnotes
  timestamp: number;
  duration?: number;
}

export interface PocketItem {
  id: string;
  userId: string;
  type: 'image' | 'zine_card' | 'echo' | 'palette';
  savedAt: number;
  content: {
    // For Images
    imageUrl?: string;
    prompt?: string;
    aspectRatio?: string;
    
    // For Zine Cards (Snapshot of metadata)
    zineId?: string;
    zineTitle?: string;
    zineArchetype?: string;
    zineTone?: ToneTag;
    userHandle?: string;
    userAvatar?: string;

    // For Echoes
    audioUrl?: string;
    duration?: number;

    // For Palettes (Analysis)
    colors?: string[];
    colorTheory?: string;
    emotions?: string[];
    metaphor?: string;
  };
}

export type ToneTag = 'Corporate' | 'Chic' | 'Unhinged' | 'Romantic' | 'Cryptic' | '2014-Tumblr' | 'Academic';

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
