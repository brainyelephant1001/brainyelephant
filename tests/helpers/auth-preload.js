// Test-only Auth transport; never sends email or creates an account.
'use strict';
global.fetch=async(url,options={})=>{const u=new URL(url);if(u.origin!=='https://lovvxmlcpsbvmlxezora.supabase.co')throw Error('Unexpected Auth origin');const body=JSON.parse(options.body||'{}');
if(u.pathname==='/auth/v1/recover')return {ok:body.email!=='failure@example.invalid',json:async()=>({})};
if(u.pathname==='/auth/v1/signup')return {ok:true,json:async()=>({})};
if(u.pathname==='/auth/v1/token')return body.email==='owner@example.invalid'?{ok:true,json:async()=>({access_token:'fixture-owner-auth',refresh_token:'fixture-refresh'})}:{ok:false,json:async()=>({error:'invalid_credentials'})};
if(u.pathname==='/auth/v1/user'){const token=options.headers.Authorization;return {ok:true,json:async()=>({id:'fixture-user',email:token==='Bearer fixture-owner-auth'?'owner@example.invalid':'other@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z'})};}
throw Error('Unexpected Auth endpoint');};
