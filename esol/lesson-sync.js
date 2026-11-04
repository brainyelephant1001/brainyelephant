// This module only syncs self-reported lesson-completion practice data.
// It deliberately does NOT write test scores, certificates or subscriptions.
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.118.0";
import {ESOL_SUPABASE_URL,ESOL_SUPABASE_PUBLISHABLE_KEY} from "./supabase-config.js";
const client=createClient(ESOL_SUPABASE_URL,ESOL_SUPABASE_PUBLISHABLE_KEY);
export async function syncEsollessons(level,completed){
 if(![2,3,4,5].includes(level)||!Array.isArray(completed))return;
 const {data:{user}}=await client.auth.getUser();if(!user)return;
 const ids=[...new Set(completed.map(String).filter(id=>/^[1-9][0-9]{0,2}$/.test(id)))];
 if(!ids.length)return;
 const rows=ids.map(lesson_id=>({user_id:user.id,level_number:level,lesson_id}));
 const {error}=await client.from("be_esol_progress").upsert(rows,{onConflict:"user_id,level_number,lesson_id",ignoreDuplicates:true});
 if(error)console.warn("ESOL progress sync unavailable",error.message);
}
