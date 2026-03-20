import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebaseInit";
import { handleFirestoreError, OperationType } from "./firebaseUtils";
import { TasteGraphNode, TasteGraphEdge } from "../types";

export const saveTasteGraph = async (nodes: TasteGraphNode[], edges: TasteGraphEdge[]) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const batch = writeBatch(db);
  const nodesCol = collection(db, `users/${uid}/tasteGraphNodes`);
  const edgesCol = collection(db, `users/${uid}/tasteGraphEdges`);

  try {
    // Clear existing
    const oldNodes = await getDocs(nodesCol);
    oldNodes.docs.forEach(d => batch.delete(d.ref));
    const oldEdges = await getDocs(edgesCol);
    oldEdges.docs.forEach(d => batch.delete(d.ref));

    // Add new
    nodes.forEach(n => batch.set(doc(nodesCol, n.id), n));
    edges.forEach(e => batch.set(doc(edgesCol, `${e.source}_${e.target}`), e));

    await batch.commit();
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${uid}/tasteGraph`);
  }
};

export const getTasteGraph = async (): Promise<{ nodes: TasteGraphNode[], edges: TasteGraphEdge[] }> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return { nodes: [], edges: [] };

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
