import { renderProject, fontFamilies } from './project-render.js';
const $=selector=>document.querySelector(selector), id=new URLSearchParams(location.search).get('project');
let data,revision=0,dirty=false,busy=false;
const status=(message,error=false)=>{ $('#status').textContent=message;$('#status').classList.toggle('error',error); };
async function api(path,options={}){const r=await fetch(path,{cache:'no-store',...options,headers:{'X-Portfolio-Editor':'1',...options.headers}});let value;try{value=await r.json();}catch{throw Error('服务器未返回有效结果，请重试。');}if(!r.ok)throw Error(value.error||'操作失败');return value;}
function lock(value){busy=value;$('#form').inert=value;for(const selector of ['#save','#publish','#preview'])$(selector).disabled=value;}
function changed(){dirty=true;status('有未保存的修改');renderProject(data,$('#live-preview'),id,true);applyCanvasStyles();}
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
let activeText=null;
const defaultStyle=()=>({font:'sans',align:'left',weight:400,size:18,color:'#333333'});
function styleNode(element,style){element.style.fontFamily=fontFamilies[style.font];element.style.fontSize=style.size+'px';element.style.fontWeight=style.weight;element.style.textAlign=style.align;element.style.color=style.color||'#222222';}
function applyCanvasStyles(){styleNode($('#title'),data.titleStyle);styleNode($('#description'),data.bodyStyle);document.querySelectorAll('[data-text-index]').forEach(el=>styleNode(el,data.media[Number(el.dataset.textIndex)].style));}
function selectStyle(style,label,title=false){
 activeText=style;$('#selection-label').textContent=label;const grid=$('#style-inspector');grid.replaceChildren();grid.className='style-fields';
 for(const [prop,name,choices] of [['font','字体',[['sans','Arial / 无衬线'],['chinese','微软雅黑 / 苹方'],['serif','Georgia / 宋体'],['mono','等宽字体']]],['align','对齐',[['left','左对齐'],['center','居中'],['right','右对齐']]],['weight','字重',[[400,'常规'],[500,'中等'],[600,'半粗'],[700,'粗体']]]]){
 const wrap=node('label',name),input=node('select');input.setAttribute('aria-label',label+name);for(const [value,text] of choices){const option=node('option',text);option.value=value;input.append(option);}input.value=style[prop];input.addEventListener('change',()=>{style[prop]=prop==='weight'?Number(input.value):input.value;changed();});wrap.append(input);grid.append(wrap);
 }
 for(const [prop,name,type] of [['size','字号','number'],['color','颜色','color']]){const wrap=node('label',name),input=node('input');input.type=type;input.setAttribute('aria-label',label+name);input.min=12;input.max=title?72:36;input.value=style[prop]||(prop==='color'?'#333333':18);input.addEventListener('input',()=>{if(prop==='size'&&(!Number.isInteger(Number(input.value))||Number(input.value)<12||Number(input.value)>Number(input.max)))return;style[prop]=prop==='size'?Number(input.value):input.value;changed();});wrap.append(input);grid.append(wrap);}
}
function fillStyles(){selectStyle(data.titleStyle,'项目标题',true);$('#title').addEventListener('focus',()=>selectStyle(data.titleStyle,'项目标题',true));$('#description').addEventListener('focus',()=>selectStyle(data.bodyStyle,'项目描述'));applyCanvasStyles();}
function mediaUI(){
 const cover=$('#cover-preview');cover.replaceChildren();if(data.cover){const img=node('img');img.src=data.cover.src;img.alt='封面预览';cover.append(img);}else{cover.append(node('div','添加一张顶部大图，开启你的项目'));}
 const list=$('#media-list');list.replaceChildren();$('#module-count').textContent=data.media.length+' / 60 个内容模块';
 data.media.forEach((item,index)=>{
 const card=node('section');card.className='media-card';const bar=node('div');bar.className='block-bar';bar.append(node('span',String(index+1).padStart(2,'0')+' / '+(item.type==='text'?'文字':item.type==='video'?'视频':'图片 / GIF')));card.append(bar);
 card.addEventListener('pointerdown',()=>{document.querySelectorAll('.media-card').forEach(n=>n.classList.toggle('selected',n===card));});
 if(item.type==='text'){
 item.style||=defaultStyle();const input=node('textarea');input.rows=5;input.maxLength=15000;input.placeholder='输入文字…';input.value=item.text;input.dataset.textIndex=index;input.setAttribute('aria-label','文字模块 '+(index+1));input.addEventListener('focus',()=>selectStyle(item.style,'文字模块 '+(index+1)));input.addEventListener('input',()=>{item.text=input.value;changed();});card.append(input);
 }else{
 const asset=node(item.type==='video'?'video':'img');asset.src=item.src;if(item.type==='video'){asset.controls=true;asset.preload='metadata';}else asset.alt=item.alt;card.append(asset);
 for(const [key,name] of [['alt','媒体说明'],['caption','图片 / 视频下方文字']]){const wrap=node('label',name),input=node('input');input.value=item[key]||'';input.maxLength=key==='alt'?300:1000;input.addEventListener('input',()=>{item[key]=input.value;changed();});wrap.append(input);card.append(wrap);}
 }
 const controls=node('div');controls.className='media-controls';
 for(const [name,action,disabled] of [['上移',()=>{[data.media[index-1],data.media[index]]=[item,data.media[index-1]];},index===0],['下移',()=>{[data.media[index+1],data.media[index]]=[item,data.media[index+1]];},index===data.media.length-1],['删除',()=>data.media.splice(index,1),false]]){const button=node('button',name);button.type='button';button.disabled=disabled;button.setAttribute('aria-label',name+'第 '+(index+1)+' 个模块');button.addEventListener('click',()=>{action();mediaUI();selectStyle(data.titleStyle,'项目标题',true);changed();});controls.append(button);}bar.append(controls);list.append(card);
 });applyCanvasStyles();
}
document.querySelectorAll('[data-add-text]').forEach(button=>button.addEventListener('click',()=>{if(data.media.length>=60){status('每个项目最多 60 个内容模块',true);return;}data.media.push({type:'text',text:'',style:defaultStyle()});mediaUI();changed();const input=document.querySelector('[data-text-index="'+(data.media.length-1)+'"]');input.focus();input.scrollIntoView({block:'center',behavior:'smooth'});}));
document.querySelectorAll('[data-upload]').forEach(button=>button.addEventListener('click',()=>{const input=$('#media-files');input.accept=button.dataset.upload==='video'?'video/mp4,video/webm':button.dataset.upload==='image'?'image/jpeg,image/png,image/webp,image/gif':'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm';input.click();}));
$('#select-cover').addEventListener('click',()=>$('#cover-file').click());
async function upload(files,cover){
 if(!files.length)return;if(!cover&&data.media.length+files.length>60){status('每个项目最多 60 个媒体文件',true);return;}lock(true);let added=0;
 try{for(const [index,file] of [...files].entries()){
  if(file.size>50*1024*1024)throw Error(file.name+' 超过 50 MB');
  if(!['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'].includes(file.type)||cover&&!file.type.startsWith('image/'))throw Error('请选择支持的图片或视频，不接受 PDF。');
  status(`正在上传 ${index+1}/${files.length}：${file.name}`);const form=new FormData();form.append('file',file);const item=await api('/api/media',{method:'POST',body:form});
  if(cover)data.cover={src:item.src,alt:data.title};else data.media.push(item);added++;dirty=true;
 }mediaUI();changed();status('上传完成，保存草稿或发布后生效。');}
 catch(error){mediaUI();renderProject(data,$('#live-preview'),id,true);status(error.message+(added?'；已上传的文件已保留在当前编辑内容中。':''),true);}finally{lock(false);$('#cover-file').value='';$('#media-files').value='';}
}
async function save(action){
 if(!$('#form').reportValidity())return false;lock(true);status(action==='publish'?'正在发布…':'正在保存草稿…');
 try{const result=await api('/api/projects/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,revision,action})});revision=result.revision;dirty=false;status(action==='publish'?'已发布，正式详情页和 WORK 表格已更新。':'草稿已保存到云端，正式页面未改变。');return true;}catch(error){status(error.message,true);return false;}finally{lock(false);}
}
$('#form').addEventListener('submit',event=>event.preventDefault());
$('#save').addEventListener('click',()=>save('draft'));
$('#publish').addEventListener('click',()=>save('publish'));
$('#preview').addEventListener('click',async()=>{const tab=window.open('about:blank','_blank');if(await save('draft')){if(tab){tab.opener=null;tab.location.href='/projects/'+id+'.html?preview=1';}else status('草稿已保存，但浏览器阻止了预览窗口，请允许弹出窗口后重试。',true);}else tab?.close();});
$('#cover-file').addEventListener('change',event=>upload(event.target.files,true));$('#media-files').addEventListener('change',event=>upload(event.target.files,false));
$('#remove-cover').addEventListener('click',()=>{data.cover=null;mediaUI();changed();});
window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
try{
 const session=await api('/api/session');if(!session.canEdit){$('#access').hidden=false;const message=node('p','仅网站所有者可编辑。请使用网站所有者账号登录。');const link=node('a','使用 ChatGPT 登录');link.href='/signin-with-chatgpt?return_to='+encodeURIComponent(location.pathname+location.search);link.target='_top';$('#access').append(message,link);status('当前账号没有编辑权限',true);}
 else if(!id||!/^[a-z0-9-]+$/.test(id)){status('项目不存在，请从 WORK 表格进入。',true);}
 else{const result=await api('/api/projects/'+id+'?draft=1');data=result.data;revision=result.revision;$('#back').href='/index.html#'+(data.brand||id);for(const key of ['title','client','date','description']){$('#'+key).value=data[key];$('#'+key).addEventListener('input',event=>{data[key]=event.target.value;changed();});}fillStyles();mediaUI();renderProject(data,$('#live-preview'),id,true);$('#editor').hidden=false;lock(false);status(result.updatedAt?'已载入云端草稿 · '+new Date(result.updatedAt).toLocaleString():'可以开始编辑，保存草稿后可跨设备继续。');}
}catch(error){status(error.message,true);}
