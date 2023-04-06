'use strict'

/*this file contains code related to the initial
udp messages to tracker*/

const dgram = require('dgram');
const Buffer = require("buffer").Buffer;
const urlParse= require('url').parse;
const crypto = require('crypto');
const torrentParser = require('./torrent-parser');
const util = require('./util');

module.exports.getPeers = (torrent,callback)=>
{
    const socket = dgram.createSocket('udp4');
    const url = torrent.announce.toString('utf-8');
    console.log("\nthis is the tracker url:",url);

   udpSend(socket,buildConnReq(),url);

    socket.on('message',response =>{
    
        if(respType(response)==='connect')
        {
            //receiving and parsing connect response
            console.log("\nconnect response received from tracker!!");
            const connResp = parseConnResp(response);
            //sending announce request
            const announceReq = buildAnnounceReq(connResp.connectionId,torrent);
            udpSend(socket,announceReq,url);   
        }else if(respType(response)==='announce')
        {
            console.log("\nreceived announce response from tracker!!!");
            const announceResp = parseAnnounceResp(response);
            //console.log("\npeers list:",announceResp.peers);
            //passing peers to callback function
            callback(announceResp.peers);
        }
    });
};

function udpSend(socket,message,rawUrl,callback=()=>{})
{
    const url = urlParse(rawUrl);
    console.log("\ntracker port:",url.port);
    console.log("\ntracker host:",url.hostname);
    socket.send(message,0,message.length,url.port,url.hostname,callback);
    
}

function buildAnnounceReq(connId,torrent,port=62489)
{
    console.log("\nsending announce request");
    const buf = Buffer.allocUnsafe(98);
    buf.writeBigUInt64BE(connId,0);
    buf.writeUInt32BE(1,8);
    crypto.randomBytes(4).copy(buf,12);
    torrentParser.infoHash(torrent).copy(buf,16);
    util.genId().copy(buf,36);
    Buffer.alloc(8).copy(buf,56);
    torrentParser.size(torrent).copy(buf,64);
    Buffer.alloc(8).copy(buf,72);
    buf.writeUInt32BE(0,80);
    buf.writeUInt32BE(0,80);
    crypto.randomBytes(4).copy(buf,88);
    buf.writeInt32BE(-1,92);
    buf.writeUInt16BE(port,96);

    return buf;
}


function buildConnReq()
{
    //connect request is 16 bytes 8 - connId , 4 - action ,4- transacId
    const buf = Buffer.alloc(16);
   buf.writeUInt32BE(0x417, 0); 
    buf.writeUInt32BE(0x27101980, 4);
    buf.writeUInt32BE(0,8);
    crypto.randomBytes(4).copy(buf,12);

    console.log(`\nconnect request:\nconnection ID:${buf.readBigInt64BE(0)}\naction:${buf.readUInt32BE(8)}\ntransactionId:${buf.readUInt32BE(12)}`);

    return buf;
}

function parseConnResp(resp)
{
    console.log(`connect response:\naction:${resp.readUInt32BE(0)}\ntransactionId:${resp.readUInt32BE(4)}\nconnectionId:${resp.readBigUInt64BE(8)}`);

    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.readBigUInt64BE(8)
    
    }
}

function parseAnnounceResp(resp)
{
    function group(iterable,groupSize)
    {
        let groups = [];
        for(let i=0;i<iterable.length;i+=groupSize)
        {
            groups.push(iterable.slice(i,i+groupSize));
        }
        return groups;
    }

    console.log(`\naction:${resp.readUInt32BE(0)}\ntransactionId:${resp.readUInt32BE(4)}\nleechers:${resp.readUInt32BE(8)}\nseeders:${resp.readUInt32BE(12)}\npeers:`);
    return{
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers:group(resp.slice(20),6).map(address=>{
            var addr = address.slice(0,4).join('.');
            var po = address.readUInt16BE(4);
            console.log(`\nIP address:${addr}\tport:${po}`);
            return{
                ip:addr,
                port:po
            }
        })
    }
}

function respType(resp)
{
    const action = resp.readUInt32BE(0);
    if(action===0)
    return 'connect';
    if(action===1)
    return 'announce';
}





