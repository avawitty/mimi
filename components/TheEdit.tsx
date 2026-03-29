// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Settings, LayoutGrid, BookOpen } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getPersonalizedEdit, MOCK_PRODUCTS } from '../services/commerceService';
import { Product, EditIssue, ProductTasteEvent, TasteProfile } from '../types';
import { handleFirestoreError, OperationType } from '../services/firebaseUtils';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseInit';
import { CodexSignal } from './CodexSignal';
import { deriveCodexState, CodexState, saveCodexState } from '../services/codexService';
import { useDwellTracking } from '../hooks/useDwellTracking';
import { logProductTasteEvent } from '../services/tasteLogger';

const ProductCard = ({ product, onInteraction }: { product: Product; onInteraction: (id: string, signal: any) => void }) => {
 const ref = useRef<HTMLDivElement>(null);
 useDwellTracking(ref, (signal) => onInteraction(product.id, signal));
 
 const handleAcquire = () => {
 // Record the click event in Google Analytics
 if (typeof (window as any).gtag === 'function') {
 (window as any).gtag('event', 'click_affiliate', {
 product_id: product.id,
 product_name: product.name
 });
 }
 // Route outward
 const affiliateUrl = product.affiliateLink?.includes('?') ? `${product.affiliateLink}&ref=mimi_zine` : `${product.affiliateLink}?ref=mimi_zine`;
 window.open(affiliateUrl, '_blank');
 };

 return (
 <div ref={ref} className="group relative border border bg-white p-4 transition-all hover:border-black cursor-pointer"onClick={handleAcquire}>
 <div className="aspect-[4/5] bg-nous-base mb-4 flex items-center justify-center overflow-hidden relative">
 {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/> : <span className="font-serif italic text-nous-subtle">{product.name}</span>}
 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"/>
 </div>
 <div className="flex justify-between items-end">
 <div>
 <h5 className="font-serif text-lg italic">{product.name}</h5>
 <p className="font-mono text-[9px] text-nous-subtle uppercase">{product.category || 'Archival Series'}</p>
 </div>
 <button onClick={(e) => { e.stopPropagation(); handleAcquire(); }} className="font-mono text-[9px] uppercase underline hover:text-nous-text transition-colors">Acquire</button>
 </div>
 </div>
 );
};

