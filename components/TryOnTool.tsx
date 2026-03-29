import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const TryOnTool: React.FC = () => {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [itemImage, setItemImage] = useState<string | null>(null);

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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Try-On Conceptualization Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="model-upload">Model Base</Label>
            <Input id="model-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setModelImage)} />
            {modelImage && <img src={modelImage} alt="Model" className="mt-2 w-full h-auto rounded" />}
          </div>
          <div>
            <Label htmlFor="item-upload">Clothing Item</Label>
            <Input id="item-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setItemImage)} />
            {itemImage && <img src={itemImage} alt="Item" className="mt-2 w-full h-auto rounded" />}
          </div>
        </div>
        <Button className="w-full">Analyze Silhouette & Try-On</Button>
        <div className="p-4 bg-muted rounded">
          <p className="text-sm text-muted-foreground">
            Analysis results (silhouette bias, color theory, mask data) will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
