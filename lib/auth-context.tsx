"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
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
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for logout
  refreshProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsTransitioning: (status: boolean) => void;
  isTransitioning: boolean;
  profileError: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetchDone, setProfileFetchDone] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (uid: string) => {
    // If we're transitioning (just finished onboarding), don't let 
    // a background fetch revert our optimistic state.
    if (isTransitioning) return userProfile;
    
    setProfileFetchDone(false);
    setProfileError(null);
    try {
      const token = await auth.currentUser?.getIdToken();

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
          onboardingCompleted: data.onboarding_completed ?? true, // Respect backend flag
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
          if (data.onboardingCompleted) {
            const profile = {
              uid,
              email: data.email,
              displayName: data.displayName,
              role: data.role,
              bio: data.bio || "",
              location: data.location || "",
              skills: data.skills || [],
              onboardingCompleted: true,
            } as UserProfile;
            setUserProfileState(profile);
            if (data.role) {
              localStorage.setItem("kinetik_user_role", data.role);
            }
            setProfileFetchDone(true);
            return profile;
          }
        }
        // User not in Neo4j AND not in Firestore (or not onboarded) — genuinely new
        setProfileFetchDone(true);
        return null;
      }
      
      // Other HTTP errors (500, 503, 403, 401 etc.) — backend problem, don't redirect
      console.warn(`Backend fetch failed with status ${res.status}`);
      setProfileError(`Backend error: ${res.status}`);
      setProfileFetchDone(false); // We are NOT done if there was an error
      return null;
    } catch (e) {
      console.error("Error fetching profile", e);
      // NETWORK ERROR / CORS BLOCK
      setProfileError("Network error or CORS block. Check backend availability.");
      setProfileFetchDone(false); // We are NOT done if there was a network error
      return null;
    }
  };

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
    // ONLY the root landing page is a "safe zone".
    // If you're on /login or /signup and you're already logged in,
    // you SHOULD be pushed to onboarding if you haven't finished it.
    const isPublicPath = pathname === "/";

    // CRITICAL: Respect isTransitioning flag to prevent loop during the final steps
    // ALSO CRITICAL: Don't redirect if we had a profile error (network/CORS/500)
    if (loading || !user || !profileFetchDone || isTransitioning || isPublicPath || profileError) return;

    const needsOnboarding = !userProfile || !userProfile.onboardingCompleted;

    if (needsOnboarding && !pathname.includes("onboarding")) {
      router.push("/onboarding");
    }
  }, [userProfile, pathname, loading, user, router, profileFetchDone, isTransitioning]);

  const setUserProfile = (profile: UserProfile | null) => {
    setUserProfileState(profile);
    setProfileFetchDone(true);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error("Error signing in", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out", error);
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
