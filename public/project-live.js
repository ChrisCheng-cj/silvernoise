import { renderProject } from './project-render.js';
async function response(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('加载失败');return r.json();}
const id=location.pathname.match(/\/projects\/([a-z0-9-]+)(?:\.html)?\/?$/)?.[1];
const session=response('/api/session').catch(()=>({canEdit:false}));
if(id){
  const draft=new URLSearchParams(location.search).get('preview')==='1';
  try{const value=await response('/api/projects/'+id+(draft?'?draft=1':''));renderProject(value.data,document.querySelector('main'),id);document.title=value.data.client+' · '+value.data.title+' — Silver Noise';if(draft){const banner=document.createElement('div');banner.className='draft-banner';banner.textContent='草稿预览 · 尚未发布';document.body.prepend(banner);}}
  catch{const error=document.createElement('p');error.className='draft-banner';error.textContent=draft?'草稿加载失败或无权查看，请返回编辑器重试。':'最新内容暂未加载，当前显示网站初始版本。';document.body.prepend(error);if(draft)document.querySelector('main').hidden=true;}
  const {canEdit}=await session;if(canEdit){const edit=document.createElement('a');edit.className='owner-edit-floating';edit.textContent='编辑项目';edit.href='/editor.html?project='+id;document.body.append(edit);}
 }else{
  const {canEdit}=await session;
  const thumbnail=document.createElement('div');thumbnail.className='project-hover-cover';thumbnail.hidden=true;thumbnail.setAttribute('aria-hidden','true');
  const thumbnailImage=document.createElement('img');thumbnailImage.alt='';thumbnail.append(thumbnailImage);document.body.append(thumbnail);
  let previewLink=null;
  function hideCover(){previewLink=null;thumbnail.hidden=true;}
  function positionCover(){
    if(!previewLink)return;const rect=previewLink.getBoundingClientRect(),width=Math.min(320,innerWidth-32),height=width*.625;
    thumbnail.style.width=width+'px';thumbnail.style.height=height+'px';
    thumbnail.style.left=Math.max(16,Math.min(rect.left+Math.min(rect.width,120),innerWidth-width-16))+'px';
    const below=rect.bottom+12;thumbnail.style.top=Math.max(16,below+height<=innerHeight-16?below:rect.top-height-12)+'px';
  }
  function attachCover(link,cover){
    if(!cover?.src)return;
    function show(){previewLink=link;thumbnail.hidden=true;thumbnailImage.src=cover.src;positionCover();if(thumbnailImage.complete&&thumbnailImage.naturalWidth)thumbnail.hidden=false;}
    link.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')show();});link.addEventListener('pointerleave',hideCover);
    link.addEventListener('focus',show);link.addEventListener('blur',hideCover);link.addEventListener('click',hideCover);
  }
  thumbnailImage.addEventListener('load',()=>{if(previewLink){positionCover();thumbnail.hidden=false;}});thumbnailImage.addEventListener('error',hideCover);
  window.addEventListener('scroll',hideCover,{passive:true,capture:true});window.addEventListener('resize',hideCover);window.addEventListener('hashchange',hideCover);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hideCover();});
  function editIcon(key){
    const edit=document.createElement('a');edit.className='project-edit-link';edit.href='/editor.html?project='+key;edit.setAttribute('aria-label','编辑项目');edit.title='编辑项目';
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('fill','none');icon.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m15 5 4 4M4 20l4-1L20 7a2.83 2.83 0 0 0-4-4L4 15v5Z');icon.append(path);edit.append(icon);return edit;
  }
  try{
    const projects=await response('/api/projects'+(canEdit?'?editor=1':''));
    document.querySelectorAll('.brand-panel tbody').forEach(body=>body.replaceChildren());
    for(const [key,value] of Object.entries(projects)){
      const panel=document.querySelector('#panel-'+(value.brand||key));if(!panel)continue;
      const row=document.createElement('tr'),project=document.createElement('td'),client=document.createElement('td'),date=document.createElement('td');
      const link=document.createElement('a');link.className='project-link';link.href=value.isDraft?'/editor.html?project='+key:'/projects/'+key+'.html';const name=document.createElement('span');name.textContent=value.title;link.append(name);project.append(link);
      attachCover(link,value.cover);
      if(canEdit)project.append(editIcon(key));if(value.isDraft){const badge=document.createElement('span');badge.className='draft-tag';badge.textContent='草稿';project.append(badge);}
      client.textContent=value.client;date.textContent=value.date||'待补充';date.className='project-date';row.append(project,client,date);panel.querySelector('tbody').append(row);
    }
  }catch{
    if(canEdit){const notice=document.createElement('p');notice.className='project-create-status';notice.textContent='项目列表暂未加载，刷新后可查看新增项目。';document.querySelector('.brand-content')?.prepend(notice);}
  }
  if(canEdit)document.querySelectorAll('.brand-panel').forEach(panel=>{
    const brand=panel.id.replace('panel-',''),button=document.createElement('button'),notice=document.createElement('p');button.type='button';button.className='add-project';button.textContent='+ 添加项目';notice.className='project-create-status';notice.setAttribute('role','status');let requestId;
    button.addEventListener('click',async()=>{
      requestId ||= crypto.randomUUID();button.disabled=true;button.textContent='正在创建…';notice.textContent='';
      try{const r=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json','X-Portfolio-Editor':'1'},body:JSON.stringify({brand,requestId})});const result=await r.json();if(!r.ok)throw Error(result.error||'创建失败');location.href='/editor.html?project='+result.id;}
      catch(error){notice.textContent=error.message+'，请重试。';button.disabled=false;button.textContent='+ 添加项目';}
    });panel.prepend(button);panel.append(notice);
  });
}