export const TheEdit: React.FC = () => {
 const { user, loading } = useUser();
 const [personalizedEdit, setPersonalizedEdit] = useState<EditIssue | null>(null);
 const [viewMode, setViewMode] = useState<'editorial' | 'market'>('market');
 const [products, setProducts] = useState<Product[]>([]);
 const [codexState, setCodexState] = useState<CodexState>({ entropy: 0.5, density: 0.5, velocity: 0, timestamp: Date.now() });
 const [interactions, setInteractions] = useState<ProductTasteEvent[]>([]);
 const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
 const [marketError, setMarketError] = useState<string | null>(null);

 useEffect(() => {
 if (loading) return;
 if (user && !user.uid.startsWith('local_ghost_') && user.uid !== 'ghost') {
 const fetchData = async () => {
 try {
 const profileDoc = await getDoc(doc(db, 'users', user.uid, 'taste', 'profile'));
 const profile = profileDoc.exists() ? profileDoc.data() as TasteProfile : { archetype_weights: {}, audit_history: [] };
 setTasteProfile(profile);

 const q = query(collection(db, 'product_interactions'), where('userId', '==', user.uid));
 const snapshot = await getDocs(q);
 const events = snapshot.docs.map(doc => doc.data() as ProductTasteEvent);
 setInteractions(events);
 
 const codex = deriveCodexState(profile, events);
 setCodexState(codex);

 const tasteVector = user.tasteVector ? Object.values(user.tasteVector) : [0.5, 0.5, 0.5];
 getPersonalizedEdit(user.uid, tasteVector, codex, profile).then(edit => {
 setPersonalizedEdit(edit);
 }).catch(e => console.error("MIMI // Failed to get personalized edit", e));
 } catch (error) {
 handleFirestoreError(error, OperationType.GET, `users/${user.uid}/taste/profile`);
 }
 };
 fetchData();
 }
 }, [user, loading]);

 if (loading) {
 return <div className="min-h-screen bg text font-sans flex items-center justify-center">Synchronizing aesthetic vectors...</div>;
 }

 const handleInteraction = (productId: string, signal: any) => {
 logProductTasteEvent({
 userId: user!.uid,
 itemId: productId,
 dwellTime: signal.dwellMs,
 interactionType: 'view',
 timestamp: Date.now()
 });
 };

 useEffect(() => {
 if (personalizedEdit?.sequence) {
 const fetchProducts = async () => {
 try {
 const productPromises = personalizedEdit.sequence.map(async (item) => {
 try {
 const docSnap = await getDoc(doc(db, 'products', item.productId));
 if (docSnap.exists()) {
 return { id: docSnap.id, ...docSnap.data() } as Product;
 }
 } catch (e) {
 console.warn("Could not fetch from Firestore, falling back to mock", e);
 }
 // Fallback to MOCK_PRODUCTS
 return MOCK_PRODUCTS.find(p => p.id === item.productId) || null;
 });
 const productDocs = await Promise.all(productPromises);
 const fetchedProducts = productDocs.filter((p): p is Product => p !== null);
 
 setProducts(fetchedProducts);
 setMarketError(null);
 } catch (err) {
 console.error("Error fetching products:", err);
 setMarketError("Failed to load market products.");
 }
 };
 fetchProducts();
 }
 }, [personalizedEdit]);

 return (
 <div className="min-h-screen bg text font-sans flex">
 <nav className="w-20 border-r border flex flex-col items-center py-12 fixed h-full z-50 bg">
 <div className="mb-12 font-serif italic text-2xl">M.</div>
 <div className="flex flex-col gap-6 mt-auto mb-12">
 <Search size={16} className="text-nous-subtle hover:text-black cursor-pointer"/>
 <Settings size={16} className="text-nous-subtle hover:text-black cursor-pointer"/>
 </div>
 </nav>

 <main className="ml-20 flex-1 p-12">
 <header className="mb-16 border-b border pb-8 flex justify-between items-end">
 <div>
 <div className="flex items-center gap-3 mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-nous-subtle">
 <span>Institutional Protocol // Rev. 09-26</span>
 <span className="h-px w-12 bg-stone-300"></span>
 <span className="text-green-600">● LIVE_FEED</span>
 </div>
 <h1 className="font-serif text-7xl italic tracking-tighter leading-none">Aesthetic Clusters.</h1>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex bg p-1 rounded-none">
 <button onClick={() => setViewMode('editorial')} className={`px-4 py-1 rounded-none text-[10px] uppercase tracking-widest flex items-center gap-2 ${viewMode === 'editorial' ? 'bg-white ' : ''}`}><BookOpen size={12} /> Editorial</button>
 <button onClick={() => setViewMode('market')} className={`px-4 py-1 rounded-none text-[10px] uppercase tracking-widest flex items-center gap-2 ${viewMode === 'market' ? 'bg-white ' : ''}`}><LayoutGrid size={12} /> Market</button>
 </div>
 <div className="text-right font-mono text-[10px] uppercase tracking-widest text-nous-subtle">
 ISSUE_NO: 402/DAILY<br/>
 Synchronized: {new Date().toLocaleTimeString()}
 </div>
 </div>
 </header>

 {personalizedEdit ? (
 <section className="grid grid-cols-12 gap-8">
 <article className="col-span-12 lg:col-span-4 bg p-8 border border">
 <div className="font-mono text-[10px] uppercase tracking-widest text-nous-subtle mb-4">Trajectory ID: {personalizedEdit.trajectoryId}</div>
 <h2 className="font-serif text-4xl italic mb-6">{personalizedEdit.thesis}</h2>
 <p className="text-sm leading-relaxed text-nous-subtle mb-8">{personalizedEdit.codexReading}</p>
 <CodexSignal entropy={codexState.entropy} density={codexState.density} />
 </article>

 <div className="col-span-12 lg:col-span-8">
 <div className="border-2 border-dashed border-nous-border p-8 text-center text-nous-subtle font-mono text-xs mb-8">
 // SPONSORED AESTHETIC CLUSTER //
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {personalizedEdit.sequence.map((item) => {
 const product = products.find(p => p.id === item.productId);
 if (!product) return null;
 return (
 <div key={item.productId} className={`${item.placement === 'hero' ? 'col-span-full' : ''}`}>
 <ProductCard product={product} onInteraction={handleInteraction} />
 <p className="font-mono text-[10px] mt-2 text-nous-subtle">{item.caption}</p>
 </div>
 );
 })}
 </div>
 </div>
 </section>
 ) : (
 <div className="p-12 text-center text-nous-subtle font-mono text-sm">
 Synchronizing aesthetic vectors...
 </div>
 )}
 </main>
 </div>
 );
};
