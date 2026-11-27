import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../push-worker/src/index.js';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const pkcs8=await crypto.subtle.exportKey('pkcs8',pair.privateKey);
const pem=`-----BEGIN PRIVATE KEY-----\n${Buffer.from(pkcs8).toString('base64')}\n-----END PRIVATE KEY-----`;
const env={GOOGLE_PROJECT_ID:'demo',GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify({project_id:'demo',client_email:'test@example.test',private_key:pem})};
function fixture(expoOk=true) {
  let state='pending', version=1, sent=0;
  const name='projects/demo/databases/(default)/documents/users/customer/notifications/notice';
  const doc=()=>({name,updateTime:`2026-01-01T00:00:0${version}.000Z`,fields:{pushState:{stringValue:state},title:{stringValue:'Mottatt'},orderId:{stringValue:'order'}}});
  const fn=async (input,options={})=>{const u=String(input);
    if(u.includes('oauth2.googleapis.com'))return Response.json({access_token:'token'});
    if(u.includes(':runQuery')){const q=JSON.parse(options.body);return Response.json(q.structuredQuery.where.fieldFilter.value.stringValue===state?[{document:doc()}]:[]);}
    if(u.includes('/pushTokens'))return Response.json({documents:[{fields:{token:{stringValue:'ExpoPushToken[test]'}}}]});
    if(u.includes('exp.host')){sent++;return expoOk?Response.json({data:[{status:'ok'}]}):new Response('',{status:503});}
    if(options.method==='PATCH'){const v=JSON.parse(options.body).fields.pushState.stringValue;state=v;version++;return Response.json(doc());}
    throw Error(`Unexpected ${u}`);
  };return {fn,get state(){return state;},get sent(){return sent;}};
}
async function run(f){const original=globalThis.fetch;globalThis.fetch=f.fn;let task;try{await worker.scheduled({},env,{waitUntil:p=>{task=p;}});await task;}finally{globalThis.fetch=original;}}
test('pending push is sent and marked sent',async()=>{const f=fixture();await run(f);assert.equal(f.sent,1);assert.equal(f.state,'sent');});
test('failed push returns to pending for retry',async()=>{const f=fixture(false);await run(f);assert.equal(f.state,'pending');});
