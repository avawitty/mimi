import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Youtube, Video, FileText, Upload, X, Loader2, Sparkles, Image as ImageIcon, Facebook, ChevronRight, CheckCircle2, Save, Download } from 'lucide-react';
import { AestheticTrajectory } from './AestheticTrajectory';
import { useUser } from '../contexts/UserContext';
import { generatePlatformStrategy } from '../services/geminiService';
import { StrategyAudit, Task } from '../types';
import { saveStrategyAudit, saveTask, fetchStrategyAudits, createDossierArtifactFromStrategy, fetchDossierFolders, createDossierFolder } from '../services/firebaseUtils';

interface MediaFile {
  file: File;
  data: string; // base64
  url: string;
  type: 'image' | 'video' | 'link';
  name: string;
  mimeType: string;
}

const PLATFORMS = [
  { id: 'Instagram', icon: Instagram, label: 'Instagram' },
  { id: 'TikTok', icon: Video, label: 'TikTok' },
  { id: 'YouTube', icon: Youtube, label: 'YouTube' },
  { id: 'Substack', icon: FileText, label: 'Substack' },
  { id: 'Facebook', icon: Facebook, label: 'Facebook' }
];

const INTENTS = [
  "Grow faster",
  "Fix low engagement",
  "Build a stronger aesthetic",
  "Land brand deals",
  "Go viral (short-term push)"
];

