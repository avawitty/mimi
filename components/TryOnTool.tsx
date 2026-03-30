import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeTryOn } from "@/services/geminiService";
import { Loader2, Save, FolderPlus, Check, Pocket as PocketIcon, Info, User as UserIcon, Shirt } from "lucide-react";
import { useUser } from '../contexts/UserContext';
import { db } from '../services/firebaseInit';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ThimbleBoard } from '../types';
import { handleFirestoreError, OperationType } from '../services/firebaseUtils';
import { motion, AnimatePresence } from 'framer-motion';

export const TryOnTool: React.FC = () => {
  const { user } = useUser();
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [boards, setBoards] = useState<ThimbleBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isPocketSaved, setIsPocketSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'thimbleBoards'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThimbleBoard));
      setBoards(b);
      if (b.length > 0 && !selectedBoardId) {
        setSelectedBoardId(b[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'thimbleBoards');
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!modelImage || !itemImage) return;
    setLoading(true);
    setIsSaved(false);
    setIsPocketSaved(false);
    try {
      const result = await analyzeTryOn(modelImage, itemImage, "image/png");
      setAnalysisResult(result);
    } catch (e) {
      console.error("Try-on analysis failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBoard = async () => {
    if (!user?.uid || !analysisResult || !selectedBoardId) return;
    try {
      await addDoc(collection(db, 'thimbleItems'), {
        boardId: selectedBoardId,
        userId: user.uid,
        title: `Try-On: ${analysisResult.silhouette_archetype || 'Analysis'}`,
        imageUrl: itemImage,
        notes: `Body Type: ${analysisResult.body_type_analysis}\n\nSilhouette Archetype: ${analysisResult.silhouette_archetype}\n\nStylist Note: ${analysisResult.stylist_note}`,
        url: '#',
        price: 'N/A',
        createdAt: serverTimestamp()
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save to board", e);
    }
  };

  const handleSaveToPocket = async () => {
    if (!user?.uid || !analysisResult) return;
    try {
      const { archiveManager } = await import('../services/archiveManager');
      await archiveManager.saveToPocket(user.uid, 'text', {
        content: `Try-On Analysis\n\nSilhouette Archetype: ${analysisResult.silhouette_archetype}\nBody Type Analysis: ${analysisResult.body_type_analysis}\nSilhouette Bias: ${analysisResult.silhouette_bias}\nColor Theory: ${analysisResult.color_theory}\nStylist Note: ${analysisResult.stylist_note}`,
        title: `Try-On Analysis: ${analysisResult.silhouette_archetype}`,
        timestamp: Date.now(),
        origin: 'AI Try-On Tool'
      });
      setIsPocketSaved(true);
      setTimeout(() => setIsPocketSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save to pocket", e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Input Section */}
        <Card className="flex-1 rounded-none border-nous-border bg-white/50 backdrop-blur-sm">
          <CardHeader className="border-b border-nous-border">
            <CardTitle className="font-serif italic text-2xl flex items-center gap-2">
              <Shirt size={20} className="opacity-60" />
              Try-On Input
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="model-upload" className="text-[10px] uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
                  <UserIcon size={12} /> Model Base / Your Photo
                </Label>
                <div className="relative aspect-[3/4] border border-nous-border bg-stone-100 flex items-center justify-center overflow-hidden group">
                  {modelImage ? (
                    <>
                      <img src={modelImage} alt="Model" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" onClick={() => setModelImage(null)} className="rounded-none text-[10px] uppercase tracking-widest">Remove</Button>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                      <FolderPlus size={32} />
                      <span className="text-[10px] uppercase tracking-widest">Upload Base</span>
                      <input id="model-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setModelImage)} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="item-upload" className="text-[10px] uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
                  <Shirt size={12} /> Clothing Item Artifact
                </Label>
                <div className="relative aspect-[3/4] border border-nous-border bg-stone-100 flex items-center justify-center overflow-hidden group">
                  {itemImage ? (
                    <>
                      <img src={itemImage} alt="Item" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" onClick={() => setItemImage(null)} className="rounded-none text-[10px] uppercase tracking-widest">Remove</Button>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                      <FolderPlus size={32} />
                      <span className="text-[10px] uppercase tracking-widest">Upload Item</span>
                      <input id="item-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setItemImage)} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <Button 
              className="w-full rounded-none bg-nous-base text-nous-text border border-nous-border hover:bg-white transition-all text-[11px] uppercase tracking-[0.2em] py-6" 
              onClick={handleAnalyze} 
              disabled={loading || !modelImage || !itemImage}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Execute Silhouette Analysis"}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 space-y-6"
            >
              <Card className="rounded-none border-nous-border bg-white shadow-xl">
                <CardHeader className="border-b border-nous-border bg-stone-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-serif italic text-2xl">Silhouette Verdict</CardTitle>
                    <div className="px-3 py-1 bg-nous-base border border-nous-border text-[9px] uppercase tracking-widest font-black">
                      {analysisResult.silhouette_archetype}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-60">
                      <Info size={14} /> Body Type Analysis
                    </div>
                    <p className="font-serif text-lg leading-relaxed italic text-nous-text/80">
                      "{analysisResult.body_type_analysis}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-4 border border-nous-border bg-stone-50/50 space-y-2">
                      <div className="text-[9px] uppercase tracking-widest font-bold opacity-50">Silhouette Bias</div>
                      <p className="text-sm leading-relaxed">{analysisResult.silhouette_bias}</p>
                    </div>
                    <div className="p-4 border border-nous-border bg-stone-50/50 space-y-2">
                      <div className="text-[9px] uppercase tracking-widest font-bold opacity-50">Color Theory</div>
                      <p className="text-sm leading-relaxed">{analysisResult.color_theory}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-nous-border space-y-4">
                    <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">Stylist's Note</div>
                    <p className="text-sm leading-relaxed font-mono opacity-80 bg-stone-100 p-4 border-l-2 border-nous-border">
                      {analysisResult.stylist_note}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-nous-border space-y-4">
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest opacity-60">Select Board for Acquisition</Label>
                        <select 
                          value={selectedBoardId}
                          onChange={(e) => setSelectedBoardId(e.target.value)}
                          className="w-full bg-white border border-nous-border p-3 text-[10px] uppercase tracking-widest outline-none focus:ring-0"
                        >
                          {boards.map(board => (
                            <option key={board.id} value={board.id}>{board.title}</option>
                          ))}
                          {boards.length === 0 && <option value="">No boards available</option>}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveToBoard} 
                          disabled={!selectedBoardId || isSaved}
                          className="flex-1 rounded-none bg-white text-nous-text border border-nous-border hover:bg-stone-50 text-[10px] uppercase tracking-widest gap-2"
                        >
                          {isSaved ? <><Check size={14} /> Saved to Board</> : <><Save size={14} /> Save to Board</>}
                        </Button>
                        <Button 
                          onClick={handleSaveToPocket} 
                          disabled={isPocketSaved}
                          variant="outline"
                          className="rounded-none text-[10px] uppercase tracking-widest gap-2"
                        >
                          {isPocketSaved ? <><Check size={14} /> Archived</> : <><PocketIcon size={14} /> Pocket</>}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
