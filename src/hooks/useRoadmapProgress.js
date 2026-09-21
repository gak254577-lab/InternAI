import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc, updateDoc, setDoc, serverTimestamp } from '../services/firebase';
import { isFirebaseConfigured } from '../services/firebase';

const LOCAL_KEY = 'internai_roadmap_progress';

/**
 * Persists roadmap task completion across sessions.
 *
 * - On login: loads completed tasks from Firestore (users/{uid}.roadmapProgress)
 * - On toggle: saves immediately to Firestore + localStorage as cache
 * - Offline / unauthenticated: falls back to localStorage only
 */
export function useRoadmapProgress() {
  const { currentUser } = useAuth();
  const [completedTasks, setCompletedTasks] = useState({});
  const [loading, setLoading] = useState(true);

  // Debounce timer ref — avoids hammering Firestore on rapid clicks
  const saveTimer = useRef(null);

  // ── Load from Firestore (or localStorage fallback) on user change ──────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // Always start with localStorage cache for instant UI
      const cached = localStorage.getItem(LOCAL_KEY);
      const localData = cached ? JSON.parse(cached) : {};

      if (cancelled) return;
      setCompletedTasks(localData);

      // If authenticated and Firebase is configured, load from Firestore
      if (currentUser?.uid && isFirebaseConfigured) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          if (!cancelled && snap.exists()) {
            const firestoreProgress = snap.data()?.roadmapProgress || {};
            // Merge: Firestore is source of truth, local is fallback
            const merged = { ...localData, ...firestoreProgress };
            setCompletedTasks(merged);
            localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
          }
        } catch (err) {
          console.warn('[useRoadmapProgress] Firestore load error — using local cache:', err.message);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [currentUser?.uid]);

  // ── Save to Firestore + localStorage (debounced 800ms) ────────────────────
  const persistProgress = useCallback((tasks) => {
    // Always persist to localStorage immediately
    localStorage.setItem(LOCAL_KEY, JSON.stringify(tasks));

    // Debounce Firestore write
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!currentUser?.uid || !isFirebaseConfigured) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          roadmapProgress: tasks,
          roadmapUpdatedAt: serverTimestamp(),
        });
      } catch (err) {
        // If doc doesn't exist yet, create it
        if (err.code === 'not-found') {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, { roadmapProgress: tasks, roadmapUpdatedAt: serverTimestamp() }, { merge: true });
          } catch (e) {
            console.warn('[useRoadmapProgress] Firestore write error:', e.message);
          }
        } else {
          console.warn('[useRoadmapProgress] Firestore update error:', err.message);
        }
      }
    }, 800);
  }, [currentUser?.uid]);

  // ── Toggle a single task ──────────────────────────────────────────────────
  const toggleTask = useCallback((trackKey, weekNum, taskIdx) => {
    const key = `${trackKey}-w${weekNum}-t${taskIdx}`;
    setCompletedTasks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      persistProgress(updated);
      return updated;
    });
  }, [persistProgress]);

  const isTaskDone = useCallback((trackKey, weekNum, taskIdx) => {
    return !!completedTasks[`${trackKey}-w${weekNum}-t${taskIdx}`];
  }, [completedTasks]);

  // Cleanup debounce timer on unmount
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return { completedTasks, toggleTask, isTaskDone, loading };
}
