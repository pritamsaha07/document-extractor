import { create } from "zustand";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";

const useDataStore = create((set, get) => ({
  documents: [],
  currentDocument: null,
  unsubscribe: null,

  initializeListener: () => {
    const unsubscribe = onSnapshot(collection(db, "documents"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ documents: docs });
    });

    set({ unsubscribe });
    return unsubscribe;
  },

  cleanupListener: () => {
    const currentUnsubscribe = get().unsubscribe;
    if (currentUnsubscribe) {
      currentUnsubscribe();
    }
  },

  fetchDocuments: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "documents"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ documents: docs });
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  },

  setDocuments: async (newDoc) => {
    try {
      const docRef = await addDoc(collection(db, "documents"), newDoc);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document to Firestore:", error);
    }
  },

  updateDocument: async (documentId, updates) => {
    try {
      const docRef = doc(db, "documents", documentId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  },

  deleteDocument: async (documentId) => {
    try {
      await deleteDoc(doc(db, "documents", documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  },

  setCurrentDocument: (doc) => set({ currentDocument: doc }),
}));

export default useDataStore;
