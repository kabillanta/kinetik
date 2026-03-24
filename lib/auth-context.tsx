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
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for logout
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetchDone, setProfileFetchDone] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (uid: string) => {
    setProfileFetchDone(false);
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
          bio: "",
          location: "",
          onboardingCompleted: true, // In Neo4j = already onboarded
        } as UserProfile;

        setUserProfile(profile);
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
            setUserProfile(profile);
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
      // Other HTTP errors (500, 503, etc.) — backend problem, don't redirect
      setProfileFetchDone(false);
      return null;
    } catch (e) {
      console.error("Error fetching profile", e);
      // Even if Firestore fails, we MUST tell the rest of the app we tried, otherwise it spins infinitely.
      setProfileFetchDone(true);
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
        setUserProfile(null);
        setProfileFetchDone(false);
      }

      setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Onboarding redirect — only fires when we KNOW the profile status
  useEffect(() => {
    if (loading || !user || !profileFetchDone) return;

    const needsOnboarding = !userProfile || !userProfile.onboardingCompleted;

    if (needsOnboarding && !pathname.includes("onboarding")) {
      router.push("/onboarding");
    }
  }, [userProfile, pathname, loading, user, router, profileFetchDone]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Successful login automatically triggers the useEffect above
      router.push("/dashboard");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
