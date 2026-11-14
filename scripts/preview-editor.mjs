// Local-only authenticated preview adapter. Never included in the deployed artifact.
import http from 'node:http';
const origin='http://127.0.0.1:8787';
http.createServer(async(req,res)=>{
 try{
  const headers={...req.headers,host:'127.0.0.1:8787','oai-authenticated-user-id':'local-owner','oai-authenticated-user-email':'local-owner@example.test'};
  if(headers.origin)headers.origin=origin;
  const response=await fetch(origin+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:req,duplex:'half',redirect:'manual'});
  const out=Object.fromEntries(response.headers);delete out['content-encoding'];delete out['transfer-encoding'];res.writeHead(response.status,out);
  if(response.body)for await(const chunk of response.body)res.write(chunk);res.end();
 }catch{res.writeHead(502).end('Local preview unavailable');}
}).listen(4180,'127.0.0.1',()=>console.log('Editor preview: http://127.0.0.1:4180/editor.html?project=jd'));
