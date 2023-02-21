!function(){"use strict";const e=new Error("failed to get response body reader"),t=new Error("unknown message type"),a=new Error("ffmpeg is not loaded, call `await ffmpeg.load()` first"),r=new Error("failed to complete download"),s=(new Error("called FFmpeg.terminate()"),"text/javascript");var o;!function(e){e.LOAD="load",e.EXEC="EXEC",e.WRITE_FILE="WRITE_FILE",e.READ_FILE="READ_FILE",e.DELETE_FILE="DELETE_FILE",e.RENAME="RENAME",e.CREATE_DIR="CREATE_DIR",e.LIST_DIR="LIST_DIR",e.DELETE_DIR="DELETE_DIR",e.ERROR="ERROR",e.DOWNLOAD="DOWNLOAD",e.PROGRESS="PROGRESS",e.LOG="LOG"}(o||(o={}));(()=>{let e=0})();const n=async(t,a)=>{const s=await fetch(t);let o;try{const n=parseInt(s.headers.get("Content-Length")||"-1"),E=s.body?.getReader();if(!E)throw e;const c=new Uint8Array(n);let d=0;for(;;){const{done:e,value:s}=await E.read(),o=s?s.length:0;if(e){if(n!==d)throw r;a({url:t,total:n,received:d,delta:o,done:e});break}c.set(s,d),d+=o,a({url:t,total:n,received:d,delta:o,done:e})}o=c.buffer}catch(e){console.log("failed to send download progress event: ",e),o=await s.arrayBuffer(),a({url:t,total:o.byteLength,received:o.byteLength,delta:0,done:!0})}return o},E=async(e,t,a)=>URL.createObjectURL(new Blob([await n(e,a)],{type:t}));let c;self.onmessage=async({data:{id:e,type:r,data:n}})=>{const d=[];let i;try{if(r!==o.LOAD&&!c)throw a;switch(r){case o.LOAD:i=await(async({coreURL:e="https://unpkg.com/@ffmpeg/core@0.12.0/dist/ffmpeg-core.js",wasmURL:t,workerURL:a,blob:r=!0,thread:n=!1})=>{const d=!c;let i=e,l=t||e.replace(/.js$/g,".wasm"),p=a||e.replace(/.js$/g,".worker.js");return r&&(i=await E(i,s,(e=>self.postMessage({type:o.DOWNLOAD,data:e}))),l=await E(l,"application/wasm",(e=>self.postMessage({type:o.DOWNLOAD,data:e}))),n&&(p=await E(p,s,(e=>self.postMessage({type:o.DOWNLOAD,data:e}))))),importScripts(i),c=await self.createFFmpegCore({mainScriptUrlOrBlob:i,locateFile:(e,t)=>e.endsWith(".wasm")?l:e.endsWith(".worker.js")?p:t+e}),c.setLogger((e=>self.postMessage({type:o.LOG,data:e}))),c.setProgress((e=>self.postMessage({type:o.PROGRESS,data:{progress:e}}))),d})(n);break;case o.EXEC:i=(({args:e,timeout:t=-1})=>{c.setTimeout(t),c.exec(...e);const a=c.ret;return c.reset(),a})(n);break;case o.WRITE_FILE:i=(({path:e,data:t})=>(c.FS.writeFile(e,t),!0))(n);break;case o.READ_FILE:i=(({path:e,encoding:t})=>c.FS.readFile(e,{encoding:t}))(n);break;case o.DELETE_FILE:i=(({path:e})=>(c.FS.unlink(e),!0))(n);break;case o.RENAME:i=(({oldPath:e,newPath:t})=>(c.FS.rename(e,t),!0))(n);break;case o.CREATE_DIR:i=(({path:e})=>(c.FS.mkdir(e),!0))(n);break;case o.LIST_DIR:i=(({path:e})=>c.FS.readdir(e))(n);break;case o.DELETE_DIR:i=(({path:e})=>(c.FS.rmdir(e),!0))(n);break;default:throw t}}catch(t){return void self.postMessage({id:e,type:o.ERROR,data:t})}i instanceof Uint8Array&&d.push(i.buffer),self.postMessage({id:e,type:r,data:i},d)}}();