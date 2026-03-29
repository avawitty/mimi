import { uploadBlob, uploadBase64Image, addToPocket } from './firebaseUtils';
import { db, storage } from './firebaseInit';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { PocketItem } from '../types';

export const archiveManager = {
  async uploadMedia(userId: string, fileOrBase64: File | Blob | string, pathPrefix: string): Promise<string> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const path = `users/${userId}/${pathPrefix}/${timestamp}_${randomId}`;
    
    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('data:')) {
        return await uploadBase64Image(fileOrBase64, path);
      }
      return fileOrBase64; // Already a URL
    } else {
      return await uploadBlob(fileOrBase64, path);
    }
  },

  async saveToPocket(userId: string, type: PocketItem['type'], content: any, media?: (File | Blob | string)[], embedding?: number[], deltaVerdict?: any): Promise<string | undefined> {
    try {
      let processedContent = { ...content };
      
      if (media && media.length > 0) {
        const uploadPromises = media.map((m, i) => this.uploadMedia(userId, m, `artifacts/pocket_${i}`));
        const mediaUrls = await Promise.all(uploadPromises);
        processedContent.mediaUrls = [...(processedContent.mediaUrls || []), ...mediaUrls];
      }

      // Ensure no base64 is saved
      if (processedContent.image && processedContent.image.startsWith('data:')) {
         processedContent.image = await this.uploadMedia(userId, processedContent.image, 'artifacts/pocket_main');
      }
      if (processedContent.imageUrl && processedContent.imageUrl.startsWith('data:')) {
         processedContent.imageUrl = await this.uploadMedia(userId, processedContent.imageUrl, 'artifacts/pocket_main');
      }

      const itemId = await addToPocket(userId, type, processedContent, embedding, deltaVerdict, content);
      
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Artifact Archived in Firebase.", type: 'success' } 
      }));
      
      return itemId;
    } catch (error) {
      console.error("Failed to save to Pocket:", error);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Failed to archive artifact.", type: 'error' } 
      }));
      throw error;
    }
  },

  async saveToBoard(userId: string, boardId: string, item: any): Promise<void> {
    try {
      const boardRef = doc(db, 'users', userId, 'boards', boardId);
      const boardSnap = await getDoc(boardRef);
      
      if (!boardSnap.exists()) {
        throw new Error("Board does not exist.");
      }

      await updateDoc(boardRef, {
        items: arrayUnion(item),
        updatedAt: Date.now()
      });

      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Artifact Archived in Firebase.", type: 'success' } 
      }));
    } catch (error) {
      console.error("Failed to save to Board:", error);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Failed to archive artifact.", type: 'error' } 
      }));
      throw error;
    }
  },

  async saveZine(userId: string, zineData: any, coverImage?: File | Blob | string): Promise<void> {
    try {
      let processedZine = { ...zineData };
      
      if (coverImage) {
        const coverUrl = await this.uploadMedia(userId, coverImage, 'zines/covers');
        processedZine.coverUrl = coverUrl;
      }

      const zineId = `zine_${Date.now()}`;
      await setDoc(doc(db, 'users', userId, 'zines', zineId), {
        ...processedZine,
        createdAt: Date.now()
      });

      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Artifact Archived in Firebase.", type: 'success' } 
      }));
    } catch (error) {
      console.error("Failed to save Zine:", error);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Failed to archive artifact.", type: 'error' } 
      }));
      throw error;
    }
  },

  async saveStrategyAudit(userId: string, audit: any): Promise<void> {
    try {
      let processedAudit = { ...audit };
      
      if (processedAudit.media && processedAudit.media.length > 0) {
        const uploadPromises = processedAudit.media.map(async (m: any, i: number) => {
          if (m.data && m.data.startsWith('data:')) {
            const url = await this.uploadMedia(userId, m.data, `audits/${audit.id}_${i}`);
            return { ...m, data: url };
          }
          return m;
        });
        processedAudit.media = await Promise.all(uploadPromises);
      }

      const auditRef = doc(db, `users/${userId}/reads`, audit.id);
      await setDoc(auditRef, processedAudit);

      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Artifact Archived in Firebase.", type: 'success' } 
      }));
    } catch (error) {
      console.error("Failed to save Strategy Audit:", error);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Failed to archive artifact.", type: 'error' } 
      }));
      throw error;
    }
  },

  async saveToDarkroom(userId: string, item: any): Promise<void> {
    try {
      const darkroomRef = doc(db, 'users', userId, 'darkroom', `item_${Date.now()}`);
      await setDoc(darkroomRef, {
        ...item,
        createdAt: Date.now()
      });

      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Artifact saved to Darkroom.", type: 'success' } 
      }));
    } catch (error) {
      console.error("Failed to save to Darkroom:", error);
      window.dispatchEvent(new CustomEvent('mimi:registry_alert', { 
        detail: { message: "Failed to save to Darkroom.", type: 'error' } 
      }));
      throw error;
    }
  }
};
