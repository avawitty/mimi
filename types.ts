
export type ZodiacSign = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface MediaFile {
  type: 'image' | 'audio';
  url: string;
  data: string; // base64
  mimeType: string;
  name?: string;
  tags?: string[];
}

export interface ColorShard {
  name: string;
  hex: string;
  descriptor?: string;
}

export interface AgentEnrichment {
  autoTags?: string[];
  detectedEra?: string;
  culturalReference?: string;
  visualSemiotics?: string;
  lastAgentUpdate?: number;
}

export interface Stack {
  id: string;
  userId: string;
  title: string;
  description: string;
  fragmentIds: string[];
  createdAt: number;
}

export interface PocketItem {
  id: string;
  userId: string;
  title: string;
  source: string;
  timestamp: number;
  embedding?: number[];
  price?: number;
  tags?: string[];
  stackIds?: string[]; // NEW: Reference to stacks
  type: 'image' | 'video' | 'zine_card' | 'omen' | 'voicenote' | 'moodboard' | 'roadmap' | 'script' | 'analysis_report' | 'link';
  savedAt: number;
  content: any;
  notes?: string;
  treatmentApplied?: string;
  parentShardId?: string;
  agentEnrichment?: AgentEnrichment;
}

export interface TailorLogicDraft {
  positioningCore: {
    anchors: {
      culturalReferences: string[];
      ideologicalBias?: string[];
      culturalSynthesis?: string[];
      trendClusters?: string[];
      scryLinks?: string[];
    };
    aestheticCore: {
      silhouettes: string[];
      materiality: string[];
      eraBias: string;
      density: number;  // 1–10
      entropy: number;  // 1–10
      tags: string[];
      visualShards?: string[];
    };
    positioningAxis: string;
    authorityClaim: string;
    exclusionPrinciples: string[];
  };

  expressionEngine: {
    chromaticRegistry: {
      primaryPalette: ColorShard[];
      baseNeutral: string;
      accentSignal: string;
    };
    typographyIntent: {
      styleDescription: string;
      weightPreference: string;
    };
    narrativeVoice: {
      emotionalTemperature: string;
      structureBias: string;
      lexicalDensity: number;  // 1–10
      restraintLevel: number;  // 1–10
      voiceNotes?: string;
    };
    brandIdentity?: {
      fonts: {
        serif: string;
        sans: string;
        mono: string;
      };
      logo?: string;
      palette: string[];
    };
  };

  strategicVectors: {
    expansionTolerance: number;  // 1–10
    fiscalVelocity: "conservative" | "measured" | "accelerated";
    desireVectors: {
      deepen: string[];
      reduce: string[];
      experiment: string[];
      refuse: string[];
    };
    saturationAwareness: {
      oversaturatedClusters: string[];
      fragileDifferentiators: string[];
    };
  };

  diagnostics: {
    contradictionFlags: string[];
    dilutionRisks: string[];
    authorityStrengthScore: number;  // 0–100
    driftVulnerability: number;      // 1–10
  };

  strategicSummary: {
    identityVector: string;  
    authorityAnchor: string;
    exclusionRules: string[];
    elasticityIndex: number;
    tonalConstraints: string;
    aestheticDNA: string;
  };

  celestialCalibration?: {
    enabled: boolean;
    zodiac?: ZodiacSign;
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
    astrologicalLineage?: string;
    seasonalAlignment?: string;
  };

  generationTemperature?: number; 
  draftStatus: 'provisional' | 'aligned' | 'evolving';
  aiSignature?: string;
  lastTailored: number;
}

export interface Persona {
  id: string;
  name: string;
  tailorDraft: TailorLogicDraft;
  apiKey?: string; // Optional override for specific billing
  themePreference?: string;
  photoURL?: string; // Visual representation for the mask
  createdAt: number;
}

