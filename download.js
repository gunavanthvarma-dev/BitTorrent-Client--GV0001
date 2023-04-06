'use strict'

const ten = require('net'); 
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./Pieces');
const Queue = require('./Queue');
const fs = require('fs');
const torrentParser = require('./torrent-parser');
const info_torrent = require('./index');

module.exports = (torrent,path) =>{
    
    tracker.getPeers(torrent,peers=>{
        const pieces = new Pieces(torrent);
        const file = fs.openSync(path,'w');
        let pee = peers.filter(pe =>pe.port!=62489);
        pee.forEach(peer=>download(peer,torrent,pieces,file));
    });
};

function download(peer,torrent,pieces,file)
{  
  try 
  {
  if(peer.port!=62489)
  {
    var socket = new ten.Socket();
     socket.on('error',console.log);
     
     socket.connect(peer.port,peer.host,()=>{
         console.log('\nbuilding handshake');
         var flag = false;
         
           flag = socket.write(message.buildHandshake(torrent));
           if(flag)
           {
             console.log("\ndata flushed");
           }
           else
           {
             console.log('\nnot flushed');
           }    
     });
     
     socket.on("close",()=>{console.log("\nsocket closed")});
     socket.on("timeout",()=>{console.log("\nsocket timeout")});
     socket.on("end",()=>{console.log("\nseeder closed")});
 
     var queue = new Queue(torrent);
     onWholeMsg(socket,msg =>msgHandler(msg,socket,pieces,queue,torrent,file));
  }
  
  }catch (error) 
  {
    console.error(error);
  }
    
}

function msgHandler(msg,socket,pieces,queue,torrent,file)
{
    if(isHandshake(msg))
    {
        console.log("\nhandshake received");
        socket.write(message.buildInterested());
    }else
    {
        const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket,pieces,queue);
    if (m.id === 4) haveHandler(socket,pieces,queue,m.payload);
    if (m.id === 5) bitfieldHandler(socket,pieces,queue,m.payload);
    if (m.id === 7) pieceHandler(socket,pieces,queue,torrent,file,m.payload);
    }
}

function isHandshake(msg)
{
   let n1 = msg.readUInt8(0)+49;
   let t1 = msg.length == n1;
   let n2 = msg.toString('utf-8',1,20);
   let st = 'BitTorrent protocol';
   let t2 = (n2==st);
   let info_chk = torrentParser.infoHash(info_torrent.torrent_infoHash).toString('utf-8');
   let n4 = msg.toString('utf-8',28,48)
   let t3 = (info_chk == n4);
   return (t1&&t2&&t3); 

}

function onWholeMsg(socket, callback) {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;
  
    socket.on('data', recvBuf => {
      // calculates the length of a whole message
      const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
      savedBuf = Buffer.concat([savedBuf, recvBuf]);
  
      while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) 
      {
        callback(savedBuf.subarray(0,msgLen()));
        savedBuf = savedBuf.subarray(msgLen());
        handshake = false;
        
      }
    });
  }

  function chokeHandler(socket) 
  { 
     socket.end();
   }

  function unchokeHandler(socket,pieces,queue) 
  { 
       queue.choked = false;
       requestPiece(socket,pieces,queue);
   }
  
  function haveHandler(socket,pieces,queue,payload) 
  {  
     const pieceIndex = payload.readUInt32BE(0);
     const queueEmpty = queue.length === 0;
     queue.queue(pieceIndex);
     if(queueEmpty) requestPiece(socket,pieces,queue);
  }
  
  function bitfieldHandler(socket, pieces, queue, payload) {
    const queueEmpty = (queue.length() === 0);
    payload.forEach((byte, i) => {
      for (let j = 0; j < 8; j++) {
        if (byte % 2) queue.queue(i * 8 + 7 - j);
        byte = Math.floor(byte / 2);
      }
    });
    if (queueEmpty) requestPiece(socket, pieces, queue);
  }
  
  function pieceHandler(socket, pieces, queue, torrent,file, pieceResp) 
  {  
    console.log(pieceResp);
     pieces.addReceived(pieceResp);
     const offset = pieceResp.index* torrent.info['piece length']+pieceResp.begin;
     fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});
     pieces.printPercentDone();
     if(pieces.isDone())
     {
        console.log('DONE!!');
        socket.end();
        try {
            fs.closeSync(file);
        } catch (error) {
            
        }
       
     }else{
        requestPiece(socket,pieces,queue);
     }
  }



  function requestPiece(socket,pieces,queue)
  {
    if (queue.choked) return null;
    let flag = queue.length();

    while (flag) 
    {
      const pieceBlock = queue.deque(); 
      if (pieces.needed(pieceBlock)) {
        
        socket.write(message.buildRequest(pieceBlock));
        pieces.addRequested(pieceBlock);
        break;
      }
    }
  }

