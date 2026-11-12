
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc8df);
scene.fog = new THREE.Fog(0x9bc8df, 400, 2200);

const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, .1, 5000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x64745b,2));
const sun = new THREE.DirectionalLight(0xffffff,2);
sun.position.set(300,500,200);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000,5000),
  new THREE.MeshStandardMaterial({color:0x6b9a65})
);
ground.rotation.x=-Math.PI/2;
ground.position.y=-.12;
ground.receiveShadow=true;
scene.add(ground);

const world = new THREE.Group();
scene.add(world);

const center = {lat:52.0799,lon:4.3113}; // Den Haag centrum
const metersLon = 111320*Math.cos(center.lat*Math.PI/180);
const toLocal = p => ({
  x:(p.lon-center.lon)*metersLon,
  z:-(p.lat-center.lat)*111320
});

function makeBox(parent,x,y,z,w,h,d,color){
  const m=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color})
  );
  m.position.set(x,y,z);
  m.castShadow=true;
  m.receiveShadow=true;
  parent.add(m);
  return m;
}

// Auto
const car=new THREE.Group();
scene.add(car);
makeBox(car,0,1,0,2.15,.75,4.4,0xc51d27);
makeBox(car,0,1.7,-.25,1.75,.75,2.1,0x34546a);
const wheels=[];
for(const x of [-1.12,1.12]) for(const z of [-1.45,1.45]){
  const w=new THREE.Mesh(
    new THREE.CylinderGeometry(.42,.42,.28,20),
    new THREE.MeshStandardMaterial({color:0x151515})
  );
  w.rotation.z=Math.PI/2;
  w.position.set(x,.45,z);
  car.add(w); wheels.push(w);
}
car.position.set(0,0,0);

let speed=0, fuel=100, money=2500, heading=0, cameraMode=0;
let activeJob="Burger", delivery=null, destination=null;
const keys={};
addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key.toLowerCase()==="m") togglePhone();
  if(e.key.toLowerCase()==="c") cameraMode=1-cameraMode;
  if(e.key.toLowerCase()==="r") resetCar();
});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

function resetCar(){
  car.position.set(0,0,0); heading=0; speed=0;
}
function updateCar(dt){
  const forward=keys.w||keys.arrowup;
  const reverse=keys.s||keys.arrowdown;
  const left=keys.a||keys.arrowleft;
  const right=keys.d||keys.arrowright;
  const brake=keys[" "];

  if(forward&&fuel>0) speed+=17*dt;
  if(reverse) speed+= (speed>1?-30:-10)*dt;
  speed=THREE.MathUtils.clamp(speed,-13,45);
  if(!forward&&!reverse) speed*=Math.pow(.985,dt*60);
  if(brake) speed*=Math.pow(.90,dt*60);
  if(Math.abs(speed)<.04)speed=0;

  const steer=(left?1:0)-(right?1:0);
  heading+=steer*Math.min(Math.abs(speed)/9,1)*1.5*dt*(speed>=0?1:-1);
  car.rotation.y=heading;
  car.position.x-=Math.sin(heading)*speed*dt;
  car.position.z-=Math.cos(heading)*speed*dt;

  wheels.forEach(w=>w.rotation.x+=speed*dt/.42);
  if(forward&&speed>2) fuel=Math.max(0,fuel-.0009*speed*dt);

  // Eenvoudige aankomstcontrole voor bezorgopdrachten
  if(delivery && car.position.distanceTo(delivery.position)<12){
    money+=delivery.reward;
    delivery=null;
    notify("Bezorging voltooid! Je ontvangt je salaris.");
    updatePhone();
  }
}
function updateCamera(dt){
  const offset=cameraMode===0
    ? new THREE.Vector3(0,5.5,10)
    : new THREE.Vector3(0,2.2,-.2);
  offset.applyAxisAngle(new THREE.Vector3(0,1,0),heading);
  camera.position.lerp(car.position.clone().add(offset),1-Math.pow(.001,dt));
  camera.lookAt(car.position.clone().add(new THREE.Vector3(0,1,0)));
}

// OSM-import: wegen en gebouwcontouren rond Den Haag
async function loadDenHaag(){
  notify("OpenStreetMap-gegevens voor Den Haag ophalen...");
  const query=`
    [out:json][timeout:45];
    (
      way(around:1800,${center.lat},${center.lon})["highway"];
      way(around:1800,${center.lat},${center.lon})["building"];
    );
    out body geom;
  `;
  try{
    const response=await fetch("https://overpass-api.de/api/interpreter",{
      method:"POST",body:query
    });
    if(!response.ok)throw Error("Kaartserver tijdelijk niet beschikbaar");
    const data=await response.json();

    for(const el of data.elements){
      if(!el.geometry||el.geometry.length<2)continue;
      const pts=el.geometry.map(toLocal);
      if(el.tags?.highway){
        const roadWidth=["motorway","trunk","primary"].includes(el.tags.highway)?10:6;
        for(let i=0;i<pts.length-1;i++){
          const a=pts[i],b=pts[i+1];
          const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
          if(len<1)continue;
          const road=makeBox(world,(a.x+b.x)/2,.02,(a.z+b.z)/2,
            roadWidth,.12,len,0x3b4146);
          road.rotation.y=Math.atan2(dx,dz);
        }
      }else if(el.tags?.building){
        const xs=pts.map(p=>p.x),zs=pts.map(p=>p.z);
        const minX=Math.min(...xs),maxX=Math.max(...xs);
        const minZ=Math.min(...zs),maxZ=Math.max(...zs);
        const w=maxX-minX,d=maxZ-minZ;
        if(w<3||d<3||w>120||d>120)continue;
        const height=Number(el.tags["height"]?.replace(" m",""))||
          (Number(el.tags["building:levels"]||3)*3.2);
        makeBox(world,(minX+maxX)/2,height/2,(minZ+maxZ)/2,
          w,height,d,0xc8b69e);
      }
    }
    notify("Den Haag kaart geladen. Veel rijplezier!");
  }catch(err){
    console.error(err);
    notify("Kaartimport niet gelukt. Probeer later opnieuw.");
  }
}