export interface ZineSpec {
  id?: string;
  meta: {
    mode: "editorial" | "research" | "seasonal" | "oracle";
    intent: string;
    timestamp: number;
  };
  taste_context: {
    active_archetype: string;
    active_palette: string[];
    last_audit_summary?: string; 
  };
  structure: {
    hero_prompt: string;
    pages: ZinePageSpec[];
    sonic_layer?: string;
  };
  visual_guidance: {
    strict_palette: string[];
    negative_prompt: string;
    composition_density: number;
  };
  title?: string;
  headlines?: string[];
  vocal_summary_blurb?: string;
  header_image_prompt?: string;
  the_reading?: string;
  strategic_hypothesis?: string;
  aesthetic_touchpoints?: SemioticSignal[];
  celestial_calibration?: string;
  visual_plates?: string[];
  the_roadmap?: string;
  originalThought?: string;
  poetic_provocation?: string;
  
  // Legacy fields
  oracular_mirror?: string;
  poetic_interpretation?: string;
  blueprint?: FruitionTrajectory;
  roadmap?: Roadmap;
}

export type RoadmapPhaseType = "establish" | "differentiate" | "operationalize" | "expand" | "evolve";

export interface AuthorityAnchor {
  coreClaim: string;
  repetitionVector: string;
  exclusionPrinciple: string;
}

export interface RoadmapPhase {
  type: RoadmapPhaseType;
  objective: string;
  strategicMove: string;
  artifactOutputs: string[];
  riskToIntegrity: string;
  signalToMonitor: string;
}

export interface DriftForecast {
  predictedClusterShift: string;
  audienceEvolution: string;
  absorptionRisk: string;
  overexposureRisk: string;
  refusalPoint: string;
}

export interface Roadmap {
  strategicThesis: string;
  positioningAxis: string;
  authorityAnchor: AuthorityAnchor;
  intensity: "low" | "medium" | "high";
  densityLevel: number;
  entropyLevel: number;
  timelineMode: "compressed" | "standard" | "long-arc";
  phases: RoadmapPhase[];
  driftForecast: DriftForecast;
}

export interface ZinePageSpec {
  pageNumber: number;
  headline: string;
  bodyCopy: string;
  imagePrompt: string;
}

export interface ZineContent extends ZineSpec {
  pages: ZinePageSpec[];
}

export interface ZineMetadata {
  id: string;
  fragmentsUsed: string[];
  createdAt: number;
  theme: string;
  aestheticVector: Record<string, number>;
  userId: string;
  userHandle: string;
  userAvatar?: string | null;
  title: string;
  tone: ToneTag;
  timestamp: number;
  likes: number;
  content: ZineContent;
  coverImageUrl?: string | null;
  isDeepThinking?: boolean;
  isLite?: boolean;
  isHighFidelity?: boolean;
  isPublic?: boolean;
  isLocked?: boolean;
  authorship?: string;
  originalInput?: string; 
  artifacts?: MediaFile[];
  lineage?: string[];
}

export interface SemioticSignal {
  motif: string;
  context: string;
  visual_directive?: string; 
  type?: 'acquisition' | 'conceptual' | 'lexical'; // NEW: Referential types
  link?: string; // NEW: Grounding link for acquisition
}

export interface FruitionTrajectory {
  inciting_debris: string;
  structural_pivot: string;
  climax_manifest: string;
  end_product_spec: string;
}

export type ToneTag = 'chic' | 'nostalgia' | 'dream' | 'unhinged' | 'panic' | 'editorial' | 'research' | 'Cinematic Witness' | 'Editorial Stillness' | 'Romantic Interior' | 'Structured Desire' | 'Documentary B&W' | 'CONTENT' | 'SHADOW' | 'SIGNAL' | 'ECHO' | 'MANIFESTO' | 'SHARD' | 'DOSSIER' | 'PROMPT' | 'RAW' | 'VINTAGE' | 'CONTRARY';
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  REVEALED = 'REVEALED',
  ERROR = 'ERROR'
}

export type TypographicArchetype = 'editorial-serif' | 'minimalist-sans' | 'brutalist-mono';

export interface DriftEvent {
  type: 'archetype_shift' | 'color_shift';
  timestamp: number;
  before: { archetype?: string; color?: string };
  after: { archetype?: string; color?: string };
  magnitude: number;
  triggerZineId: string;
}

