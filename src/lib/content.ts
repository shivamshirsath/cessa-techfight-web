// src/lib/content.ts
import { collection, addDoc, doc, deleteDoc, getDocs, query, orderBy, updateDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { SocialPost, TeamMember } from "@/types";

// Helper for ImgBB (reused from events.ts logic)
const uploadToImgBB = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const uploadUrl = `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`;
  const res = await fetch(uploadUrl, { method: "POST", body: formData });
  const data = await res.json();
  if (!data.success) throw new Error("Failed to upload image.");
  return data.data.url;
};

// ==========================================
// SOCIAL MEDIA GALLERY LOGIC
// ==========================================

export const addSocialPost = async (embedHtml: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Unauthorized");

    // Clean up the embed HTML if the user pasted the full script tag too
    // We only really want the blockquote or iframe part for safety, 
    // but for simplicity, we'll store what they give us and render it carefully.
    
    const postData = {
      embedHtml,
      createdBy: currentUser.uid,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, "social_posts"), postData);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getSocialPosts = async () => {
  try {
    const q = query(collection(db, "social_posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const posts: SocialPost[] = [];
    snap.forEach(doc => { posts.push({ id: doc.id, ...doc.data() } as SocialPost); });
    return { success: true, posts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteSocialPost = async (id: string) => {
  try {
    await deleteDoc(doc(db, "social_posts", id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ==========================================
// CESA TEAM LOGIC
// ==========================================

export const addTeamMember = async (name: string, role: string, imageFile: File, displayOrder: number) => {
  try {
    const imageUrl = await uploadToImgBB(imageFile);
    
    const memberData = {
      name,
      role,
      imageUrl,
      displayOrder,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, "team_members"), memberData);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getTeamMembers = async () => {
  try {
    const q = query(collection(db, "team_members"), orderBy("displayOrder", "asc"));
    const snap = await getDocs(q);
    const members: TeamMember[] = [];
    snap.forEach(doc => { members.push({ id: doc.id, ...doc.data() } as TeamMember); });
    return { success: true, members };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteTeamMember = async (id: string) => {
  try {
    await deleteDoc(doc(db, "team_members", id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ==========================================
// SPONSORS LOGIC
// ==========================================

export const addSponsor = async (name: string, category: string, type: string, logoFile: File, displayOrder: number) => {
  try {
    const logoUrl = await uploadToImgBB(logoFile);
    const sponsorData = {
      name,
      category,
      type,
      logoUrl,
      displayOrder,
      createdAt: Date.now()
    };
    const docRef = await addDoc(collection(db, "sponsors"), sponsorData);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getSponsors = async () => {
  try {
    const q = query(collection(db, "sponsors"), orderBy("displayOrder", "asc"));
    const snap = await getDocs(q);
    const sponsors: any[] = [];
    snap.forEach(doc => { sponsors.push({ id: doc.id, ...doc.data() }); });
    return { success: true, sponsors };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteSponsor = async (id: string) => {
  try {
    await deleteDoc(doc(db, "sponsors", id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};