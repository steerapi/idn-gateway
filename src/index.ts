// import { HttpApi } from './gateway';
import { toBuffer, fromBuffer } from '@idn/util-buffer';
import { IDN } from '@idn/js-idn';
import * as debug from 'debug';
import { w } from '@idn/util-promisify';

const log = debug('idn:gateway');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

let node
try{
  node = new IDN({})
}catch(err){
  console.log("err", err);
}
let app = express()
app.use(cors())
// app.use(bodyParser.raw({type: 'application/octet-stream', limit : '2mb'}))
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false}));
// setInterval(async ()=>{
//   if (node.state.state() !== 'running') {
//     return
//   }
//   let event = await node.idn.infer('@idn/model-webdnn-benchmark-lenet', [
//     toBuffer(new Float32Array(784))
//   ], [ { local: false, npeers: 1 } ])
//   event.on('response', response => {
//     console.log('infer response', response)
//   })
//   event.on('error', error => {
//     console.log('infer error', error)
//   })
// },5000)

async function preflight(req, res){
  if(node.state.state()!== 'running'){
    res.status(503).send("IDN node is not running");
    return
  }
  let cid = req.params.cid;
  if(!cid){
    res.status(400).send(`please provide /idn/:cid`);
    return
  }
  let [err,pkg] = await w(node.idn.findPackage(cid));
  // console.log("packages", packages)
  if(err){
    log("findPackages error", err)
    res.status(500).send(`error while finding cid ${cid} (${err.message})`);
    return
  }
  // if(!packages || packages.length === 0){
  //   res.status(404).send(`cannot find cid ${cid}. no node is currently providing it.`);
  //   return
  // }
  // return packages;
  return pkg;
}

function fromJSON(json){
  if(json.type == 'Buffer'){
    return Buffer.from(json.data)
  }
  return json
}
function toJSON(buffer){
  return {
    "type": "Buffer",
    "data": Array.from(buffer)
  }
}


app.get('/idn/:cid',  async function(req, res) {
  let pkg = await preflight(req, res)
  if(!pkg){
    return;
  }
  res.send(pkg)
});

app.post('/idn/:cid', async function(req, res) {
  let pkg = await preflight(req, res)
  if(!pkg){
    return;
  }
  let cid = req.params.cid;
  let inputs = req.body.inputs.map((json)=>{
    return fromJSON(json)
  })
  console.log("inputs", inputs);
  let event = await node.idn.infer(cid, inputs, [ { local: false, npeers: 1 } ]);
  event.on("response", (response)=>{
    let result:any = {}
    Object.assign(result, response)
    if(response.outputs){
      let outputs = response.outputs.map((buffer)=>{
        return toJSON(buffer);
      })
      result.outputs = outputs;
    }
    res.send(result);
  })
  event.on("error", (error)=>{
    res.status(500).send(error);
  })
});

process.on('uncaughtException', (err)=>{
  console.log('uncaughtException', err)
})

let port = process.env.PORT || 8081;
app.listen(port)
console.log('Gateway (read only) listening on %s', `/ip4/0.0.0.0/tcp/${port}`)