// Telefoon en bedrijven
const companies=[
  ["DHL","Pakketbezorger",180],
  ["PostNL","Postbezorger",160],
  ["Albert Heijn","Boodschappenbezorger",150],
  ["Jumbo","Boodschappenbezorger",150],
  ["Lidl","Winkelbevoorrading",220],
  ["Aldi","Winkelbevoorrading",220],
  ["Shell","Tankstationmedewerker",130],
  ["Express","Expresskoerier",250]
];

const $=s=>document.querySelector(s);
const phone=$("#phone");
function togglePhone(){
  phone.style.display=phone.style.display==="block"?"none":"block";
  updatePhone();
}
$("#phoneButton").onclick=togglePhone;
$("#closePhone").onclick=togglePhone;

document.querySelectorAll("[data-tab]").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    $("#"+btn.dataset.tab).classList.add("active");
  };
});

function notify(message){$("#notice").textContent=message;}
function updatePhone(){
  $("#money").textContent=money;
  $("#phoneMoney").textContent=money;
  $("#fuel").textContent=Math.floor(fuel);
  $("#phoneFuel").textContent=Math.floor(fuel);
  $("#jobName").textContent=activeJob;
}
companies.forEach(([name,role,reward])=>{
  const item=document.createElement("div");
  item.className="job";
  const title=document.createElement("b");
  title.textContent=name+" – "+role;
  const btn=document.createElement("button");
  btn.textContent="Solliciteer";
  btn.onclick=()=>{
    activeJob=name+" "+role;
    $("#jobName").textContent=activeJob;
    notify("Je werkt nu voor "+name+". Nieuwe opdracht gestart.");
    startDelivery(name,reward);
    updatePhone();
  };
  item.append(title,btn);
  $("#jobList").append(item);
});

function startDelivery(company,reward){
  // Tijdelijke voorbeeldbestemming in de speelwereld.
  const angle=Math.random()*Math.PI*2;
  const distance=250+Math.random()*450;
  const position=new THREE.Vector3(
    car.position.x+Math.cos(angle)*distance,0,
    car.position.z+Math.sin(angle)*distance
  );
  delivery={position,reward};
  destination=position;
  makeBox(world,position.x,1.5,position.z,4,3,4,0xffcc33);
  notify(company+": rij naar de gele bezorgmarker. Beloning €"+reward);
  $("#routeInfo").textContent="Bezorgmarker actief. Rijd naar de gele marker.";
}

// Contacten lokaal opslaan
let contacts=JSON.parse(localStorage.getItem("oranjeContacts")||"[]");
function renderContacts(){
  $("#contactList").replaceChildren();
  contacts.forEach(c=>{
    const p=document.createElement("p");
    p.textContent=c.name+" – "+c.number;
    $("#contactList").append(p);
  });
}
$("#addContact").onclick=()=>{
  const name=$("#contactName").value.trim();
  const number=$("#contactNumber").value.trim();
  if(!name||!number)return notify("Vul een naam en in-game nummer in.");
  contacts.push({name,number});
  localStorage.setItem("oranjeContacts",JSON.stringify(contacts));
  renderContacts();
  notify("Contact lokaal opgeslagen.");
};

// Berichten zijn lokaal totdat een multiplayer-server gekoppeld is.
let messages=JSON.parse(localStorage.getItem("oranjeMessages")||"[]");
function renderMessages(){
  $("#messageList").replaceChildren();
  messages.slice(-20).forEach(m=>{
    const p=document.createElement("p");
    p.textContent="Aan "+m.to+": "+m.text;
    $("#messageList").append(p);
  });
}
$("#sendMessage").onclick=()=>{
  const to=$("#messageTo").value.trim();
  const text=$("#messageText").value.trim();
  if(!to||!text)return notify("Vul ontvanger en bericht in.");
  messages.push({to,text});
  localStorage.setItem("oranjeMessages",JSON.stringify(messages));
  renderMessages();
  $("#messageText").value="";
  notify("Bericht lokaal opgeslagen. Online versturen vereist de multiplayer-server.");
};

// Bestemming zoeken met Nominatim
$("#navigate").onclick=async()=>{
  const q=$("#destination").value.trim();
  if(!q)return;
  try{
    const url="https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+
      encodeURIComponent(q+", Nederland");
    const response=await fetch(url);
    const results=await response.json();
    if(!results.length)return notify("Bestemming niet gevonden.");
    const p=toLocal({lat:Number(results[0].lat),lon:Number(results[0].lon)});
    destination=new THREE.Vector3(p.x,0,p.z);
    $("#routeInfo").textContent="Bestemming: "+q+
      ". De gele marker toont de richting niet over echte wegen.";
    const marker=makeBox(world,p.x,2,p.z,5,4,5,0xffd43b);
    notify("Bestemming gevonden: "+q);
  }catch(e){notify("Navigatie tijdelijk niet beschikbaar.");}
};

renderContacts();
renderMessages();
updatePhone();
await loadDenHaag();

let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,.04);
  last=now;
  updateCar(dt);
  updateCamera(dt);
  $("#speed").textContent=Math.round(Math.abs(speed)*3.6);
  $("#gear").textContent=speed<-.5?"R":speed>.5?"D":"N";
  updatePhone();
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
camera.position.set(0,6,12);
