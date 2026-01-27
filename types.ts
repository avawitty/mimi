
export type ZodiacSign = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface ZineTombstone {
  title: string;
  temporal_range: string;
  materials: string; // Symbolic + Literal
  source: string;
  accession_note: string;
}

export interface ZineComment {
  id: string;
  zineId: string;
  userId: string;
  userHandle: string;
  userAvatar?: string;
  audioUrl: string;
  timestamp: number;
  duration: number;
}

export interface FruitionTrajectory {
  inciting_debris: string;
  structural_pivot: string;
  climax_manifest: string;
  end_product_spec: string;
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

export interface EditorElementStyle {
  top: number;
  left: number;
  width: number;
  height?: number;
  zIndex: number;
  opacity: number;
  rotation?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontStyle?: 'normal' | 'italic';
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: string;
  backgroundColor?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  filter?: string;
}

export interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'box';
  content: string;
  style: EditorElementStyle;
  negativePrompt?: string; // Mandate: Exclude artifacts
}

export interface ZinePage {
  pageNumber: number;
  layoutType: 'standard' | 'gallery' | 'advice_wall' | 'tombstone' | 'editorial';
  headline: string;
  subhead?: string;
  bodyCopy: string;
  imagePrompt: string;
  negativePrompt?: string; // Persistent Negative Refraction
  groundingSources?: { title: string, uri: string }[];
  originalMediaUrl?: string;
  customLayout?: {
    elements: EditorElement[];
    editTrace?: { timestamp: number; note: string }[];
  };
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
  zodiac_relevance?: string; // 1-2 sentence mention of zodiac's side-relevance
  tags?: string[]; // Semiotic anchors
  blueprint?: FruitionTrajectory;
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
  thinkingTrace?: string; // Machine reasoning artifact
  isPublic?: boolean; 
  isLocked?: boolean; // Temporal Lock flag
  unlockTimestamp?: number;
}

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  REVEALED = 'REVEALED',
  ERROR = 'ERROR'
}

export type ToneTag = 'Dream' | 'Chic' | 'Unhinged' | 'Romantic' | 'Cryptic' | 'Nostalgia' | 'Academic' | 'Meme' | 'Sovereign Panic' | 'Storyline';
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface TasteManifesto {
  id: string;
  name: string;
  inspirations: string;
  hashtag: string; // Permanent archival anchor
  archetype: 'minimalist-sans' | 'editorial-serif' | 'brutalist-mono';
  paletteName: string;
  isClearMind?: boolean;
  voicePreference?: 'female' | 'male';
}

export interface UserProfile {
  uid: string;
  handle: string;
  email?: string | null;
  photoURL?: string;
  zodiacSign?: ZodiacSign;
  birthDate?: number; 
  processingMode: 'movie' | 'list' | 'fever-dream';
  currentSeason: 'rotting' | 'blooming' | 'frozen' | 'burning';
  coreNeed: 'truth' | 'comfort' | 'chaos' | 'silence';
  createdAt: number;
  lastActive?: number;
  isSwan?: boolean; 
  isSubscribed?: boolean;
  activeManifestoId?: string;
  manifestos?: TasteManifesto[];
  syncedUsers?: string[];
  tasteProfile?: {
    inspirations?: string;
    keywords?: string;
    primary_palette?: string[];
    dominant_archetypes?: string[];
  };
}

export interface PocketItem {
  id: string;
  userId: string;
  type: 'image' | 'zine_card' | 'echo' | 'palette' | 'omen' | 'script' | 'prompt_artifact';
  savedAt: number;
  content: any;
  tags?: string[];
}

export interface SeasonReport {
  timestamp: number;
  currentVibe: string;
  cliqueLogic: string;
  topScandal: {
    headline: string;
    structuralRisk: string;
  };
  aestheticPatterns?: string[];
}

export interface TasteEvent {
  userId: string;
  event_type: 'save' | 'tweak' | 'view' | 'export';
  input_context: {
    raw_text: string;
    selected_archetype?: string;
  };
  output_context: {
    zineId: string;
    layout_type: string;
    colors?: string[];
  };
  timestamp: number;
  sessionId?: string;
}

export type ProsceniumRole = 'Editor' | 'Witness' | 'Ghost';