export const StrategyStudio = () => {
  const { profile, user } = useUser();
  const [step, setStep] = useState<number>(1);
  const [intent, setIntent] = useState<string>('');
  const [activePlatform, setActivePlatform] = useState('Instagram');
  const [identitySeed, setIdentitySeed] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategyOutput, setStrategyOutput] = useState<StrategyAudit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [audits, setAudits] = useState<StrategyAudit[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const [isDashboardMode, setIsDashboardMode] = useState(false);

  React.useEffect(() => {
    const loadAudits = async () => {
      if (user) {
        const data = await fetchStrategyAudits(user.uid);
        setAudits(data);
        if (data.length > 0) {
          setIsDashboardMode(true);
          setActivePlatform(data[0].platform);
        }
      }
      setLoadingAudits(false);
    };
    loadAudits();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newMedia = await Promise.all(files.map(async (f) => {
        const data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
        return {
          file: f,
          data,
          url: '',
          type: f.type.startsWith('image') ? 'image' : 'video' as any,
          name: f.name,
          mimeType: f.type
        } as MediaFile;
      }));
      setMediaFiles(prev => [...prev, ...newMedia]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStep(5); // Processing step
    try {
      const result = await generatePlatformStrategy(
        activePlatform,
        mediaFiles.map(m => ({ base64: m.data, type: m.mimeType })),
        profile,
        `${intent}. Aesthetic: ${identitySeed}`
      );
      
      const audit: StrategyAudit = {
        id: `audit_${Date.now()}`,
        platform: activePlatform,
        intent,
        identitySeed,
        timestamp: Date.now(),
        read: result
      };
      
      setStrategyOutput(audit);
      setStep(6); // Output step
    } catch (error) {
      console.error("Strategy generation failed:", error);
      setStep(4); // Go back to last input step
      alert("Failed to generate strategy. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportToDossier = async () => {
    if (!strategyOutput || !user) return;
    setIsSaving(true);
    try {
      // Create a default folder if none exists, or just use a generic one
      const folders = await fetchDossierFolders(user.uid);
      let folderId = folders.length > 0 ? folders[0].id : '';
      
      if (!folderId) {
        folderId = await createDossierFolder(user.uid, 'Strategy Audits');
      }

      await createDossierArtifactFromStrategy(user.uid, folderId, strategyOutput);
      await saveStrategyAudit(user.uid, strategyOutput); // Keep saving it to reads for the dashboard
      
      // Update local state
      setAudits(prev => [strategyOutput, ...prev]);
      setIsDashboardMode(true);
      
      alert("Audit exported to your Dossier.");
    } catch (error) {
      console.error("Failed to export audit:", error);
      alert("Failed to export audit.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportTasks = async () => {
    if (!strategyOutput || !user) return;
    setIsExporting(true);
    try {
      const tasks: Task[] = [];
      
      // Export content plan
      strategyOutput.read.contentPlan.forEach((post, i) => {
        tasks.push({
          id: `task_post_${Date.now()}_${i}`,
          text: `Create ${post.format}: ${post.hook}`,
          completed: false,
          createdAt: Date.now(),
          platform: activePlatform,
          tags: ['content', post.format.toLowerCase()]
        });
      });

      // Export experiments
      strategyOutput.read.experiments.forEach((exp, i) => {
        tasks.push({
          id: `task_exp_${Date.now()}_${i}`,
          text: `Experiment: ${exp.test}`,
          completed: false,
          createdAt: Date.now(),
          platform: activePlatform,
          tags: ['experiment']
        });
      });

      for (const task of tasks) {
        await saveTask(user.uid, task);
      }
      
      alert(`Exported ${tasks.length} tasks to your Action Board.`);
    } catch (error) {
      console.error("Failed to export tasks:", error);
      alert("Failed to export tasks.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full justify-center max-w-md mx-auto">
            <h2 className="text-3xl font-light text-stone-800 mb-2 tracking-wide text-center">Let Mimi Read Your Field</h2>
            <p className="text-stone-500 italic text-sm text-center mb-12">Upload a few signals. I'll translate how the algorithm sees you—and what to do next.</p>
            
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-6 font-sans text-center">What do you want right now?</label>
            <div className="flex flex-col gap-3">
              {INTENTS.map((i) => (
                <button
                  key={i}
                  onClick={() => { setIntent(i); setStep(2); }}
                  className={`py-4 px-6 rounded-xl border text-left transition-all duration-300 ${
                    intent === i 
                      ? 'border-stone-800 bg-stone-800 text-white shadow-md' 
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-sans tracking-wide">{i}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full justify-center max-w-md mx-auto">
            <h2 className="text-3xl font-light text-stone-800 mb-12 tracking-wide text-center">Select Your Canvas</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setActivePlatform(p.id); setStep(3); }}
                  className={`flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-xl border transition-all duration-300 ${
                    activePlatform === p.id 
                      ? 'border-stone-800 bg-stone-800 text-white shadow-md' 
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <p.icon size={32} strokeWidth={activePlatform === p.id ? 2 : 1.5} />
                  <span className="text-sm font-sans tracking-wide">{p.label}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                if (audits.length > 0) {
                  setIsDashboardMode(true);
                } else {
                  setStep(1);
                }
              }} 
              className="mt-8 text-xs text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors text-center"
            >
              Back
            </button>
          </motion.div>
        );
      case 3:
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full justify-center max-w-md mx-auto">
            <h2 className="text-3xl font-light text-stone-800 mb-2 tracking-wide text-center">Show me what's working</h2>
            <p className="text-stone-500 italic text-sm text-center mb-8">(and what's not)</p>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-stone-200">
                <h4 className="text-sm font-medium text-stone-800 mb-1">1. Top Content</h4>
                <p className="text-xs text-stone-500 mb-4">Upload 3-5 posts that performed best</p>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${
                    isDragging ? 'border-stone-500 bg-stone-100' : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-2 text-stone-400" size={20} strokeWidth={1.5} />
                  <p className="text-xs text-stone-600 font-sans tracking-wide">Drag & drop or click to upload</p>
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange} />
                </div>
                {mediaFiles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mediaFiles.map((file, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-200 group">
                        {file.type === 'image' ? (
                          <img src={file.data} alt="upload" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                            <Video size={16} className="text-stone-400" />
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removeMedia(idx); }} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-stone-200 opacity-70 hover:opacity-100 transition-opacity">
                <h4 className="text-sm font-medium text-stone-800 mb-1">2. Insights Snapshot (Optional)</h4>
                <p className="text-xs text-stone-500 mb-0">Screenshot your last 30 days overview</p>
              </div>
            </div>
            
            <div className="flex justify-between mt-8">
              <button 
                onClick={() => {
                  if (audits.some(a => a.platform === activePlatform) && step === 3 && intent !== '') {
                    // If they came from dashboard directly to step 3
                    setIsDashboardMode(true);
                  } else {
                    setStep(2);
                  }
                }} 
                className="text-xs text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(4)} 
                disabled={mediaFiles.length === 0}
                className="flex items-center gap-2 text-xs text-stone-800 uppercase tracking-widest hover:text-black transition-colors disabled:opacity-30"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full justify-center max-w-md mx-auto">
            <h2 className="text-3xl font-light text-stone-800 mb-2 tracking-wide text-center">Identity Seed</h2>
            <p className="text-stone-500 italic text-sm text-center mb-12">How would you describe your aesthetic in 3 words?</p>
            
            <input
              type="text"
              value={identitySeed}
              onChange={(e) => setIdentitySeed(e.target.value)}
              placeholder="e.g., clean, soft, restrained"
              className="w-full bg-white border-b-2 border-stone-200 p-4 text-stone-800 text-center text-lg focus:outline-none focus:border-stone-800 transition-all mb-12"
            />
            
            <div className="flex justify-between items-center">
              <button onClick={() => setStep(3)} className="text-xs text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors">Back</button>
              <button
                onClick={handleGenerate}
                className="py-4 px-8 bg-stone-800 text-white rounded-xl font-sans text-sm tracking-widest uppercase hover:bg-stone-700 transition-colors flex items-center gap-2 shadow-md"
              >
                <Sparkles size={16} /> Generate Dossier
              </button>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto py-12 px-6 animate-pulse">
            <div className="mb-16 text-center flex flex-col items-center">
              <div className="h-4 bg-stone-200 rounded w-32 mb-4"></div>
              <div className="h-10 bg-stone-200 rounded w-3/4 mb-2"></div>
              <div className="h-10 bg-stone-200 rounded w-1/2"></div>
            </div>
            <div className="mb-16">
              <div className="h-4 bg-stone-200 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="h-24 bg-stone-100 rounded-xl border border-stone-100"></div>
                <div className="h-24 bg-stone-100 rounded-xl border border-stone-100"></div>
                <div className="h-24 bg-stone-100 rounded-xl border border-stone-100"></div>
                <div className="h-24 bg-stone-100 rounded-xl border border-stone-100"></div>
              </div>
            </div>
            <div className="mb-16">
              <div className="h-4 bg-stone-200 rounded w-48 mb-6"></div>
              <div className="h-48 bg-white border border-stone-200 rounded-xl shadow-sm"></div>
            </div>
            <div className="flex justify-center items-center gap-3 text-stone-400 mt-12">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-sans uppercase tracking-widest">Mimi is reading your field...</span>
            </div>
          </motion.div>
        );
      case 6:
        if (!strategyOutput) return null;
        const read = strategyOutput.read;
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-12 px-6">
            {/* Header */}
            <div className="mb-16 text-center">
              <p className="text-stone-400 text-xs font-sans tracking-widest uppercase mb-4">Field Report // {activePlatform}</p>
              <h1 className="text-3xl md:text-4xl font-light text-stone-800 leading-tight italic">
                "{read.openingLine}"
              </h1>
            </div>

            {/* Signal Breakdown */}
            <div className="mb-16">
              <h3 className="text-sm font-sans tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">What You're Triggering</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(read.signalBreakdown).map(([key, value]) => (
                  <div key={key} className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{key}</p>
                    <p className="text-lg text-stone-800 font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Aesthetic Audit */}
            <div className="mb-16">
              <h3 className="text-sm font-sans tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">Your Visual Signature</h3>
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3"><span className="text-stone-400 mt-1">✦</span><span className="text-stone-700"><strong>Palette:</strong> {read.aestheticAudit.palette}</span></li>
                  <li className="flex items-start gap-3"><span className="text-stone-400 mt-1">✦</span><span className="text-stone-700"><strong>Density:</strong> {read.aestheticAudit.density}</span></li>
                  <li className="flex items-start gap-3"><span className="text-stone-400 mt-1">✦</span><span className="text-stone-700"><strong>Entropy:</strong> {read.aestheticAudit.entropy}</span></li>
                </ul>
                <div className="bg-stone-50 p-4 rounded-lg border-l-2 border-stone-800">
                  <p className="text-stone-800 italic text-sm">{read.aestheticAudit.insight}</p>
                </div>
              </div>
            </div>

            <AestheticTrajectory 
              current={{ density: parseInt(read.aestheticAudit.density), entropy: parseInt(read.aestheticAudit.entropy), palette: [] }}
              target={{ density: 7, entropy: 3, palette: [] }}
              recommendation={{ treatment: 'Industrial Noir', persona: 'The Archivist', reasoning: 'Your current density is too low for the target aesthetic. Increasing density through high-contrast imagery and structured layouts will bridge the gap.' }}
            />

            {/* Content Behavior & Strategy Shift */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div>
                <h3 className="text-sm font-sans tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">Why it isn't converting</h3>
                <ul className="space-y-4">
                  {read.contentBehavior.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-stone-700 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> {point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-sans tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">What to change immediately</h3>
                <ul className="space-y-4">
                  {read.strategyShift.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-stone-700 text-sm"><CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" /> {point}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Content Plan */}
            <div className="mb-16">
              <h3 className="text-sm font-sans tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">Your Next 5 Posts</h3>
              <div className="space-y-4">
                {read.contentPlan.map((post, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-sans tracking-widest uppercase text-stone-400">Post 0{i + 1}</span>
                      <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs rounded-full uppercase tracking-wider">{post.format}</span>
                    </div>
                    <h4 className="text-lg text-stone-800 font-medium mb-3">"{post.hook}"</h4>
                    <p className="text-sm text-stone-600 mb-3"><strong className="text-stone-800">Visual:</strong> {post.visual}</p>
                    <p className="text-sm text-stone-500 italic mb-4"><strong className="text-stone-800 not-italic">Why it works:</strong> {post.why}</p>
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('mimi:change_view', { 
                          detail: 'studio', 
                          detail_data: { 
                            context: `Drafting post based on strategy:\n\nHook: "${post.hook}"\nVisual: "${post.visual}"`
                          }
                        } as any));
                      }}
                      className="text-xs font-sans tracking-widest uppercase text-emerald-600 hover:text-emerald-800 flex items-center gap-2"
                    >
                      <Sparkles size={12} /> Draft in Studio
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Experiments */}
            <div className="mb-16">
              <h3 className="text-sm font-sans tracking-widest uppercase text-stone-400 mb-6 border-b border-stone-200 pb-2">Experiments to Run</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {read.experiments.map((exp, i) => (
                  <div key={i} className="bg-stone-50 p-5 rounded-xl border border-stone-200">
                    <p className="text-stone-800 font-medium text-sm mb-2">{exp.test}</p>
                    <p className="text-xs text-stone-500 mb-2"><strong className="text-stone-700">Measure:</strong> {exp.successMetric}</p>
                    <p className="text-xs text-stone-500"><strong className="text-stone-700">Next:</strong> {exp.nextStep}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity Reframe */}
            <div className="mb-16 text-center bg-stone-800 text-white p-8 rounded-2xl">
              <p className="text-xs font-sans tracking-widest uppercase text-stone-400 mb-4">Identity Reframe</p>
              <p className="text-xl font-light italic leading-relaxed mb-6">"{read.identityReframe}"</p>
              <button 
                onClick={async () => {
                  if (!user) return;
                  // Simplified persona adoption logic
                  alert("Adopted as Persona: " + read.identityReframe.substring(0, 20) + "...");
                }}
                className="text-xs font-sans tracking-widest uppercase text-emerald-400 hover:text-emerald-200 border border-emerald-400 hover:border-emerald-200 px-4 py-2 rounded-lg transition-colors"
              >
                Adopt as Persona
              </button>
            </div>

            {/* Platform Validation Constraints */}
            <div className="mb-16 bg-stone-100 p-6 rounded-xl border border-stone-200">
              <h3 className="text-sm font-sans tracking-widest uppercase text-stone-500 mb-4">Platform Validation Constraints: {activePlatform}</h3>
              <ul className="text-sm text-stone-600 space-y-2 list-disc list-inside">
                {activePlatform === 'Instagram' && (
                  <>
                    <li>Use 4:5 aspect ratio for maximum feed real estate.</li>
                    <li>Hook in first 3 seconds with visual motion.</li>
                    <li>Maximize contrast for dark mode users.</li>
                  </>
                )}
                {activePlatform === 'TikTok' && (
                  <>
                    <li>Use 9:16 aspect ratio.</li>
                    <li>Hook immediately with high-energy audio.</li>
                    <li>Keep text overlays away from UI elements.</li>
                  </>
                )}
                {activePlatform !== 'Instagram' && activePlatform !== 'TikTok' && (
                  <li>Follow standard platform best practices for {activePlatform}.</li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleExportToDossier}
                disabled={isSaving}
                className="py-3 px-6 bg-white border border-stone-200 text-stone-800 rounded-xl font-sans text-sm tracking-widest uppercase hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Export to Dossier
              </button>
              <button 
                onClick={handleExportTasks}
                disabled={isExporting}
                className="py-3 px-6 bg-stone-800 text-white rounded-xl font-sans text-sm tracking-widest uppercase hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export to Action Board
              </button>
            </div>
            
            <div className="mt-12 text-center">
              <button 
                onClick={() => { 
                  setStrategyOutput(null); 
                  setMediaFiles([]); 
                  setIntent(''); 
                  setIdentitySeed(''); 
                  setIsDashboardMode(true);
                }} 
                className="text-xs text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        );
    }
  };

  const renderDashboard = () => {
    const platformAudits = audits.filter(a => a.platform === activePlatform);
    const latestAudit = platformAudits.length > 0 ? platformAudits[0] : null;

    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-light text-stone-800 tracking-wide">Strategy Studio</h2>
          <div className="flex gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                  activePlatform === p.id 
                    ? 'border-stone-800 bg-stone-800 text-white shadow-md' 
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <p.icon size={18} strokeWidth={activePlatform === p.id ? 2 : 1.5} />
                <span className="text-xs font-sans tracking-widest uppercase hidden md:inline">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {latestAudit ? (
          <div className="space-y-12">
            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-light text-stone-800">Latest {activePlatform} Read</h3>
                <span className="text-xs font-sans tracking-widest uppercase text-stone-400">
                  {new Date(latestAudit.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-stone-600 italic mb-8">"{latestAudit.read.openingLine}"</p>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xs font-sans tracking-widest uppercase text-stone-400 mb-4 border-b border-stone-200 pb-2">Aesthetic Audit</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-stone-700 text-sm">
                      <span className="text-stone-400 mt-0.5">•</span> <strong>Palette:</strong> {latestAudit.read.aestheticAudit.palette}
                    </li>
                    <li className="flex items-start gap-2 text-stone-700 text-sm">
                      <span className="text-stone-400 mt-0.5">•</span> <strong>Density:</strong> {latestAudit.read.aestheticAudit.density}
                    </li>
                    <li className="flex items-start gap-2 text-stone-700 text-sm">
                      <span className="text-stone-400 mt-0.5">•</span> <strong>Entropy:</strong> {latestAudit.read.aestheticAudit.entropy}
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-sans tracking-widest uppercase text-stone-400 mb-4 border-b border-stone-200 pb-2">Strategy Shift</h4>
                  <ul className="space-y-3">
                    {latestAudit.read.strategyShift.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-stone-700 text-sm">
                        <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" /> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setStrategyOutput(latestAudit);
                    setIsDashboardMode(false);
                    setStep(6);
                  }}
                  className="py-2 px-4 bg-stone-100 text-stone-700 rounded-lg font-sans text-xs tracking-widest uppercase hover:bg-stone-200 transition-colors"
                >
                  View Full Audit
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-sans tracking-widest uppercase text-stone-800 mb-6">Run New Analysis</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button 
                  onClick={() => {
                    setIntent('Content Analysis');
                    setIsDashboardMode(false);
                    setStep(3);
                  }}
                  className="p-6 bg-white border border-stone-200 rounded-xl hover:border-stone-800 hover:shadow-md transition-all text-left group"
                >
                  <FileText className="text-stone-400 mb-4 group-hover:text-stone-800 transition-colors" size={24} />
                  <h4 className="font-medium text-stone-800 mb-2">Content Analysis</h4>
                  <p className="text-xs text-stone-500">Upload new analytics to update your read.</p>
                </button>
                <button 
                  onClick={() => {
                    setIntent('Brand Deal Analysis');
                    setIsDashboardMode(false);
                    setStep(3);
                  }}
                  className="p-6 bg-white border border-stone-200 rounded-xl hover:border-stone-800 hover:shadow-md transition-all text-left group"
                >
                  <Sparkles className="text-stone-400 mb-4 group-hover:text-stone-800 transition-colors" size={24} />
                  <h4 className="font-medium text-stone-800 mb-2">Brand Deal Analysis</h4>
                  <p className="text-xs text-stone-500">See how a deal fits your aesthetic narrative.</p>
                </button>
                <button 
                  onClick={() => {
                    setIntent('Strategy Implementation');
                    setIsDashboardMode(false);
                    setStep(3);
                  }}
                  className="p-6 bg-white border border-stone-200 rounded-xl hover:border-stone-800 hover:shadow-md transition-all text-left group"
                >
                  <CheckCircle2 className="text-stone-400 mb-4 group-hover:text-stone-800 transition-colors" size={24} />
                  <h4 className="font-medium text-stone-800 mb-2">Strategy Implementation</h4>
                  <p className="text-xs text-stone-500">Generate new tasks and content plans.</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-stone-200 border-dashed">
            <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6">
              {(() => {
                const Icon = PLATFORMS.find(p => p.id === activePlatform)?.icon;
                return Icon ? <Icon size={24} className="text-stone-400" /> : null;
              })()}
            </div>
            <h3 className="text-2xl font-light text-stone-800 mb-2">No data for {activePlatform}</h3>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">Complete your first read to unlock the {activePlatform} dashboard and get personalized strategy insights.</p>
            <button 
              onClick={() => {
                setIsDashboardMode(false);
                setStep(1);
              }}
              className="py-3 px-6 bg-stone-800 text-white rounded-xl font-sans text-sm tracking-widest uppercase hover:bg-stone-700 transition-colors shadow-md"
            >
              Start First Read
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loadingAudits) {
    return (
      <div className="h-full w-full bg-[#FDFBF7] overflow-y-auto custom-scrollbar font-serif">
        <div className="max-w-4xl mx-auto py-12 px-6 animate-pulse">
          <div className="flex items-center justify-between mb-12">
            <div className="h-10 bg-stone-200 rounded w-64"></div>
            <div className="flex gap-2">
              <div className="h-12 w-24 bg-stone-200 rounded-xl"></div>
              <div className="h-12 w-24 bg-stone-200 rounded-xl"></div>
              <div className="h-12 w-24 bg-stone-200 rounded-xl"></div>
            </div>
          </div>
          <div className="space-y-12">
            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-stone-200 rounded w-1/3"></div>
                <div className="h-4 bg-stone-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-stone-200 rounded w-3/4 mb-8"></div>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="h-4 bg-stone-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-full"></div>
                  <div className="h-4 bg-stone-200 rounded w-full"></div>
                  <div className="h-4 bg-stone-200 rounded w-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-stone-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-full"></div>
                  <div className="h-4 bg-stone-200 rounded w-full"></div>
                </div>
              </div>
              <div className="h-8 bg-stone-200 rounded w-32"></div>
            </div>
            <div>
              <div className="h-6 bg-stone-200 rounded w-48 mb-6"></div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="h-32 bg-stone-200 rounded-xl"></div>
                <div className="h-32 bg-stone-200 rounded-xl"></div>
                <div className="h-32 bg-stone-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#FDFBF7] overflow-y-auto custom-scrollbar font-serif">
      {isDashboardMode ? renderDashboard() : renderStepContent()}
    </div>
  );
};