export interface SovereignIdentityCard {
  aestheticCoordinates: {
    name: string;
    description: string;
  }[];
  tasteDriftPercentage: number;
  svgVisual: string; // NEW
  generatedAt: number;
}

export interface TasteProfile {
  archetype_weights: Record<string, number>;
  color_frequency: Record<string, number>;
  audit_history?: DriftEvent[];
  semantic_signature?: string;
  dominant_archetypes?: TypographicArchetype[];
  inspirations?: string;
  sovereignIdentity?: SovereignIdentityCard; // NEW
}

export interface TasteEvent {
  userId: string;
  event_type: 'view' | 'tweak' | 'save' | 'scry';
  input_context: {
    raw_text: string;
    selected_tone?: string;
    selected_archetype?: string;
    user_intent?: string;
  };
  output_context: {
    zineId?: string;
    generated_archetype?: string;
    colors?: string[];
    scry_insights?: any;
    taste_snapshot?: TasteProfile;
    layout_type?: string;
  };
  timestamp: number;
  sessionId?: string;
}

export interface AuditEntry {
  id: string;
  type: 'manifest' | 'archive';
  featureName: string;
  timestamp: number;
  reason: string;
  impact: string;
}

export interface TailorAuditReport {
  aestheticDirectives: string[];
  strategicOpportunity: string;
  profileManifesto: string;
  suggestedTouchpoints: string[];
}

export interface TasteAuditReport {
  coreFrequency: string;
  diagnosis: string;
  conceptualThroughline: string;
  designBrief: string;
  colorStory: ColorShard[];
  keyTouchpoints?: string[];
}

export interface VideoAuditReport {
  alignmentScore: number;
  narrativeCritique: string;
  missedSemiotics: string[];
  editingDirectives: string[];
  audienceResonance: string;
}

export interface InvestmentReport {
  thesis: string;
  tailor_alignment_note?: string;
  capital_allocation: {
    category: "KEYSTONE ASSET" | "STRATEGIC EXPENSE" | "VANITY METRIC";
    items: string[];
    reasoning: string;
    fiscal_route: "Business Write-off" | "Personal Equity" | "Operational Cost";
  }[];
  capsule_impact_score: number;
  missing_infrastructure: string;
}

export interface TrendSynthesisReport {
  pattern_signals: string[];
  structural_shifts: string;
  cultural_forces: string;
  time_horizon: string;
  grounding_sources?: { uri: string; title?: string }[];
}

export interface SanctuaryReport {
  validation: string;
}

export interface SeasonReport {
  currentVibe: string;
  cliqueLogic: string;
  timestamp: number;
}

export type ProsceniumRole = 'Witness' | 'Muse' | 'Editor' | 'Architect';

export interface EditorElementStyle {
  top: number;
  left: number;
  width: number;
  height?: number;
  zIndex?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontStyle?: string;
  fontWeight?: string;
  rotation?: number;
  lineHeight?: number;
  objectFit?: 'cover' | 'contain';
  filter?: string;
  hasPin?: boolean;
  // BORDERS & OUTLINES
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  mixBlendMode?: string;
}

export interface EditorElement {
  id: string;
  type: 'image' | 'text' | 'box' | 'signal' | 'analysis_pin';
  content: string;
  link?: string;
  negativePrompt?: string;
  notes?: string;
  style: EditorElementStyle;
  sourceRef?: string;
}

export interface ZinePage extends ZinePageSpec {
  image_url?: string;
  originalMediaUrl?: string;
  negativePrompt?: string;
  customLayout?: {
    elements: EditorElement[];
    editTrace?: { timestamp: number; note: string }[];
  };
}

export interface Treatment {
  id: string;
  name: string;
  instruction: string;
  variance?: 'interpretive' | 'anchored';
  isMixedMedia?: boolean;
  createdAt?: number;
  userId?: string;
}

// STRATEGIC IMPERATIVES
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  createdAt: number;
}

export interface DossierFolder {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  notes?: string;
  tasks?: Task[];
  collaborators?: string[];
}

export interface DossierElement {
  id: string;
  itemId?: string;
  type: 'image' | 'text' | 'analysis_pin';
  content: string;
  notes?: string;
  style: {
    zIndex: number;
    isPolaroid?: boolean;
    hasPin?: boolean;
  };
}

