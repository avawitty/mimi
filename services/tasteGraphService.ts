import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebaseInit";
import { handleFirestoreError, OperationType } from "./firebaseUtils";
import { TasteGraphNode, TasteGraphEdge } from "../types";

export const saveTasteGraph = async (uid: string, nodes: TasteGraphNode[], edges: TasteGraphEdge[]) => {
  if (!uid || uid === 'ghost') return;

  const nodesCol = collection(db, `users/${uid}/tasteGraphNodes`);
  const edgesCol = collection(db, `users/${uid}/tasteGraphEdges`);

  try {
    const oldNodes = await getDocs(nodesCol);
    const oldEdges = await getDocs(edgesCol);

    const operations: (() => void)[] = [];

    let currentBatch = writeBatch(db);
    let opCount = 0;

    const commitBatch = async () => {
      if (opCount > 0) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        opCount = 0;
      }
    };

    const addOp = async (op: () => void) => {
      op();
      opCount++;
      if (opCount >= 490) {
        await commitBatch();
      }
    };

    // Clear existing
    for (const d of oldNodes.docs) {
      await addOp(() => currentBatch.delete(d.ref));
    }
    for (const d of oldEdges.docs) {
      await addOp(() => currentBatch.delete(d.ref));
    }

    // Add new
    for (const n of nodes) {
      await addOp(() => currentBatch.set(doc(nodesCol, n.id), n));
    }
    for (const e of edges) {
      await addOp(() => currentBatch.set(doc(edgesCol, `${e.source}_${e.target}`), e));
    }

    await commitBatch();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${uid}/tasteGraph`);
  }
};

export const getTasteGraph = async (uid: string): Promise<{ nodes: TasteGraphNode[], edges: TasteGraphEdge[] }> => {
  if (!uid || uid === 'ghost') return { nodes: [], edges: [] };

  try {
    const nodesSnap = await getDocs(collection(db, `users/${uid}/tasteGraphNodes`));
    const edgesSnap = await getDocs(collection(db, `users/${uid}/tasteGraphEdges`));

    return {
      nodes: nodesSnap.docs.map(d => d.data() as TasteGraphNode),
      edges: edgesSnap.docs.map(d => d.data() as TasteGraphEdge)
    };
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `users/${uid}/tasteGraph`);
    return { nodes: [], edges: [] };
  }
};
