const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./load-typescript.cjs');
const catalog=load('../src/services/restaurantCatalog.ts');
const data=load('../src/data/fagerstrandGrill.ts');

function setup() {
 const store=new Map([['users/admin',{role:'admin'}]]);
 const state={store,uid:'admin',commits:0,failed:false};
 const ref=(...args)=>({path:args.filter((x)=>typeof x==='string').join('/')});
 const snapshot=(reference)=>({id:reference.path.split('/').pop(),exists:()=>store.has(reference.path),data:()=>store.get(reference.path)});
 const firestore={collection:ref,doc:ref,serverTimestamp:()=>123,
  getDoc:async(reference)=>snapshot(reference),
  getDocs:async(reference)=>({docs:[...store.keys()].filter((key)=>key.startsWith(reference.path+'/')&&key.split('/').length===2).map((path)=>snapshot({path}))}),
  runTransaction:async(_db,callback)=>{
   const writes=[];
   const result=await callback({get:async(reference)=>snapshot(reference),
    set:(reference,value)=>writes.push([reference.path,value,false]),update:(reference,value)=>writes.push([reference.path,value,true])});
   if(state.failed)throw new Error('offline');
   for(const [key,value,merge] of writes)store.set(key,merge?{...store.get(key),...value}:value);
   state.commits++; return result;
  }};
 const service=load('../src/services/restaurantCatalogImportService.ts',{
  'firebase/firestore':firestore,'./firebase':{db:{},auth:{get currentUser(){return state.uid?{uid:state.uid}:null;}}},
  '../data/fagerstrandGrill':data,'./restaurantCatalog':catalog,
 });
 return {...service,state};
}

test('Signalen is first, others alphabetical, with no mutation of the input',()=>{
 const original=[{name:'Mama Greek Kitchen'},{name:'JAFS'},{name:'Signalen Sjøbad'},{name:'Fagerstrand Grill'}];
 const sorted=catalog.sortRestaurants(original);
 assert.equal(sorted.map((r)=>r.name).join('|'),'Signalen Sjøbad|Fagerstrand Grill|JAFS|Mama Greek Kitchen');
 assert.equal(original[0].name,'Mama Greek Kitchen');
 assert.equal(catalog.sortRestaurants([{name:'JAFS'},{name:' SIGNALEN '}])[0].name,' SIGNALEN ');
});
test('source menu contains seven categories and all 70 priced size variants',()=>{
 const menu=data.FAGERSTRAND_GRILL_MENU;
 assert.equal(menu.categories.length,7);
 const items=menu.categories.flatMap((category)=>category.items);
 assert.equal(items.length,70);
 const price=(name)=>items.find((item)=>item.name===name)?.price;
 assert.equal(price('Biffpizza'),305);
 assert.equal(price('Hamburger – 100 g'),110);
 assert.equal(price('Hamburger – 320 g'),200);
 assert.equal(price('Kebab i pita eller rull – Stor'),140);
 assert.equal(price('Brus – 0,5 l'),53);
 assert.equal(price('Brus – 1,5 l'),85);
 assert.equal(data.FAGERSTRAND_GRILL.deliveryAreaId,'fagerstrand');
 assert.equal(data.FAGERSTRAND_GRILL.openingHours[0].open,'11:00');
 assert.equal(data.FAGERSTRAND_GRILL.openingHours[1].open,'14:00');
 assert.equal(data.FAGERSTRAND_GRILL.openingHours[3].close,'21:00');
 assert.equal(data.FAGERSTRAND_GRILL.openingHours[4].open,'11:00');
 assert.ok(items.every((item)=>Number.isInteger(item.price)&&item.price>0));
});
test('admin creates the restaurant, menu and completion marker atomically; repeating does not duplicate',async()=>{
 const app=setup();
 assert.equal((await app.ensureFagerstrandGrillCatalog()).created,true);
 assert.equal(app.state.store.get('restaurants/fagerstrand-grill').active,true);
 assert.equal([...app.state.store.keys()].filter((key)=>key.startsWith('products/')).length,70);
 assert.equal(app.state.store.get('products/menu-fagerstrand-grill-0-0').price,305);
 assert.equal(app.state.store.get('users/admin').catalogImports.fagerstrandGrill.version,1);
 const count=app.state.store.size;
 assert.equal((await app.ensureFagerstrandGrillCatalog()).created,false);
 assert.equal(app.state.store.size,count);assert.equal(app.state.commits,1);
});
test('an existing restaurant under a different ID is kept without overwriting edits',async()=>{
 const app=setup();
 const existing={name:'Fagerstrand Grill Nesodden',active:false,imageUrl:'custom',description:'Edited'};
 app.state.store.set('restaurants/existing',existing);
 const result=await app.ensureFagerstrandGrillCatalog();
 assert.equal(result.created,false);assert.equal(result.restaurantId,'existing');
 assert.equal(app.state.store.get('restaurants/existing'),existing);
 assert.equal(app.state.store.has('restaurants/fagerstrand-grill'),false);
 assert.equal([...app.state.store.keys()].filter((key)=>key.startsWith('products/')).length,0);
});
test('later deactivation or deletion is not undone on a repeated admin visit',async()=>{
 const app=setup();await app.ensureFagerstrandGrillCatalog();
 app.state.store.get('restaurants/fagerstrand-grill').active=false;
 await app.ensureFagerstrandGrillCatalog();assert.equal(app.state.store.get('restaurants/fagerstrand-grill').active,false);
 app.state.store.delete('restaurants/fagerstrand-grill');await app.ensureFagerstrandGrillCatalog();
 assert.equal(app.state.store.has('restaurants/fagerstrand-grill'),false);
});
test('manually edited orphan menu products are preserved and conflicting restaurant ownership aborts',async()=>{
 const app=setup();const product={restaurantId:'fagerstrand-grill',name:'Edited',price:321,available:false};
 app.state.store.set('products/menu-fagerstrand-grill-0-0',product);
 await app.ensureFagerstrandGrillCatalog();assert.equal(app.state.store.get('products/menu-fagerstrand-grill-0-0'),product);
 const conflict=setup();conflict.state.store.set('products/menu-fagerstrand-grill-0-0',{restaurantId:'other'});
 await assert.rejects(conflict.ensureFagerstrandGrillCatalog(),/annen restaurant/);
 assert.equal(conflict.state.store.has('restaurants/fagerstrand-grill'),false);
 assert.equal(conflict.state.store.get('users/admin').catalogImports,undefined);
});
test('failed imports leave no partial records and can be retried',async()=>{
 const app=setup();app.state.failed=true;
 await assert.rejects(app.ensureFagerstrandGrillCatalog(),/offline/);
 assert.equal(app.state.store.size,1);
 app.state.failed=false;assert.equal((await app.ensureFagerstrandGrillCatalog()).created,true);
});
test('anonymous users and customers cannot run the import',async()=>{
 const app=setup();app.state.uid=null;
 await assert.rejects(app.ensureFagerstrandGrillCatalog(),/Logg inn/);
 app.state.uid='customer';app.state.store.set('users/customer',{role:'customer'});
 await assert.rejects(app.ensureFagerstrandGrillCatalog(),/admintilgang/);
 assert.equal(app.state.store.has('restaurants/fagerstrand-grill'),false);
});
