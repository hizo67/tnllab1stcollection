import * as THREE from 'https://esm.sh/three@0.160.1';
import { MindARThree } from 'https://esm.sh/mind-ar@1.2.5/dist/mindar-image-three.prod.js?external=three';

const $=id=>document.getElementById(id);
const cover=$('cover'),hud=$('hud'),status=$('status'),reticle=$('reticle'),rec=$('record');
let mind,anchor,renderer,scene,camera,video,texture,material,mesh,started=false,tracking=false,recorder,parts=[],composite,ctx,recordStream,raf,recording=false,lastBlobUrl=null;
const posterRatio=1448/2048;
function toast(message){const e=$('toast');e.textContent=message;e.style.display='block';setTimeout(()=>e.style.display='none',4200)}
function makeVideo(){video=document.createElement('video');video.src='assets/animation.mp4';video.loop=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.preload='auto';video.crossOrigin='anonymous';video.load();}
async function startAR(){
 if(started)return;
 if(!navigator.mediaDevices?.getUserMedia){toast('Cần mở website qua HTTPS hoặc localhost.');return;}
 $('start').disabled=true;$('start').textContent='ĐANG KHỞI ĐỘNG…';
 try{
  makeVideo();
  mind=new MindARThree({container:$('ar'),imageTargetSrc:'assets/targets.mind',maxTrack:1,filterMinCF:0.001,filterBeta:0.03,uiScanning:'no',uiLoading:'no',uiError:'no'});
  ({renderer,scene,camera}=mind);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x000000,0);
  texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;
  material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:false,depthWrite:false});
  // Scale-to-fill: keep the ORIGINAL video proportions, scale uniformly
  // until the A2 plane is fully covered. The AR plane is the viewport/mask;
  // the underlying MP4 is NOT cropped, transcoded for aspect ratio, or distorted.
  const targetAspect=posterRatio,videoAspect=4/5;
  const scaleToFill=Math.max(targetAspect/videoAspect,videoAspect/targetAspect);
  texture.repeat.set(1/scaleToFill,1);
  texture.offset.set((1-texture.repeat.x)/2,0);
  mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1/posterRatio),material);
  mesh.position.z=.002;
  anchor=mind.addAnchor(0);anchor.group.add(mesh);
  anchor.onTargetFound=()=>{tracking=true;status.textContent='ĐÃ NHẬN DIỆN';reticle.style.display='none';video.play().catch(()=>toast('Chạm màn hình để bật video.'));};
  anchor.onTargetLost=()=>{tracking=false;status.textContent='ĐANG TÌM POSTER…';reticle.style.display='block';video.pause();};
  await mind.start();
  renderer.setAnimationLoop(()=>renderer.render(scene,camera));
  started=true;cover.hidden=true;hud.hidden=false;
 }catch(e){console.error(e);toast('Không khởi động được AR. Kiểm tra quyền camera và file targets.mind.');$('start').disabled=false;$('start').textContent='THỬ LẠI';}
}
$('start').addEventListener('click',startAR);
window.addEventListener('pointerdown',()=>{if(tracking&&video?.paused)video.play().catch(()=>{});},{passive:true});

// Composite camera + WebGL into one canvas. Browser camera video may be mirrored/cropped by its CSS.
function renderComposite(){if(!recording)return;
 const cameraVideo=$('ar').querySelector('video');
 if(cameraVideo?.readyState>=2){
  const cw=composite.width,ch=composite.height,vw=cameraVideo.videoWidth,vh=cameraVideo.videoHeight;
  // Match the actual CSS object-fit:cover crop of the live camera element.
  const rect=cameraVideo.getBoundingClientRect();
  const cssW=rect.width||innerWidth,cssH=rect.height||innerHeight;
  const fit=Math.max(cssW/vw,cssH/vh);
  const displayedW=vw*fit,displayedH=vh*fit;
  const left=rect.left+(cssW-displayedW)/2,top=rect.top+(cssH-displayedH)/2;
  const sx=(-left)/fit,sy=(-top)/fit,sw=innerWidth/fit,sh=innerHeight/fit;
  ctx.drawImage(cameraVideo,sx,sy,sw,sh,0,0,cw,ch);
 }else{ctx.fillStyle='#000';ctx.fillRect(0,0,composite.width,composite.height)}
 // MindAR's transparent WebGL render canvas sits above the camera feed.
 const glCanvas=renderer?.domElement;
 if(glCanvas){ctx.drawImage(glCanvas,0,0,composite.width,composite.height)}
 raf=requestAnimationFrame(renderComposite);
}
async function beginRecording(){
 if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){toast('Trình duyệt này không hỗ trợ quay canvas. Hãy thử Safari/Chrome bản mới.');return;}
 const candidates=['video/mp4;codecs=avc1.42E01E','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
 const mime=candidates.find(m=>MediaRecorder.isTypeSupported(m));if(!mime){toast('Thiết bị chưa hỗ trợ định dạng quay video.');return;}
 composite=document.createElement('canvas');const portrait=innerHeight>=innerWidth;composite.width=portrait?720:1280;composite.height=portrait?1280:720;ctx=composite.getContext('2d',{alpha:false});
 recordStream=composite.captureStream(24);parts=[];
 try{recorder=new MediaRecorder(recordStream,{mimeType:mime,videoBitsPerSecond:3500000});}catch(e){toast('Không thể khởi tạo trình ghi video.');recordStream.getTracks().forEach(t=>t.stop());return;}
 recorder.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};
 recorder.onstop=()=>{cancelAnimationFrame(raf);recordStream.getTracks().forEach(t=>t.stop());const blob=new Blob(parts,{type:mime});if(lastBlobUrl)URL.revokeObjectURL(lastBlobUrl);lastBlobUrl=URL.createObjectURL(blob);$('preview').src=lastBlobUrl;$('save').href=lastBlobUrl;$('save').download='the-1st-collection-ar.'+(mime.includes('mp4')?'mp4':'webm');$('save-note').textContent=mime.includes('webm')?'Nếu iPhone không lưu được WebM trực tiếp, dùng Chia sẻ → Lưu vào Tệp hoặc chuyển sang MP4.':'';$('result').hidden=false;};
 recording=true;renderComposite();recorder.start(1000);rec.classList.add('active');$('rec-label').textContent='ĐANG QUAY • NHẤN ĐỂ DỪNG';
}
function stopRecording(){if(!recording)return;recording=false;rec.classList.remove('active');$('rec-label').textContent='NHẤN ĐỂ QUAY AR';if(recorder?.state!=='inactive')recorder.stop();}
rec.addEventListener('click',()=>recording?stopRecording():beginRecording());
$('close').addEventListener('click',()=>{$('preview').pause();$('result').hidden=true;});
// Camera sau cố định để đảm bảo tracking; không hiển thị nút đổi camera không hoạt động.
window.addEventListener('pagehide',()=>{if(recording)stopRecording();video?.pause();});
