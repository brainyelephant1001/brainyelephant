// Test-only Auth transport; never sends email or creates an account.
'use strict';
global.fetch=async(url,options={})=>{const u=new URL(url);if(u.origin!=='https://lovvxmlcpsbvmlxezora.supabase.co')throw Error('Unexpected Auth origin');const body=JSON.parse(options.body||'{}');
if(u.pathname==='/auth/v1/recover')return {ok:body.email!=='failure@example.invalid',json:async()=>({})};
if(u.pathname==='/auth/v1/signup')return {ok:true,json:async()=>({})};
if(u.pathname==='/auth/v1/token')return {ok:false,json:async()=>({error:'invalid_credentials'})};
throw Error('Unexpected Auth endpoint');};
