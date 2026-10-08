import http from "node:http";
import {randomUUID} from "node:crypto";
import {parsePack,toLegacyBody,secureEqual} from "./pack.mjs";
const PORT = Number(process.env.PORT ?? 8787);
const MAX_REQUEST_BYTES = 150_000;
const upstream = process.env.DD_BASE44_SYNC_URL;
const adapter = process.env.DD_BASE44_ADAPTER ?? "ingestPack";
const inboundToken = process.env.DD_SYNC_GATEWAY_TOKEN;
const upstreamToken = process.env.DD_BASE44_SYNC_TOKEN;
const handler = http.createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify(data));};
 if(req.method==="GET"&&req.url==="/health")return send(200,{status:"ok",service:"dd-v4-sync",upstream_configured:Boolean(upstream&&upstreamToken)});
 if(req.method!=="POST"||req.url!=="/api/v1/packs")return send(404,{error:"not_found"});
 if(!inboundToken||!upstream||!upstreamToken)return send(503,{error:"sync_not_configured"});
 const token=(req.headers.authorization??"").replace(/^Bearer\s+/i,"").trim();
 if(!secureEqual(token,inboundToken))return send(401,{error:"unauthorized"});
 if(!(req.headers["content-type"]??"").startsWith("application/json"))return send(415,{error:"json_required"});
 let bytes=0;let raw="";for await(const chunk of req){bytes+=chunk.length;if(bytes>MAX_REQUEST_BYTES)return send(413,{error:"request_too_large"});raw+=chunk.toString();}
 let pack;try{pack=parsePack(JSON.parse(raw));}catch(e){return send(400,{error:e.message==="Unexpected end of JSON input"?"invalid_json":"invalid_pack",detail:String(e.message).slice(0,100)});}
 if(pack.requires_external_artifact)return send(422,{error:"artifact_storage_required",sha256:pack.sha256,bytes:pack.html_bytes});
 let target;try{target=new URL(upstream);if(target.protocol!=="https:")throw Error();}catch{return send(503,{error:"invalid_upstream_configuration"});}
 const payload=toLegacyBody(pack,adapter);
 const headers={"content-type":"application/json"};
 if(adapter==="ingestPack")payload.sync_token=upstreamToken;
 else if(adapter==="packSync")headers.authorization="Bearer "+upstreamToken;
 else return send(503,{error:"unsupported_adapter"});
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12_000);
 try{
   const r=await fetch(target,{method:"POST",headers,body:JSON.stringify(payload),signal:controller.signal,redirect:"error"});
   const result=await r.json().catch(()=>({}));
   // Do not forward arbitrary upstream payloads, which may include confidential data.
   return send(r.ok?202:502,{status:r.ok?"submitted_for_review":"upstream_failed",upstream_status:r.status,pack_sha256:pack.sha256,upstream_id:typeof result.id==="string"?result.id:null,receipt_id:randomUUID()});
 }catch{return send(502,{error:"upstream_unavailable",pack_sha256:pack.sha256});}
 finally{clearTimeout(timeout);}
});
if(import.meta.url===new URL("file://"+process.argv[1]).href)handler.listen(PORT,()=>console.log("DD-V4 sync listening on",PORT));
export default handler;
