
export interface ZineTombstone {
  title: string;
  temporal_range: string;
  materials: string; // Symbolic + Literal
  source: string;
  accession_note: string;
}

export interface ZineAnalysis {
  visualPalette: string[]; 
  colorTheory?: string; 
  emotionalPalette: string[];
  recurringThemes: string[];
  centralMetaphor: string;
  logicTrace?: string; 
  vibeIndex: string[]; // lowercase tags
}

export interface ZineContent {
  title: string;
  tombstone: ZineTombstone;
  oracular_mirror: string; // 1-2 sentence poetic reframing
  expanded_reflection: string; // 80-140 words
  archetype_identity?: string; 
  culturalContext?: string; 
  analysis?: ZineAnalysis; 
  pages: ZinePage[];
  voiceoverScript: string;
  ambientDirection: string;
  originalThought?: string; // Seed text reveal ritual
  sourceArtifacts?: { url: string, type: 'image' | 'video' | 'audio', style?: Partial<EditorElementStyle> }[];
}

export interface CommunityFragment {
  id: string;
  url: string;
  type: 'image' | 'audio';
  userHandle: string;
  timestamp: number;
  tags?: string[];
}

export interface ZinePage {
  pageNumber: number;
  layoutType: 
    | 'cover' 
    | 'full-bleed-image' 
    | 'editorial-spread' 
    | 'minimal-script' 
    | 'museum-label'
    | 'brutalist-fragment'
    | 'source-artifact'
    | 'collage'
    | 'two-column-text' 
    | 'split-image-text'
    | 'sponsored-spread'; 
  headline?: string;
  subhead?: string;
  bodyCopy?: string;
  imagePrompt: string;
  audioNotes?: string;
  voiceNoteUrl?: string; 
  originalMediaUrl?: string; 
  mediaType?: 'audio' | 'video' | 'image';
  artifacts?: { url: string, type: 'image' | 'video' | 'audio', caption?: string, style?: Partial<EditorElementStyle> }[];
  groundingSources?: { title: string, uri: string }[];
  
  customLayout?: {
    elements: EditorElement[];
    backgroundColor?: string;
    editTrace?: { timestamp: number; note: string }[];
  };
}

export interface EditorElementStyle {
  top: number; 
  left: number; 
  width: number; 
  height?: number; 
  fontSize?: number; 
  fontFamily?: 'serif' | 'sans' | 'mono';
  fontWeight?: '400' | '900';
  color?: string;
  backgroundColor?: string;
  zIndex: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  opacity?: number;
  letterSpacing?: string;
  lineHeight?: number;
  fontStyle?: 'normal' | 'italic';
  rotation?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  aspectRatio?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  boxShadow?: string;
  volume?: number; 
  filter?: string; 
}

export interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'box';
  content: string; 
  style: EditorElementStyle;
  voiceNoteUrl?: string; 
}

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  REVEALED = 'REVEALED',
  ERROR = 'ERROR'
}

export type CliqueRole = 'Editor' | 'Witness' | 'Ghost';

export interface UserProfile {
  uid: string;
  handle: string;
  photoURL?: string;
  processingMode: 'movie' | 'list' | 'fever-dream';
  currentSeason: 'rotting' | 'blooming' | 'frozen' | 'burning';
  coreNeed: 'truth' | 'comfort' | 'chaos' | 'silence';
  createdAt: number;
  syncedUsers?: string[]; 
  lastActive?: number;
  cliqueRole?: CliqueRole;
  isSwan?: boolean; 
  tasteProfile?: {
    inspirations?: string;
    favoriteMedia?: string;
    keywords?: string;
    primary_palette?: string[];
    dominant_archetypes?: string[];
  };
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
  isDeepThinking?: boolean;
  engagementSlots?: number; 
  isPublic?: boolean; // Visibility Flag
}

export interface Echo {
  id: string;
  userId: string;
  userHandle: string;
  userAvatar?: string;
  type: 'audio' | 'text';
  audioUrl?: string;
  text?: string;
  timestamp: number;
  duration?: number;
}

export interface PocketItem {
  id: string;
  userId: string;
  type: 'image' | 'zine_card' | 'echo' | 'palette' | 'omen' | 'script';
  savedAt: number;
  content: {
    imageUrl?: string;
    prompt?: string;
    aspectRatio?: string;
    zineId?: string;
    zineTitle?: string;
    zineArchetype?: string;
    zineTone?: ToneTag;
    userHandle?: string;
    userAvatar?: string;
    audioUrl?: string;
    duration?: number;
    colors?: string[];
    colorTheory?: string;
    emotions?: string[];
    metaphor?: string;
    omenText?: string;
    scriptBody?: string;
    scriptHeadline?: string;
  };
}

export type ToneTag = 'Corporate' | 'Chic' | 'Unhinged' | 'Romantic' | 'Cryptic' | '2014-Tumblr' | 'Academic';
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface TasteRecord {
  userId: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  basePrompt: string;
  editPrompt: string;
  timestamp: number;
}

export interface TasteEvent {
  userId?: string;
  sessionId?: string;
  event_type: 'save' | 'tweak';
  input_context: {
    raw_text: string;
    selected_archetype?: string;
  };
  output_context: {
    generated_image_url?: string;
    card_id?: string;
    layout_type?: string;
    colors?: string[];
    zineId?: string;
    zineTitle?: string;
    zineArchetype?: string;
  };
  parameters?: Record<string, any>;
  timestamp?: number;
}

export interface SeasonReport {
  currentVibe: string;
  topScandal: {
    headline: string;
    summary: string;
    structuralRisk: string;
  };
  cliqueLogic: string;
  timestamp: number;
}

export interface CliqueGossip {
  targetHandle: string;
  critique: string;
  structuralRisk: 'Low' | 'Medium' | 'High' | 'Critical';
}
