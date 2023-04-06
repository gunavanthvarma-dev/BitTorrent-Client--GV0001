'use strict'

const  fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

const  BN  = require('bn.js');

module.exports.BLOCK_LEN = Math.pow(2,14);

module.exports.pieceLen = (torrent,pieceIndex)=>
{
  
   const bff = this.size(torrent);
   const totalLength = Number((bff.readBigUInt64BE(0).toString())); //totallength is NAN
    const pieceLength = torrent.info['piece length'];
  
    const lastPieceLength = totalLength % pieceLength;
    const lastPieceIndex = Math.floor(totalLength / pieceLength);
  
    return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
}

module.exports.blocksPerPiece = (torrent, pieceIndex) => {
    const pieceLength = this.pieceLen(torrent, pieceIndex);
    return Math.ceil(pieceLength / this.BLOCK_LEN);
  };
  
  module.exports.blockLen = (torrent, pieceIndex, blockIndex) => {
    const pieceLength = this.pieceLen(torrent, pieceIndex);
  
    const lastPieceLength = pieceLength % this.BLOCK_LEN;
    const lastPieceIndex = Math.floor(pieceLength / this.BLOCK_LEN);
  
    return blockIndex === lastPieceIndex ? lastPieceLength : this.BLOCK_LEN;
  };

module.exports.open = (filepath)=>
{ 
    console.log(bencode.decode(fs.readFileSync(filepath)));//inside a torrent file
    return bencode.decode(fs.readFileSync(filepath));
};

module.exports.size = torrent =>{
    const size = torrent.info.files?torrent.info.files.map(file=>file.length).reduce((a,b)=>a+b):torrent.info.length;

    var c = new BN(size);
    return c.toBuffer('big',8);

};

module.exports.infoHash = torrent =>{
const info = bencode.encode(torrent.info);
return crypto.createHash('sha1').update(info).digest();
};



