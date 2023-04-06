'use strict'

const torrentParser = require('./torrent-parser');
const download = require('./download');

const torrent = torrentParser.open(process.argv[2]);
module.exports.torrent_infoHash = torrent;

/*tracker.getPeers(torrent,peers=>{
console.log("\nlist of peers:",peers);*/

download(torrent,torrent.info.name);