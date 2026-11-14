export const fontFamilies = { sans:'Arial, "Helvetica Neue", sans-serif', serif:'Georgia, "Songti SC", SimSun, serif', mono:'Consolas, "Courier New", monospace', chinese:'"Microsoft YaHei", "PingFang SC", sans-serif' };
const el = (tag, className, text) => { const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node; };
function styling(node, style){if(!style)return;node.style.fontFamily=fontFamilies[style.font]||fontFamilies.sans;node.style.fontSize=style.size+'px';node.style.fontWeight=style.weight;node.style.textAlign=style.align;}
export function renderProject(data, target, id, preview=false){
  const brand = data.brand || id;
  const cover=el('div','project-cover');
  if(data.cover){const img=el('img');img.src=data.cover.src;img.alt=data.cover.alt||data.title;cover.append(img);}else cover.append(el('div','cover-pending','项目封面待补充'));
  const body=el('div','project-body');
  const back=el('a','project-back','← 返回 WORK');back.href='/index.html#'+brand;if(!preview)body.append(back);
  const intro=el('section','project-intro');const heading=el('div');heading.append(el('p','project-client',data.client));const title=el('h1','',data.title);styling(title,data.titleStyle);heading.append(title);
  const description=el('div','project-description');const copy=el('p','project-copy',data.description);styling(copy,data.bodyStyle);description.append(copy);
  const list=el('dl');for(const [label,value] of [['CLIENT',data.client],['DATE',data.date||'待补充']]){const group=el('div');group.append(el('dt','',label),el('dd','',value));list.append(group);}description.append(list);intro.append(heading,description);body.append(intro);
  const media=el('section','project-media');
  for(const item of data.media){const figure=el('figure');const asset=el(item.type==='video'?'video':'img');asset.src=item.src;if(item.type==='video'){asset.controls=true;asset.playsInline=true;asset.preload='metadata';asset.setAttribute('aria-label',item.alt||data.title);}else{asset.alt=item.alt||'';asset.loading='lazy';}figure.append(asset);if(item.caption)figure.append(el('figcaption','',item.caption));media.append(figure);}
  if(!data.media.length)media.append(el('p','media-pending','项目媒体待补充。'));
  body.append(media);if(!preview){const foot=el('footer','project-footer');const link=el('a','','← 返回品牌项目');link.href='/index.html#'+brand;foot.append(link);body.append(foot);}target.replaceChildren(cover,body);
}
