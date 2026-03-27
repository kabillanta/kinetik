"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/api-config";
import {
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "volunteer" | "organizer" | null;
  headline?: string;
  bio: string;
  location: string;
  skills: string[];
  imageUrl?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  availability?: string;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileFetchDone: boolean;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsTransitioning: (status: boolean) => void;
  isTransitioning: boolean;
  profileError: string | null;
}

// Public paths that don't require onboarding redirect
const PUBLIC_PATHS = ['/', '/login', '/signup', '/about', '/terms', '/privacy', '/support'];
const PUBLIC_PATH_PREFIXES = ['/u/']; // Public user profiles

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Max retries for profile fetch
const MAX_PROFILE_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetchDone, setProfileFetchDone] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = useCallback(async (uid: string, isRetry = false): Promise<UserProfile | null> => {
    // If we're transitioning (just finished onboarding), don't let 
    // a background fetch revert our optimistic state.
    if (isTransitioning) return userProfile;
    
    if (!isRetry) {
      setProfileFetchDone(false);
      setProfileError(null);
      retryCountRef.current = 0;
    }
    
    try {
      // Force token refresh to ensure we have a valid token
      const token = await auth.currentUser?.getIdToken(true);

      const res = await fetch(`${API_BASE_URL}/api/users/${uid}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const profile = {
          uid: data.uid,
          displayName: data.name,
          email: data.email,
          role: data.role,
          skills: data.skills || [],
          imageUrl: data.photo_url,
          bio: data.bio || "",
          location: data.location || "",
          onboardingCompleted: data.onboarding_completed ?? false, // Default to false - require explicit completion
        } as UserProfile;

        setUserProfileState(profile);
        if (data.role) {
          localStorage.setItem("kinetik_user_role", data.role);
        }
        setProfileFetchDone(true);
        return profile;
      } else if (res.status === 404) {
        // User not in Neo4j — check Firestore as fallback
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Return profile with whatever onboarding status exists
          const profile = {
            uid,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            bio: data.bio || "",
            location: data.location || "",
            skills: data.skills || [],
            onboardingCompleted: data.onboardingCompleted ?? false,
          } as UserProfile;
          setUserProfileState(profile);
          if (data.role) {
            localStorage.setItem("kinetik_user_role", data.role);
          }
          setProfileFetchDone(true);
          return profile;
        }
        
        // User not in Neo4j AND not in Firestore — genuinely new user
        // Create minimal Firestore doc to track this user
        const currentUser = auth.currentUser;
        const minimalProfile = {
          uid,
          email: currentUser?.email || null,
          displayName: currentUser?.displayName || null,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
        };
        
        try {
          await setDoc(doc(db, "users", uid), minimalProfile);
        } catch (firestoreErr) {
          console.warn("Failed to create minimal Firestore doc:", firestoreErr);
        }
        
        setProfileFetchDone(true);
        return null; // Return null to trigger onboarding redirect
      }
      
      // Other HTTP errors (500, 503, 403, 401 etc.) — backend problem
      // Retry for transient errors
      const isTransientError = res.status >= 500 || res.status === 408 || res.status === 429;
      
      if (isTransientError && retryCountRef.current < MAX_PROFILE_RETRIES) {
        retryCountRef.current++;
        console.warn(`Backend error ${res.status}, retrying (${retryCountRef.current}/${MAX_PROFILE_RETRIES})...`);
        setProfileError(`Connection issue. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return fetchProfile(uid, true);
      }
      
      // Max retries exceeded or non-transient error
      console.warn(`Backend fetch failed with status ${res.status}`);
      setProfileError(`Backend unavailable. Please refresh the page.`);
      // Mark as done so user isn't stuck in loading forever
      setProfileFetchDone(true);
      return null;
    } catch (e) {
      console.error("Error fetching profile:", e);
      
      // Network error - retry with backoff
      if (retryCountRef.current < MAX_PROFILE_RETRIES) {
        retryCountRef.current++;
        console.warn(`Network error, retrying (${retryCountRef.current}/${MAX_PROFILE_RETRIES})...`);
        setProfileError(`Network issue. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retryCountRef.current));
        return fetchProfile(uid, true);
      }
      
      // Max retries exceeded
      setProfileError("Unable to connect. Please check your internet and refresh.");
      // Mark as done so user isn't stuck in loading forever
      setProfileFetchDone(true);
      return null;
    }
  }, [isTransitioning, userProfile]);

  // Auth listener — runs once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setUserProfileState(null);
        setProfileFetchDone(false);
      }

      setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset transition guard when navigating away from onboarding
  useEffect(() => {
    if (isTransitioning && !pathname.includes("onboarding")) {
      setIsTransitioning(false);
    }
  }, [pathname, isTransitioning]);

  // Onboarding redirect — only fires when we KNOW the profile status
  useEffect(() => {
    // Check if current path is public (doesn't require onboarding redirect)
    if (isPublicPath(pathname)) return;

    // CRITICAL: Respect isTransitioning flag to prevent loop during the final steps
    // ALSO CRITICAL: Don't redirect if we had a profile error (network/CORS/500)
    if (loading || !user || !profileFetchDone || isTransitioning || profileError) return;

    const needsOnboarding = !userProfile || !userProfile.onboardingCompleted;

    if (needsOnboarding && !pathname.includes("onboarding")) {
      router.push("/onboarding");
    }
  }, [userProfile, pathname, loading, user, router, profileFetchDone, isTransitioning, profileError]);

  const setUserProfile = (profile: UserProfile | null) => {
    setUserProfileState(profile);
    setProfileFetchDone(true);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem("kinetik_user_role");
      localStorage.removeItem("kinetik-mode");
      await firebaseSignOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Alias for logout
  const signOut = logout;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        profileFetchDone,
        signInWithGoogle,
        logout,
        signOut,
        refreshProfile,
        setUserProfile,
        setIsTransitioning,
        isTransitioning,
        profileError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
