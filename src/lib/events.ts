// src/lib/events.ts
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase";

// Helper function to upload images to ImgBB (Unlimited & Free)
const uploadToImgBB = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const uploadUrl = `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`;
  const res = await fetch(uploadUrl, { method: "POST", body: formData });
  const data = await res.json();
  if (!data.success) throw new Error("Failed to upload image.");
  return data.data.url;
};

// 1. CREATE EVENT
export const createNewEvent = async (
  title: string, description: string, fee: number, posterFile: File,
  eventType: 'SINGLE' | 'TEAM', teamSize: number, 
  coordinatorName: string, coordinatorContact: string,
  staffCoordinatorName: string, staffCoordinatorContact: string,
  paymentQrFile: File, upiId: string, bankDetails: string
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("You must be logged in.");

    const posterUrl = await uploadToImgBB(posterFile);
    const paymentQrUrl = await uploadToImgBB(paymentQrFile);

    const eventData = {
      title, description, registrationFee: fee, posterUrl,
      eventType, teamSize: eventType === 'SINGLE' ? 1 : teamSize,
      coordinatorName, coordinatorContact, 
      staffCoordinatorName, staffCoordinatorContact,
      paymentQrUrl, upiId, bankDetails,
      createdBy: currentUser.uid, isActive: true, createdAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, "events"), eventData);
    return { success: true, eventId: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 2. GET EVENT BY ID
export const getEventById = async (eventId: string) => {
  try {
    const docRef = doc(db, "events", eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { success: true, event: { id: docSnap.id, ...docSnap.data() } };
    return { success: false, error: "Event not found" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 3. UPDATE EVENT
export const updateEvent = async (
  eventId: string, title: string, description: string, fee: number, 
  newPosterFile: File | null, existingPosterUrl: string,
  eventType: 'SINGLE' | 'TEAM', teamSize: number, 
  coordinatorName: string, coordinatorContact: string,
  staffCoordinatorName: string, staffCoordinatorContact: string,
  newQrFile: File | null, existingQrUrl: string, upiId: string, bankDetails: string
) => {
  try {
    let posterUrl = existingPosterUrl;
    let paymentQrUrl = existingQrUrl;

    if (newPosterFile) posterUrl = await uploadToImgBB(newPosterFile);
    if (newQrFile) paymentQrUrl = await uploadToImgBB(newQrFile);

    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      title, description, registrationFee: fee, posterUrl,
      eventType, teamSize: eventType === 'SINGLE' ? 1 : teamSize,
      coordinatorName, coordinatorContact, 
      staffCoordinatorName, staffCoordinatorContact,
      paymentQrUrl, upiId, bankDetails
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 4. DELETE EVENT
export const deleteEvent = async (eventId: string) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await deleteDoc(eventRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 5. SUBMIT STUDENT REGISTRATION
export const submitRegistration = async (
  eventId: string,
  userId: string,
  utrNumber: string,
  teamDetails: { name: string; phone: string }[] | null,
  collegeName: string // <--- NEW PARAMETER ADDED
) => {
  try {
    const regData = {
      eventId,
      userId,
      utrNumber,
      college: collegeName, // <--- SAVES COLLEGE TO DATABASE
      status: 'UNDER_REVIEW', // Goes straight to the Treasurer!
      submittedAt: Date.now(),
      ...(teamDetails && { teamDetails }) // Saves team members if it's a team event
    };

    const docRef = await addDoc(collection(db, "registrations"), regData);
    return { success: true, registrationId: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 6. CHECK EXISTING REGISTRATION STATUS
export const getUserRegistrationForEvent = async (eventId: string, userId: string) => {
  try {
    const q = query(
      collection(db, "registrations"),
      where("eventId", "==", eventId),
      where("userId", "==", userId)
    );
    
    const snap = await getDocs(q);
    if (snap.empty) return { success: true, registration: null };

    // If they have multiple attempts (e.g., rejected then reapplied), get the newest one
    const regs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    regs.sort((a, b) => b.submittedAt - a.submittedAt);

    return { success: true, registration: regs[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}; 

// 7. GET ALL REGISTRATIONS FOR A SPECIFIC USER (For Student Dashboard)
export const getUserRegistrations = async (userId: string) => {
  try {
    const q = query(collection(db, "registrations"), where("userId", "==", userId));
    const snap = await getDocs(q);
    
    const registrations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    // Sort by newest first
    registrations.sort((a, b) => b.submittedAt - a.submittedAt);
    
    return { success: true, registrations };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};