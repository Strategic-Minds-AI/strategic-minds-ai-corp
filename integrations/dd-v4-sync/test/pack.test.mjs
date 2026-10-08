import test from "node:test";
import assert from "node:assert/strict";
import {parsePack,toLegacyBody,secureEqual} from "../src/pack.mjs";
const sample={name:"Hero Mockup v2",kind:"web_pack",preview_html:"<!doctype html><title>Safe</title>",brand_tokens:{colors:{primary:"#123456"}}};
test("parses pack and preserves digest",()=>{const p=parsePack(sample);assert.equal(p.requires_external_artifact,false);assert.match(p.sha256,/^[a-f0-9]{64}$/);assert.equal(p.preview_html,sample.preview_html);});
test("normalizes legacy ingest body",()=>{const p=parsePack(sample);assert.equal(toLegacyBody(p,"ingestPack").kind,"web_pack");assert.equal(typeof toLegacyBody(p,"ingestPack").brand_tokens,"string");});
test("normalizes packSync body",()=>{const p=parsePack(sample);assert.equal(toLegacyBody(p,"packSync").action,"sync");assert.match(toLegacyBody(p,"packSync").pack.template_key,/^ddv4-/);});
test("oversize preview must use external artifact",()=>{const p=parsePack({...sample,preview_html:"x".repeat(30001)});assert.equal(p.requires_external_artifact,true);assert.throws(()=>toLegacyBody(p,"ingestPack"),/artifact_storage_required/);});
test("rejects bad inputs and token mismatches",()=>{assert.throws(()=>parsePack({...sample,name:""}));assert.equal(secureEqual("x","y"),false);assert.equal(secureEqual("abc","abc"),true);});