export interface DossierArtifact {
  id: string;
  userId: string;
  folderId: string;
  type: string;
  title: string;
  createdAt: number;
  elements: DossierElement[];
  report?: TasteAuditReport;
  tags?: string[];
  stackIds?: string[]; // NEW: For clustering
  status?: 'active' | 'dormant'; // NEW: For Dormant Vision System
}

export interface SlideBlock {
  id: string;
  type: string;
  title: string;
  elements: EditorElement[];
}

export interface DarkroomLayer extends Treatment {
  layerId: string;
  opacity: number;
  isVisible: boolean;
}

export interface UserPreferences {
  tailorDraft?: TailorLogicDraft; 
  personas?: Persona[]; 
  activePersonaId?: string;
  tasteProfile?: TasteProfile;
  starredZineIds?: string[];
  lastAuditReport?: TailorAuditReport;
  enabledAlgos?: string[]; // NEW: User-defined firewalls for specific functions
}

export interface UserProfile extends UserPreferences {
  uid: string;
  handle: string;
  email?: string | null;
  photoURL?: string | null;
  zodiacSign?: ZodiacSign;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  currentSeason: 'rotting' | 'blooming' | 'frozen' | 'burning';
  createdAt: number;
  lastActive?: number;
  isSwan?: boolean; 
  useLikeness?: boolean;
  onboardingComplete?: boolean;
  syncedUsers?: string[];
  tasteVector?: Record<string, number>;
  // Patron & Retention Tracking
  isPatron?: boolean;
  patronActivatedAt?: number;
  patronKey?: string;
  generationCount?: number;
  firstVisitAt?: number;
  lastVisitAt?: number;
  visitCount?: number;
  sessionDates?: number[];
}

// -- PROPOSAL SYSTEM -- //

export type ProposalStatus = "draft" | "locked" | "exported";

export interface BrandKit {
  primaryFont: string;
  secondaryFont: string;
  colorPalette: string[];
}

export interface LayoutConfig {
  template: "editorial" | "presentation" | "portfolio";
  fontSet: string[];
  colorSet: string[];
  spacingScale: number;
  backgroundStyle?: string;
  customStyles?: Record<string, string>;
}

export interface ProposalSection {
  id: string;
  title: string;
  body: string;
  visual_directive?: string; 
  elements: EditorElement[];
  order: number;
}

export interface ProposalContent {
  summary: string;
  analysis: string;
  sections: ProposalSection[];
}

export interface Proposal {
  id: string;
  userId: string;
  title: string;
  sourceFolderId: string;
  sourceArtifactIds: string[];
  content: ProposalContent;
  layout: LayoutConfig;
  brandKitSnapshot?: BrandKit;
  version: number;
  status: ProposalStatus;
  createdAt: number;
  updatedAt: number;
}

// -- SHARED CONTEXT SYSTEM -- //

export interface VibeNote {
  id: string;
  userId: string;
  userHandle: string;
  note: string; // The vibe (e.g., an emoji, a short phrase, a color hex)
  timestamp: number;
}

export interface Transmission {
  id: string;
  userId: string;
  userHandle: string;
  content: string; // The text content or summary
  timestamp: any; // Firestore Timestamp or number
  type: 'manifest' | 'echo' | 'signal';
  likes: number;
  // New fields for Gallery Mode
  title?: string;
  coverImage?: string;
  zineId?: string;
  artifacts?: MediaFile[];
  vibeNotes?: VibeNote[];
}

export interface ContextEntry {
  id: string;
  userId: string;
  text: string;
  type: 'note' | 'link';
  timestamp: number;
}

export interface Fragment {
  id: string;
  userId: string;
  type: 'image' | 'text' | 'audio' | 'link' | 'zine_card';
  content: any; // Raw content
  tags: string[]; // AI generated tags
  aestheticVector: Record<string, number>; // For aesthetic tracking
  createdAt: number;
  sourceId?: string; // Reference to parent or source
  status: 'active' | 'dormant'; // NEW: For Dormant Vision System
}
