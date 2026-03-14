// src/lib/finance.ts
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { RegistrationStatus } from "@/types";

// 1. Fetch ALL Registrations
export const getAllRegistrations = async () => {
  try {
    const snap = await getDocs(collection(db, "registrations"));
    const regs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, registrations: regs as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 2. Approve or Reject a Registration
export const updateRegistrationStatus = async (regId: string, status: RegistrationStatus) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("You must be logged in to review payments.");

    const regRef = doc(db, "registrations", regId);
    await updateDoc(regRef, {
      status,
      reviewedBy: currentUser.uid,
      reviewedAt: Date.now()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};