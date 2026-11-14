function updateNav(){document.querySelectorAll('[data-nav]').forEach(link=>{if(link.hash===location.hash)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
window.addEventListener('hashchange',updateNav);updateNav();
const pages = [
  {title:'AIGC LAB',description:'生成式影像实验',url:'#aigc-lab',keywords:'aigc lab ai 生成式 人工智能 实验'},
  {title:'非商业项目',description:'三维探索、动态实验与视觉创作',url:'#personal-work',keywords:'非商业 个人 创作 练习 实验'},
  {title:'精选作品',description:'小米视觉作品',url:'#selected-works',keywords:'精选 小米 selected'},
  {title:'WORK · 作品',description:'商业视觉、三维影像与 IP 角色作品',url:'#work',keywords:'work works portfolio 作品 项目 商业视觉 三维 设计'},
  {title:'ABOUT · 关于',description:'小红书、站酷、Behance、Instagram 与 X 社媒链接',url:'#about',keywords:'about 关于 简介 介绍 silver noise 设计师 社媒 社交 小红书 站酷 behance zcool instagram x'},
  {title:'HOME · 首页',description:'OMEGA、视频01与 BUGATTI 循环影像',url:'#home',keywords:'home 首页 视频 动画 omega 欧米茄 speedmaster 手表 moonwatch bugatti 布加迪 汽车'},
  {"title": "xiaomi", "description": "WORK / 品牌项目信息", "url": "#xiaomi", "keywords": "xiaomi xiaomi 小米"},
  {"title": "京东", "description": "WORK / 品牌项目信息", "url": "#jd", "keywords": "jd 京东"},
  {"title": "抖音", "description": "WORK / 品牌项目信息", "url": "#douyin", "keywords": "douyin 抖音"},
  {"title": "美团", "description": "WORK / 品牌项目信息", "url": "#meituan", "keywords": "meituan 美团"},
  {"title": "支付宝", "description": "WORK / 品牌项目信息", "url": "#alipay", "keywords": "alipay 支付宝"},
  {"title": "盒马", "description": "WORK / 品牌项目信息", "url": "#hema", "keywords": "hema 盒马"},
  {"title": "美的", "description": "WORK / 品牌项目信息", "url": "#midea", "keywords": "midea 美的"},
  {"title": "海底捞", "description": "WORK / 品牌项目信息", "url": "#haidilao", "keywords": "haidilao 海底捞"},
  {"title": "招商基金", "description": "WORK / 品牌项目信息", "url": "#cmfund", "keywords": "cmfund 招商基金"},
  {"title": "天猫", "description": "WORK / 品牌项目信息", "url": "#tmall", "keywords": "tmall 天猫"},
  {"title": "伊利", "description": "WORK / 品牌项目信息", "url": "#yili", "keywords": "yili 伊利"},
  {"title": "快手", "description": "WORK / 品牌项目信息", "url": "#kuaishou", "keywords": "kuaishou 快手"},
  {"title": "零食很忙", "description": "WORK / 品牌项目信息", "url": "#busy", "keywords": "busy 零食很忙"}
];
if(document.body.classList.contains('project-detail'))pages.forEach(page=>{page.url='../index.html'+page.url;});
const panel = document.querySelector('#site-search');
const toggle = document.querySelector('.search-toggle');
const input = document.querySelector('#search-input');
// Keep the search affordance compact on both the homepage and project pages.
const searchStyle=document.createElement('link');searchStyle.rel='stylesheet';searchStyle.href='/folder-search.css';document.head.append(searchStyle);
panel.replaceChildren(document.querySelector('#search-form'));
panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label','Search');
input.placeholder='Search';input.setAttribute('aria-label','Search');input.setAttribute('autocomplete','off');
document.querySelector('.site-header nav').append(panel);
function closeSearch(restoreFocus=true){panel.hidden=true;toggle.setAttribute('aria-expanded','false');if(restoreFocus)toggle.focus();}
function openSearch(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');input.focus();}
toggle.addEventListener('click',()=>panel.hidden?openSearch():closeSearch());
document.querySelector('#search-form').addEventListener('submit',event=>{
 event.preventDefault();const words=input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);if(!words.length)return;
 const match=pages.find(page=>words.every(word=>(page.title+' '+page.description+' '+page.keywords).toLocaleLowerCase().includes(word)));
 if(match){closeSearch(false);location.href=match.url;}else{input.setCustomValidity('没有找到匹配内容');input.reportValidity();}
});
input.addEventListener('input',()=>input.setCustomValidity(''));
document.addEventListener('click',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!toggle.contains(event.target))closeSearch(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();closeSearch();}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}});

const brandButtons=[...document.querySelectorAll('[data-brand]')];
function selectBrand(key){
 const target=brandButtons.find(button=>button.dataset.brand===key);if(!target)return false;
 const section=target.closest('.brand-work');
 section.querySelectorAll('[data-brand]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.brand===key)));
 section.querySelectorAll('.brand-panel').forEach(item=>item.hidden=item.id!=='panel-'+key);
 return true;
}
brandButtons.forEach((button,index)=>{
 button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')selectBrand(button.dataset.brand);});
 button.addEventListener('focus',()=>selectBrand(button.dataset.brand));
 button.addEventListener('click',()=>selectBrand(button.dataset.brand));
 button.addEventListener('keydown',event=>{const group=[...button.closest('.brand-work').querySelectorAll('[data-brand]')],index=group.indexOf(button);let next;if(event.key==='ArrowDown')next=(index+1)%group.length;if(event.key==='ArrowUp')next=(index-1+group.length)%group.length;if(event.key==='Home')next=0;if(event.key==='End')next=group.length-1;if(next!==undefined){event.preventDefault();group[next].focus();}});
});
function revealBrand(){const key=location.hash.slice(1);if(selectBrand(key)){brandButtons.find(button=>button.dataset.brand===key).closest('.brand-work').scrollIntoView();document.querySelector('[data-nav="work"]').setAttribute('aria-current','location');}}
window.addEventListener('hashchange',revealBrand);revealBrand();
