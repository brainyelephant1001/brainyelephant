// Brainy Elephant ESOL learner progress sync for the five-level master course.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.118.0";
import {ESOL_SUPABASE_URL,ESOL_SUPABASE_PUBLISHABLE_KEY} from "./supabase-config.js";
const client=createClient(ESOL_SUPABASE_URL,ESOL_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function getEsolUser(){const {data:{user}}=await client.auth.getUser();return user||null}
export async function getEsolProgress(level){
 if(![1,2,3,4,5].includes(level))return [];
 const user=await getEsolUser();if(!user)return [];
 const {data,error}=await client.from("be_esol_progress").select("lesson_id,completed_at").eq("user_id",user.id).eq("level_number",level);
 if(error){console.warn("ESOL progress load unavailable",error.message);return []}
 return data||[];
}
export async function completeEsolLesson(level,lessonId){
 if(![1,2,3,4,5].includes(level))throw new Error("Invalid ESOL level.");
 const id=String(lessonId||"").trim();
 if(!id||id.length>64)throw new Error("Invalid lesson ID.");
 const user=await getEsolUser();if(!user)throw new Error("Please sign in to save your progress.");
 const {error}=await client.from("be_esol_progress").upsert({user_id:user.id,level_number:level,lesson_id:id},{onConflict:"user_id,level_number,lesson_id",ignoreDuplicates:true});
 if(error)throw error;return true;
}
