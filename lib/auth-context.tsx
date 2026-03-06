"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
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
  bio: string;
  location: string;
  skills: string[];
  imageUrl?: string;
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
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
        return profile;
      }
      return null;
    } catch (e) {
      console.error("Error fetching profile", e);
      return null;
    }
  };

  useEffect(() => {
    // Listen for state changes (login/logout)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch or wait for profile creation
        const profile = await fetchProfile(currentUser.uid);
        if (
          profile &&
          !profile.onboardingCompleted &&
          !pathname.includes("onboarding")
        ) {
          router.push("/onboarding");
        } else if (!profile && !pathname.includes("onboarding")) {
          // If they don't even have a document yet
          router.push("/onboarding");
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [pathname, router]);

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
