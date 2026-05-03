'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export type LsgMapping = {
  lsg: string;
  constituency: string;
};

/**
 * Custom hook to retrieve real-time LSGD, Constituency, and Mapping data from Firestore.
 * This ensures data is shared across all users and persists permanently.
 */
export function useLsgdData() {
  const firestore = useFirestore();
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    // Explicit reference to the global data document
    return doc(firestore, 'appSettings', 'global_data');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  // Return empty arrays if document doesn't exist yet or is loading
  const lsgs: string[] = settings?.lsgs || [];
  const constituencies: string[] = settings?.constituencies || [];
  const lsgMappings: LsgMapping[] = settings?.lsgMappings || [];

  return { lsgs, constituencies, lsgMappings, isLoading };
}
