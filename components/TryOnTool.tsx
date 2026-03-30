import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { analyzeTryOn } from "@/services/geminiService";
import { Loader2 } from "lucide-react";

export const TryOnTool: React.FC = () => {
 const [modelImage, setModelImage] = useState<string | null>(null);
 const [itemImage, setItemImage] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [analysisResult, setAnalysisResult] = useState<any>(null);

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
    try {
        const result = await analyzeTryOn(modelImage, itemImage, "image/png");
        setAnalysisResult(result);
    } catch (e) {
        console.error("Try-on analysis failed:", e);
    } finally {
        setLoading(false);
    }
 };

 return (
 <Card className="w-full max-w-2xl mx-auto">
 <CardHeader>
 <CardTitle>AI Try-On Conceptualization Tool</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label htmlFor="model-upload">Model Base</Label>
 <Input id="model-upload"type="file"accept="image/*"onChange={(e) => handleImageUpload(e, setModelImage)} />
 {modelImage && <img src={modelImage} alt="Model"className="mt-2 w-full h-auto rounded"/>}
 </div>
 <div>
 <Label htmlFor="item-upload">Clothing Item</Label>
 <Input id="item-upload"type="file"accept="image/*"onChange={(e) => handleImageUpload(e, setItemImage)} />
 {itemImage && <img src={itemImage} alt="Item"className="mt-2 w-full h-auto rounded"/>}
 </div>
 </div>
 <Button className="w-full" onClick={handleAnalyze} disabled={loading || !modelImage || !itemImage}>
    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Analyze Silhouette & Try-On"}
 </Button>
 {analysisResult && (
    <div className="p-4 bg-muted rounded space-y-2">
        <h3 className="font-semibold">Analysis Results</h3>
        <p><strong>Silhouette Bias:</strong> {analysisResult.silhouette_bias}</p>
        <p><strong>Color Theory:</strong> {analysisResult.color_theory}</p>
        <p><strong>Mask Data:</strong> {analysisResult.mask_data}</p>
        <p><strong>Stylist Note:</strong> {analysisResult.stylist_note}</p>
    </div>
 )}
 </CardContent>
 </Card>
 );
};
