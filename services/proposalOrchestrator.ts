
// @ts-nocheck
import { Proposal, ProposalContent, ProposalSection, EditorElement, UserProfile, PocketItem } from "../types";
import { generateProposalStrategy, refineProposalText } from "./geminiService";
import { saveProposal, fetchPocketItems } from "./firebaseUtils";

/**
 * PROPOSAL ORCHESTRATOR
 * The central brain for converting unstructured folder data into 
 * structured, first-class Proposal objects.
 */

interface ProposalGenerationConfig {
  userId: string;
  folderId: string;
  selectedPreset: string;
  selectedModules: string[];
  profile: UserProfile | null;
}

export const generateProposalFromFolder = async (
  config: ProposalGenerationConfig
): Promise<Proposal> => {
  
  // 1. FETCH FOLDER & ARTIFACTS
  // In the absence of a specific folder fetcher that returns items directly,
  // we fetch all items and filter by folderId (or parentShardId if using that logic, 
  // but ArchivalView uses 'moodboard' items with content.itemIds).
  
  const allItems = await fetchPocketItems(config.userId);
  
  // Find the folder (Moodboard)
  const folderItem = allItems.find(i => i.id === config.folderId && i.type === 'moodboard');
  
  if (!folderItem) {
      throw new Error("Source Folder Logic Corrupted.");
  }

  // Filter items that belong to this folder
  const folderItemIds = folderItem.content.itemIds || [];
  const sourceItems = allItems.filter(i => folderItemIds.includes(i.id));

  // 2. PRE-PROCESS ITEMS TO EXTRACT ZINE CONTEXT
  let zineContext = "";
  
  sourceItems.forEach(item => {
      if (item.type === 'zine_card' && item.content?.analysis) {
          const zTitle = item.content.title;
          const zBrief = item.content.analysis.design_brief || item.content.analysis.strategic_hypothesis;
          const zProvocation = item.content.analysis.poetic_provocation;
          
          zineContext += `\n[REFERENCED ZINE: "${zTitle}"]\nSTRATEGIC HYPOTHESIS: ${zBrief}\nPROVOCATION: ${zProvocation}\n`;
      }
  });

  // Folder notes provide the primary directive
  const fullNotes = `${folderItem.notes || ''}\n\n${zineContext}`;
  const folderName = folderItem.content.name || "Untitled Strategy";

  // 3. GENERATE RAW STRATEGY FROM ORACLE
  const strategyResponse = await generateProposalStrategy(
    folderName,
    sourceItems,
    fullNotes,
    config.profile
  );

  if (!strategyResponse || !strategyResponse.chapters) {
    throw new Error("Oracle failed to structure the proposal.");
  }

  // 4. TRANSFORM RAW AI OUTPUT INTO EDITOR ELEMENTS
  const sections: ProposalSection[] = strategyResponse.chapters.map((chap: any, i: number) => {
    const slideId = `slide_${i}_${Date.now()}`;
    const elements: EditorElement[] = [];

    // Title Block
    elements.push({
      id: `${slideId}_title`,
      type: 'text',
      content: chap.title,
      style: { 
        top: 10, left: 8, width: 40, zIndex: 10, 
        fontSize: 3.5, fontFamily: 'serif', fontWeight: '900', fontStyle: 'italic',
        color: '#1C1917', lineHeight: 0.9
      }
    });

    // Body Block
    elements.push({
      id: `${slideId}_body`,
      type: 'text',
      content: chap.body,
      style: { 
        top: 35, left: 8, width: 40, zIndex: 9, 
        fontSize: 1.1, fontFamily: 'serif', fontWeight: '400', 
        color: '#44403C', lineHeight: 1.4
      }
    });

    // Visual Directive (Latent Image Prompt)
    if (chap.visual_directive) {
      elements.push({
        id: `${slideId}_visual`,
        type: 'image',
        content: chap.visual_directive, 
        style: {
          top: 10, left: 55, width: 40, zIndex: 5,
          objectFit: 'cover'
        }
      });
    }

    return {
      id: slideId,
      title: chap.title,
      body: chap.body,
      visual_directive: chap.visual_directive,
      elements,
      order: i
    };
  });

  // 5. CONSTRUCT THE SOVEREIGN OBJECT
  const proposalId = `prop_${config.userId}_${Date.now()}`;
  
  const proposal: Proposal = {
    id: proposalId,
    userId: config.userId,
    title: folderName,
    sourceFolderId: config.folderId,
    sourceArtifactIds: sourceItems.map(i => i.id),
    
    content: {
      summary: strategyResponse.manifesto_summary || "Strategic Synthesis",
      analysis: "Generated via Mimi Proposal Engine",
      sections: sections
    },
    
    layout: {
      template: 'editorial',
      fontSet: ['Cormorant Garamond', 'Space Grotesk'],
      colorSet: ['#1C1917', '#FDFBF7'],
      spacingScale: 1.0,
      customStyles: {}
    },
    
    brandKitSnapshot: {
      primaryFont: 'Cormorant Garamond',
      secondaryFont: 'Space Grotesk',
      colorPalette: []
    },

    version: 1,
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // 6. SAVE TO REGISTRY
  await saveProposal(proposal);

  return proposal;
};

// PHASE 3: REFINEMENT ASSISTANT
export const refineSectionContent = async (
  currentText: string,
  instruction: string,
  profile: UserProfile | null
): Promise<string> => {
  return await refineProposalText(currentText, instruction, profile);
};

export const saveProposalToRegistry = async (proposal: Proposal) => {
  await saveProposal(proposal);
  return proposal.id;
};
