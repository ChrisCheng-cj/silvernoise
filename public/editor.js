import { renderProject } from './project-render.js';
const $=selector=>document.querySelector(selector), id=new URLSearchParams(location.search).get('project');
let data,revision=0,dirty=false,busy=false;
const status=(message,error=false)=>{ $('#status').textContent=message;$('#status').classList.toggle('error',error); };
async function api(path,options={}){const r=await fetch(path,{cache:'no-store',...options,headers:{'X-Portfolio-Editor':'1',...options.headers}});let value;try{value=await r.json();}catch{throw Error('服务器未返回有效结果，请重试。');}if(!r.ok)throw Error(value.error||'操作失败');return value;}
function lock(value){busy=value;$('#form').inert=value;for(const selector of ['#save','#publish','#preview'])$(selector).disabled=value;}
function changed(){dirty=true;status('有未保存的修改');renderProject(data,$('#live-preview'),id,true);}
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function fillStyles(){
 for(const field of document.querySelectorAll('[data-style]')){
  const key=field.dataset.style,grid=node('div');grid.className='style-fields';
  for(const [prop,label,choices] of [['font','字体',[['sans','Arial / 无衬线'],['chinese','微软雅黑 / 苹方'],['serif','Georgia / 宋体'],['mono','等宽字体']]],['align','对齐',[['left','左对齐'],['center','居中'],['right','右对齐']]],['weight','字重',[[400,'常规'],[500,'中等'],[600,'半粗'],[700,'粗体']]]]){
   const wrapper=node('label',label),select=node('select');select.setAttribute('aria-label',(key==='titleStyle'?'标题':'描述')+label);for(const [value,name] of choices){const option=node('option',name);option.value=value;select.append(option);}select.value=data[key][prop];select.addEventListener('change',()=>{data[key][prop]=prop==='weight'?Number(select.value):select.value;changed();});wrapper.append(select);grid.append(wrapper);
  }
  const label=node('label','字号'),size=node('input');size.type='number';size.min=12;size.max=key==='titleStyle'?72:36;size.value=data[key].size;size.setAttribute('aria-label',(key==='titleStyle'?'标题':'描述')+'字号');size.addEventListener('input',()=>{const v=Number(size.value);if(Number.isInteger(v)&&v>=12&&v<=Number(size.max)){data[key].size=v;changed();}});label.append(size);grid.append(label);field.append(grid);
 }
}
function mediaUI(){
 const cover=$('#cover-preview');cover.replaceChildren();if(data.cover){const img=node('img');img.src=data.cover.src;img.alt='封面预览';cover.append(img);}
 const list=$('#media-list');list.replaceChildren();data.media.forEach((item,index)=>{
  const card=node('div');card.className='media-card';const asset=node(item.type==='video'?'video':'img');asset.src=item.src;if(item.type==='video'){asset.controls=true;asset.preload='metadata';}else asset.alt=item.alt;card.append(asset);
  for(const [key,labelText] of [['alt','媒体说明'],['caption','图片 / 视频下方文字']]){const label=node('label',labelText),input=node('input');input.value=item[key]||'';input.maxLength=key==='alt'?300:1000;input.addEventListener('input',()=>{item[key]=input.value;changed();});label.append(input);card.append(label);}
  const controls=node('div');controls.className='media-controls';for(const [label,action,disabled] of [['上移',()=>{[data.media[index-1],data.media[index]]=[item,data.media[index-1]];},index===0],['下移',()=>{[data.media[index+1],data.media[index]]=[item,data.media[index+1]];},index===data.media.length-1],['移除',()=>data.media.splice(index,1),false]]){const button=node('button',label);button.type='button';button.disabled=disabled;button.setAttribute('aria-label',label+'第 '+(index+1)+' 个媒体');button.addEventListener('click',()=>{action();mediaUI();changed();});controls.append(button);}card.append(controls);list.append(card);
 });
}
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
