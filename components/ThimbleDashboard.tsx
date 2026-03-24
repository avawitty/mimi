import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Copy, Check, ShoppingBag, ExternalLink, Upload, X, Link as LinkIcon, Scale, FolderPlus, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { procureWithArtifacts, compareItemsFiscalAudit, auditThimbleBoard } from '../services/geminiService';
import { useUser } from '../contexts/UserContext';
import { MediaFile, ThimbleBoard, ThimbleItem } from '../types';
import { addToPocket, handleFirestoreError, OperationType } from '../services/firebaseUtils';
import { db } from '../services/firebaseInit';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

interface SourcingTarget {
  targetArchetype: string;
  keywordBoolean: string;
  emergingDesigner: string;
  rationale: string;
}

interface FiscalAuditResult {
  item1Analysis: string;
  item2Analysis: string;
  verdict: string;
  rationale: string;
}

interface BoardAuditResult {
  boardAnalysis: string;
  redundancies: string;
  verdict: string;
  rationale: string;
}

export const ThimbleDashboard = () => {
  const { profile, user } = useUser();
  const [activeTab, setActiveTab] = useState<'sourcing' | 'boards' | 'audit'>('sourcing');
  
  // Sourcing State
  const [budget, setBudget] = useState('');
  const [objective, setObjective] = useState('');
  const [targets, setTargets] = useState<SourcingTarget[]>([]);
  const [isProcuring, setIsProcuring] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkInput, setLinkInput] = useState('');

  // Audit State
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [auditBudget, setAuditBudget] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<FiscalAuditResult | null>(null);

  // Boards State
  const [boards, setBoards] = useState<ThimbleBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<ThimbleBoard | null>(null);
  const [boardItems, setBoardItems] = useState<ThimbleItem[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isAuditingBoard, setIsAuditingBoard] = useState(false);
  const [boardAuditResult, setBoardAuditResult] = useState<BoardAuditResult | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'thimbleBoards'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThimbleBoard));
      setBoards(b);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'thimbleBoards');
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedBoard) {
      setBoardItems([]);
      setBoardAuditResult(null);
      return;
    }
    const q = query(collection(db, 'thimbleItems'), where('boardId', '==', selectedBoard.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThimbleItem));
      setBoardItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'thimbleItems');
    });
    return () => unsubscribe();
  }, [selectedBoard]);

  const handleCreateBoard = async () => {
    if (!user?.uid || !newBoardTitle.trim()) return;
    try {
      await addDoc(collection(db, 'thimbleBoards'), {
        userId: user.uid,
        title: newBoardTitle.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setNewBoardTitle('');
    } catch (e) {
      console.error("Error creating board", e);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await deleteDoc(doc(db, 'thimbleBoards', boardId));
      if (selectedBoard?.id === boardId) setSelectedBoard(null);
    } catch (e) {
      console.error("Error deleting board", e);
    }
  };

  const handleAddItem = async () => {
    if (!user?.uid || !selectedBoard || !newItemUrl.trim()) return;
    try {
      await addDoc(collection(db, 'thimbleItems'), {
        userId: user.uid,
        boardId: selectedBoard.id,
        url: newItemUrl.trim(),
        title: newItemTitle.trim(),
        price: newItemPrice.trim(),
        createdAt: Date.now()
      });
      setNewItemUrl('');
      setNewItemTitle('');
      setNewItemPrice('');
    } catch (e) {
      console.error("Error adding item", e);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'thimbleItems', itemId));
    } catch (e) {
      console.error("Error deleting item", e);
    }
  };

  const handleAuditBoard = async () => {
    if (!selectedBoard || boardItems.length === 0) return;
    setIsAuditingBoard(true);
    try {
      const result = await auditThimbleBoard(
        profile?.tasteProfile || "Unknown Taste",
        selectedBoard.title,
        boardItems.map(i => ({ url: i.url, title: i.title, price: i.price, notes: i.notes }))
      );
      setBoardAuditResult(result);
    } catch (e) {
      console.error("Error auditing board", e);
    } finally {
      setIsAuditingBoard(false);
    }
  };

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
      } else {
          const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
          if (url) {
              setMediaFiles(prev => [...prev, { type: 'link' as any, url, data: '', mimeType: 'text/plain', name: url } as MediaFile]);
          }
      }
  };

  const removeMedia = (index: number) => {
      setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
      if (linkInput.trim()) {
          setMediaFiles(prev => [...prev, { type: 'link' as any, url: linkInput.trim(), data: '', mimeType: 'text/plain', name: linkInput.trim() } as MediaFile]);
          setLinkInput('');
      }
  };

  const handleProcure = async () => {
    if (!budget.trim() && mediaFiles.length === 0) return;
    setIsProcuring(true);
    try {
      const results = await procureWithArtifacts(
          profile?.tasteProfile || "Unknown Taste", 
          budget, 
          objective,
          mediaFiles
      );
      setTargets(results);
    } catch (error) {
      console.error("Procurement failed:", error);
    } finally {
      setIsProcuring(false);
    }
  };

  const handleAudit = async () => {
      if (!item1.trim() || !item2.trim()) return;
      setIsAuditing(true);
      try {
          const result = await compareItemsFiscalAudit(
              profile?.tasteProfile || "Unknown Taste",
              item1,
              item2,
              auditBudget
          );
          setAuditResult(result);
      } catch (error) {
          console.error("Audit failed:", error);
      } finally {
          setIsAuditing(false);
      }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openSearch = (query: string) => {
    window.open(`https://www.grailed.com/shop?query=${encodeURIComponent(query)}`, '_blank');
  };

  const saveToPocket = async (target: SourcingTarget) => {
      if (!user?.uid) return;
      try {
          await addToPocket(user.uid, 'text', {
              content: `Sourcing Target: ${target.targetArchetype}\nQuery: ${target.keywordBoolean}\nDesigners: ${target.emergingDesigner}\nRationale: ${target.rationale}`,
              title: target.targetArchetype,
              timestamp: Date.now(),
              origin: 'The Thimble'
          });
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Target saved to Pocket." } }));
      } catch (e) {
          console.error("Failed to save target", e);
      }
  };

  const saveAuditToPocket = async () => {
      if (!user?.uid || !auditResult) return;
      try {
          await addToPocket(user.uid, 'text', {
              content: `Fiscal Audit Verdict: ${auditResult.verdict}\n\nItem 1 Analysis: ${auditResult.item1Analysis}\n\nItem 2 Analysis: ${auditResult.item2Analysis}\n\nRationale: ${auditResult.rationale}`,
              title: `Fiscal Audit: ${auditResult.verdict}`,
              timestamp: Date.now(),
              origin: 'The Thimble'
          });
          window.dispatchEvent(new CustomEvent('mimi:registry_alert', { detail: { message: "Audit saved to Pocket." } }));
      } catch (e) {
          console.error("Failed to save audit", e);
      }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-stone-200 overflow-hidden pb-20 md:pb-0 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 border-b border-stone-800 shrink-0 bg-[#0a0a0a] gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl font-serif italic text-stone-100">The Thimble</h1>
          <p className="text-emerald-500/80 font-mono text-[10px] uppercase tracking-[0.2em] mt-2">Procurement & Sourcing Engine</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="flex bg-stone-900/50 p-1 rounded-md w-full sm:w-auto border border-stone-800">
                <button 
                    onClick={() => setActiveTab('sourcing')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs uppercase tracking-widest font-bold rounded transition-colors ${activeTab === 'sourcing' ? 'bg-stone-800 text-emerald-400 shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    Sourcing
                </button>
                <button 
                    onClick={() => setActiveTab('boards')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs uppercase tracking-widest font-bold rounded transition-colors ${activeTab === 'boards' ? 'bg-stone-800 text-emerald-400 shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    Boards
                </button>
                <button 
                    onClick={() => setActiveTab('audit')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs uppercase tracking-widest font-bold rounded transition-colors ${activeTab === 'audit' ? 'bg-stone-800 text-emerald-400 shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    Fiscal Audit
                </button>
            </div>
            <div className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-emerald-500/50 border border-stone-800 px-3 py-1 rounded-full">
            System Active: {new Date().toLocaleDateString()}
            </div>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Sidebar: Input & Artifacts */}
        <section className="w-full lg:w-[400px] xl:w-[500px] lg:border-r border-b lg:border-b-0 border-stone-800 lg:overflow-y-auto no-scrollbar p-6 bg-stone-900/20 shrink-0 flex flex-col gap-8">
          
          {activeTab === 'sourcing' && (
              <>
                  <div className="space-y-4">
                      <h2 className="font-serif italic text-xl text-stone-100">Visual Context</h2>
                      <div 
                          className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer bg-stone-900/30
                              ${isDragging ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-stone-800 hover:border-stone-600'}`}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                      >
                          <Upload className="w-6 h-6 text-stone-500 mb-2" />
                          <p className="text-sm font-medium text-stone-300">Upload Images</p>
                          <p className="text-xs text-stone-600 mt-1">Tap to select or drop files here</p>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange as any} className="hidden" multiple accept="image/*" />
                      </div>

                      <div className="flex gap-2">
                          <input
                              type="url"
                              value={linkInput}
                              onChange={(e) => setLinkInput(e.target.value)}
                              placeholder="Or paste a link (e.g., Grailed, SSENSE)"
                              className="flex-1 bg-stone-900/50 border border-stone-800 p-3 text-sm text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors rounded-md placeholder:text-stone-600"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                          />
                          <button
                              onClick={handleAddLink}
                              disabled={!linkInput.trim()}
                              className="bg-stone-800 text-stone-300 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-stone-700 disabled:opacity-50 transition-colors flex items-center justify-center border border-stone-700"
                          >
                              Add
                          </button>
                      </div>

                      {mediaFiles.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-4">
                              <AnimatePresence>
                                  {mediaFiles.map((media, idx) => (
                                      <motion.div 
                                          key={idx}
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.9 }}
                                          className="relative aspect-square rounded-md overflow-hidden border border-stone-800 group bg-stone-900/50"
                                      >
                                          {media.type === 'image' && media.data ? (
                                              <img src={media.data} alt="Artifact" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center p-2 text-center break-all">
                                                  <LinkIcon className="w-4 h-4 text-stone-500" />
                                              </div>
                                          )}
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); removeMedia(idx); }}
                                              className="absolute top-1 right-1 bg-black/80 text-stone-300 hover:text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                              <X size={12} />
                                          </button>
                                      </motion.div>
                                  ))}
                              </AnimatePresence>
                          </div>
                      )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Sourcing Objective</label>
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="e.g., Winter capsule, Wedding guest"
                        className="w-full bg-stone-900/50 border border-stone-800 p-3 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors rounded-md placeholder:text-stone-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Fiscal Constraints</label>
                      <input
                        type="text"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g., $50-$150, Uncapped"
                        className="w-full bg-stone-900/50 border border-stone-800 p-3 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors rounded-md placeholder:text-stone-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleProcure()}
                      />
                    </div>
                    
                    <button
                      onClick={handleProcure}
                      disabled={isProcuring || (!budget.trim() && mediaFiles.length === 0)}
                      className="w-full bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 p-4 font-mono text-xs uppercase tracking-widest hover:bg-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 rounded-md"
                    >
                      {isProcuring ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Procuring...</>
                      ) : (
                        <><Search className="w-4 h-4" /> Initialize Sourcing</>
                      )}
                    </button>
                  </div>
              </>
          )}

          {activeTab === 'boards' && (
              <div className="space-y-8">
                  <div className="space-y-4">
                      <h2 className="font-serif italic text-xl text-stone-100 flex items-center gap-2">
                          <FolderPlus className="w-5 h-5 text-emerald-500/70" />
                          Sourcing Boards
                      </h2>
                      <div className="flex gap-2">
                          <input
                              type="text"
                              value={newBoardTitle}
                              onChange={(e) => setNewBoardTitle(e.target.value)}
                              placeholder="New Board Title (e.g., FW26 Coats)"
                              className="flex-1 bg-stone-900/50 border border-stone-800 p-3 text-sm text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors rounded-md placeholder:text-stone-600"
                              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                          />
                          <button
                              onClick={handleCreateBoard}
                              disabled={!newBoardTitle.trim()}
                              className="bg-stone-800 text-stone-300 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-stone-700 disabled:opacity-50 transition-colors flex items-center justify-center border border-stone-700"
                          >
                              <Plus className="w-4 h-4" />
                          </button>
                      </div>

                      <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                          {boards.map(board => (
                              <div 
                                  key={board.id}
                                  onClick={() => setSelectedBoard(board)}
                                  className={`p-4 rounded-md border cursor-pointer transition-colors flex justify-between items-center group
                                      ${selectedBoard?.id === board.id ? 'bg-stone-800 border-emerald-500/30' : 'bg-stone-900/30 border-stone-800 hover:border-stone-700'}`}
                              >
                                  <div className="font-serif italic text-stone-200">{board.title}</div>
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }}
                                      className="text-stone-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                          {boards.length === 0 && (
                              <div className="text-center p-6 border border-dashed border-stone-800 rounded-md text-stone-500 text-sm">
                                  No boards created yet.
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'audit' && (
              <div className="space-y-6">
                  <div className="space-y-4">
                      <h2 className="font-serif italic text-xl text-stone-100">Comparison Data</h2>
                      <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Item 1 Description</label>
                          <textarea
                              value={item1}
                              onChange={(e) => setItem1(e.target.value)}
                              placeholder="Describe the first item (e.g., 'Vintage Helmut Lang boiled wool sweater, $250')"
                              className="w-full bg-stone-900/50 border border-stone-800 p-3 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors rounded-md resize-none h-24 placeholder:text-stone-600"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Item 2 Description</label>
                          <textarea
                              value={item2}
                              onChange={(e) => setItem2(e.target.value)}
                              placeholder="Describe the second item (e.g., 'New Acne Studios mohair cardigan, $400')"
                              className="w-full bg-stone-900/50 border border-stone-800 p-3 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors rounded-md resize-none h-24 placeholder:text-stone-600"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Fiscal Constraints (Optional)</label>
                          <input
                              type="text"
                              value={auditBudget}
                              onChange={(e) => setAuditBudget(e.target.value)}
                              placeholder="e.g., Max $300 total"
                              className="w-full bg-stone-900/50 border border-stone-800 p-3 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors rounded-md placeholder:text-stone-600"
                              onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                          />
                      </div>
                  </div>
                  <button
                      onClick={handleAudit}
                      disabled={isAuditing || !item1.trim() || !item2.trim()}
                      className="w-full bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 p-4 font-mono text-xs uppercase tracking-widest hover:bg-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 rounded-md"
                  >
                      {isAuditing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Auditing...</>
                      ) : (
                          <><Scale className="w-4 h-4" /> Run Fiscal Audit</>
                      )}
                  </button>
              </div>
          )}
        </section>

        {/* Right Area: Results */}
        <section className="flex-1 lg:overflow-y-auto p-6 md:p-12 bg-[#0a0a0a] min-h-[50vh]">
            {activeTab === 'sourcing' && (
                targets.length > 0 ? (
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
                      <ShoppingBag className="w-5 h-5 text-emerald-500/70" />
                      <h2 className="font-serif italic text-2xl text-stone-100">Sourcing Targets Acquired</h2>
                    </div>
                    
                    <div className="space-y-6">
                        {targets.map((target, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx} 
                            className="bg-stone-900/30 border border-stone-800 p-6 rounded-xl shadow-sm space-y-6"
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-stone-100 text-lg uppercase tracking-wider">{target.targetArchetype}</h3>
                              <span className="text-[10px] text-emerald-500/70 font-mono bg-emerald-900/10 border border-emerald-900/30 px-2 py-1 rounded">TARGET 0{idx + 1}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">Boolean Query</div>
                              <div className="bg-stone-950 border border-stone-800 p-4 rounded-md flex items-center justify-between group">
                                <code className="text-emerald-400 font-mono text-sm break-all pr-4">
                                  {target.keywordBoolean}
                                </code>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button 
                                    onClick={() => copyToClipboard(target.keywordBoolean, idx)}
                                    className="text-stone-400 hover:text-stone-200 transition-colors p-2 bg-stone-900 rounded-md shadow-sm border border-stone-700"
                                    title="Copy Query"
                                  >
                                    {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => openSearch(target.keywordBoolean)}
                                    className="text-stone-400 hover:text-stone-200 transition-colors p-2 bg-stone-900 rounded-md shadow-sm border border-stone-700"
                                    title="Search Grailed"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">Emerging Designer</div>
                                <div className="text-stone-300 font-serif italic">{target.emergingDesigner}</div>
                              </div>
                              <div className="space-y-2">
                                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">Rationale</div>
                                <div className="text-stone-400 leading-relaxed text-sm">{target.rationale}</div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-stone-800 flex justify-end">
                                <button 
                                    onClick={() => saveToPocket(target)}
                                    className="text-[10px] uppercase tracking-widest font-mono text-stone-500 hover:text-emerald-400 transition-colors flex items-center gap-2"
                                >
                                    Save to Pocket
                                </button>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                ) : (
                  !isProcuring && (
                    <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-6 max-w-md mx-auto text-center">
                      <div className="w-24 h-24 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 opacity-50 text-emerald-500/50" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-serif italic text-2xl text-stone-300">Awaiting Input</h3>
                        <p className="text-sm leading-relaxed text-stone-500">Provide visual artifacts, a sourcing objective, and fiscal constraints to generate highly specific procurement targets.</p>
                      </div>
                    </div>
                  )
                )
            )}

            {activeTab === 'boards' && (
                selectedBoard ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                            <div className="flex items-center gap-3">
                                <LayoutGrid className="w-5 h-5 text-emerald-500/70" />
                                <h2 className="font-serif italic text-2xl text-stone-100">{selectedBoard.title}</h2>
                            </div>
                            <button
                                onClick={handleAuditBoard}
                                disabled={isAuditingBoard || boardItems.length === 0}
                                className="bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-emerald-900/40 disabled:opacity-50 transition-colors flex items-center gap-2 rounded-md"
                            >
                                {isAuditingBoard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                                Audit Board
                            </button>
                        </div>

                        {/* Add Item to Board */}
                        <div className="bg-stone-900/30 border border-stone-800 p-6 rounded-xl space-y-4">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-emerald-500/80">Add Artifact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="url"
                                    value={newItemUrl}
                                    onChange={(e) => setNewItemUrl(e.target.value)}
                                    placeholder="URL (Required)"
                                    className="bg-stone-950 border border-stone-800 p-3 text-sm text-stone-200 focus:outline-none focus:border-emerald-500/50 rounded-md placeholder:text-stone-600"
                                />
                                <input
                                    type="text"
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                    placeholder="Title (Optional)"
                                    className="bg-stone-950 border border-stone-800 p-3 text-sm text-stone-200 focus:outline-none focus:border-emerald-500/50 rounded-md placeholder:text-stone-600"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItemPrice}
                                        onChange={(e) => setNewItemPrice(e.target.value)}
                                        placeholder="Price (Optional)"
                                        className="flex-1 bg-stone-950 border border-stone-800 p-3 text-sm text-stone-200 focus:outline-none focus:border-emerald-500/50 rounded-md placeholder:text-stone-600"
                                    />
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!newItemUrl.trim()}
                                        className="bg-stone-800 text-stone-300 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-stone-700 disabled:opacity-50 transition-colors border border-stone-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Board Items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardItems.map(item => (
                                <div key={item.id} className="bg-stone-900/20 border border-stone-800 p-4 rounded-lg relative group">
                                    <button 
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="absolute top-2 right-2 text-stone-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block space-y-2">
                                        <div className="font-serif italic text-stone-200 truncate pr-6">{item.title || 'Untitled Artifact'}</div>
                                        {item.price && <div className="text-xs font-mono text-emerald-500/80">{item.price}</div>}
                                        <div className="text-xs text-stone-500 truncate">{item.url}</div>
                                    </a>
                                </div>
                            ))}
                        </div>

                        {/* Board Audit Result */}
                        {boardAuditResult && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-stone-900/40 border border-emerald-900/50 p-8 rounded-xl shadow-sm space-y-8 mt-8"
                            >
                                <div className="text-center space-y-2 pb-6 border-b border-stone-800">
                                    <div className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Sovereign Mandate</div>
                                    <h3 className="font-serif italic text-3xl text-emerald-400">{boardAuditResult.verdict}</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono border-b border-stone-800 pb-2">Board Analysis</div>
                                        <p className="text-stone-300 text-sm leading-relaxed">{boardAuditResult.boardAnalysis}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono border-b border-stone-800 pb-2">Redundancies</div>
                                        <p className="text-stone-300 text-sm leading-relaxed">{boardAuditResult.redundancies}</p>
                                    </div>
                                    <div className="space-y-3 bg-stone-950 p-6 rounded-lg border border-stone-800">
                                        <div className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Rationale</div>
                                        <p className="text-stone-200 text-sm leading-relaxed">{boardAuditResult.rationale}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-6 max-w-md mx-auto text-center">
                        <div className="w-24 h-24 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center">
                            <FolderPlus className="w-10 h-10 opacity-50 text-emerald-500/50" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-serif italic text-2xl text-stone-300">Select a Board</h3>
                            <p className="text-sm leading-relaxed text-stone-500">Choose a sourcing board from the sidebar to view its artifacts and run a comprehensive fiscal audit.</p>
                        </div>
                    </div>
                )
            )}

            {activeTab === 'audit' && (
                auditResult ? (
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
                            <Scale className="w-5 h-5 text-emerald-500/70" />
                            <h2 className="font-serif italic text-2xl text-stone-100">Fiscal Audit Verdict</h2>
                        </div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-stone-900/30 border border-stone-800 p-8 rounded-xl shadow-sm space-y-8"
                        >
                            <div className="text-center space-y-2 pb-6 border-b border-stone-800">
                                <div className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Definitive Recommendation</div>
                                <h3 className="font-serif italic text-3xl text-emerald-400">{auditResult.verdict}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono border-b border-stone-800 pb-2">Item 1 Analysis</div>
                                    <p className="text-stone-300 text-sm leading-relaxed">{auditResult.item1Analysis}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono border-b border-stone-800 pb-2">Item 2 Analysis</div>
                                    <p className="text-stone-300 text-sm leading-relaxed">{auditResult.item2Analysis}</p>
                                </div>
                            </div>

                            <div className="space-y-3 bg-stone-950 p-6 rounded-lg border border-stone-800">
                                <div className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-mono">Rationale</div>
                                <p className="text-stone-200 text-sm leading-relaxed">{auditResult.rationale}</p>
                            </div>

                            <div className="pt-4 border-t border-stone-800 flex justify-end">
                                <button 
                                    onClick={saveAuditToPocket}
                                    className="text-[10px] uppercase tracking-widest font-mono text-stone-500 hover:text-emerald-400 transition-colors flex items-center gap-2"
                                >
                                    Save to Pocket
                                </button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    !isAuditing && (
                        <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-6 max-w-md mx-auto text-center">
                            <div className="w-24 h-24 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center">
                                <Scale className="w-10 h-10 opacity-50 text-emerald-500/50" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-serif italic text-2xl text-stone-300">Awaiting Items</h3>
                                <p className="text-sm leading-relaxed text-stone-500">Provide descriptions of two items to receive a rigorous fiscal and aesthetic comparison.</p>
                            </div>
                        </div>
                    )
                )
            )}
        </section>
      </div>
    </div>
  );
};
