// src/lib/auth.ts
import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, UserRole } from "@/types";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

// 1. REGISTER A NEW USER
export const registerUser = async (email: string, password: string, fullName: string) => {
  try {
    // Step A: Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step B: Define the initial profile. 
    // By default, everyone registers as a 'USER'. 
    // Admins will manually upgrade specific people to 'ADMIN' or 'TREASURER' later.
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      fullName: fullName,
      role: 'USER', 
      createdAt: Date.now(),
    };

    // Step C: Save this profile to the Firestore 'users' collection
    // We use the user's UID as the document ID for easy lookup
    await setDoc(doc(db, "users", user.uid), userProfile);

    return { success: true, user: userProfile };
  } catch (error: any) {
    console.error("Error registering user:", error.message);
    return { success: false, error: error.message };
  }
};

// 2. LOG IN AN EXISTING USER
export const loginUser = async (email: string, password: string) => {
  try {
    // Step A: Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step B: Fetch their full profile (including their role) from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const profileData = userDocSnap.data() as UserProfile;
      return { success: true, user: profileData };
    } else {
      throw new Error("User profile not found in database.");
    }
  } catch (error: any) {
    console.error("Error logging in:", error.message);
    return { success: false, error: error.message };
  }
};

// 3. LOG OUT
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Error logging out:", error.message);
    return { success: false, error: error.message };
  }
};

// Add these imports at the very top of src/lib/auth.ts if they aren't there:
// import { collection, getDocs, updateDoc } from "firebase/firestore";

// 4. GET ALL USERS (For Admin Panel)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    // Sort so admins/coordinators appear at the top
    return { success: true, users: users.sort((a, b) => a.role.localeCompare(b.role)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 5. UPDATE USER ROLE & ASSIGN EVENT
export const updateUserRole = async (uid: string, newRole: UserRole, assignedEventId: string | null = null) => {
  try {
    const userRef = doc(db, "users", uid);
    
    // If they are downgraded from coordinator, remove the event ID
    const updateData: any = { role: newRole };
    if (newRole === 'COORDINATOR' && assignedEventId) {
      updateData.assignedEventId = assignedEventId;
    } else {
      updateData.assignedEventId = null; 
    }

    await updateDoc(userRef, updateData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Add this if it's missing at the top of your auth.ts imports:
// import { setDoc } from "firebase/firestore";

// 6. SILENTLY CREATE USER (Prevents Admin from being logged out)
// 6. SILENTLY CREATE USER (Prevents Admin from being logged out)
// 6. SILENTLY CREATE USER (Using Secondary App to bypass browser blocking)
export const adminCreateUser = async (email: string, password: string, fullName: string, role: UserRole, assignedEventId?: string) => {
  try {
    // 1. Grab your exact config from your environment variables
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // 2. Initialize an invisible "Secondary" Firebase app just for creating this user
    // We check getApps() so we don't accidentally create it twice and crash
    const apps = getApps();
    const secondaryApp = apps.find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    // 3. Create the user securely using the official SDK!
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = userCredential.user.uid;

    // 4. Instantly log out of the secondary app so it doesn't mess with the Admin's session
    await signOut(secondaryAuth);

    // 5. Save the profile to your Database
    const userProfile: UserProfile = {
      uid: newUid, 
      email, 
      fullName, 
      role, 
      createdAt: Date.now(),
      ...(assignedEventId && { assignedEventId })
    };

    await setDoc(doc(db, "users", newUid), userProfile);
    return { success: true, user: userProfile };
    
  } catch (error: any) {
    console.error("Creation Error:", error);
    return { success: false, error: error.message }; 
  }
};

// 7. EDIT USER DETAILS
export const updateUserDetails = async (uid: string, fullName: string, role: UserRole, assignedEventId: string | null) => {
  try {
    const userRef = doc(db, "users", uid);
    const updateData: any = { fullName, role };
    
    if (role === 'COORDINATOR' && assignedEventId) {
      updateData.assignedEventId = assignedEventId;
    } else {
      updateData.assignedEventId = null;
    }
    
    await updateDoc(userRef, updateData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
// 8. STANDARD USER REGISTRATION (For public /register page)
export const registerStandardUser = async (email: string, password: string, fullName: string) => {
  try {
    const authInstance = getAuth();
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    const newUid = userCredential.user.uid;

    // Save profile with 'USER' role
    const userProfile: UserProfile = {
      uid: newUid,
      email,
      fullName,
      role: 'USER',
      createdAt: Date.now(),
    };

    await setDoc(doc(db, "users", newUid), userProfile);
    return { success: true, user: userProfile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};