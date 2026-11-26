// Runs on Cloudflare's free Workers plan. No public HTTP endpoint is exposed.
const b64 = value => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const encoded = text => b64(new TextEncoder().encode(text));
async function accessToken(env) {
  const account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (account.project_id !== env.GOOGLE_PROJECT_ID) throw Error('Service account project mismatch');
  const now = Math.floor(Date.now()/1000);
  const payload = `${encoded(JSON.stringify({alg:'RS256',typ:'JWT'}))}.${encoded(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3300}))}`;
  const raw = Uint8Array.from(atob(account.private_key.replace(/-----[^-]+-----/g,'').replace(/\s/g,'')), c=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8',raw,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(payload));
  const response = await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${payload}.${b64(signature)}`})});
  if (!response.ok) throw Error(`Google authentication failed (${response.status})`);
  return (await response.json()).access_token;
}
const url = env => `https://firestore.googleapis.com/v1/projects/${env.GOOGLE_PROJECT_ID}/databases/(default)/documents`;
async function call(url, token, options={}) {
  const res=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(options.headers||{})}});
  if(!res.ok) throw Error(`Firestore request failed (${res.status})`);
  return res.json();
}
async function queryState(env,token,state) {
  const rows=await call(`${url(env)}:runQuery`,token,{method:'POST',body:JSON.stringify({structuredQuery:{from:[{collectionId:'notifications',allDescendants:true}],where:{fieldFilter:{field:{fieldPath:'pushState'},op:'EQUAL',value:{stringValue:state}}},limit:100}})});
  return rows.filter(row=>row.document).map(row=>row.document);
}
async function setState(env,token,document,state) {
  const relative=document.name.split('/documents/')[1];
  const params=new URLSearchParams({'updateMask.fieldPaths':'pushState','currentDocument.updateTime':document.updateTime});
  return call(`${url(env)}/${relative}?${params}`,token,{method:'PATCH',body:JSON.stringify({fields:{pushState:{stringValue:state}}})});
}
async function deliver(env,token,document) {
  // Compare-and-set prevents concurrent cron runs from claiming the same notice.
  let claimed; try { claimed=await setState(env,token,document,'sending'); } catch { return; }
  const relative=claimed.name.split('/documents/')[1]; const parts=relative.split('/');
  if(parts.length!==4 || parts[0]!=='users' || parts[2]!=='notifications') throw Error('Invalid notification path');
  try {
    const page=await call(`${url(env)}/users/${parts[1]}/pushTokens?pageSize=100`,token);
    const data=claimed.fields; const messages=(page.documents||[]).map(d=>d.fields?.token?.stringValue).filter(t=>/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(t||'')).map(to=>({to,title:data.title?.stringValue||'Bestilling',body:'Åpne appen for å se bestillingen.',data:{orderId:data.orderId?.stringValue},sound:'default'}));
    if(messages.length){const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(messages)});if(!response.ok)throw Error(`Expo rejected request (${response.status})`);const body=await response.json();if(!Array.isArray(body.data))throw Error('Invalid Expo response');for(const ticket of body.data)if(ticket.status==='error')console.error('Expo ticket error',ticket.details?.error||ticket.message);}
    await setState(env,token,claimed,'sent');
  } catch(error) { console.error('Notification delivery failed',error.message); try {await setState(env,token,claimed,'pending');} catch {} }
}
export default { async scheduled(_event,env,ctx) { ctx.waitUntil((async()=>{const token=await accessToken(env);const stale=await queryState(env,token,'sending');for(const doc of stale)if(Date.now()-Date.parse(doc.updateTime)>120000){try{await setState(env,token,doc,'pending');}catch{}}const pending=await queryState(env,token,'pending');for(const doc of pending)await deliver(env,token,doc);})()); } };
