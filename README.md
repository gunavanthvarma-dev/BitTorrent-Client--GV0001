# BitTorrent-Client--GV0001-
This project was undertaken to understand the working of BitTorrent protocol. The protocol implementation has been done using JavaScript.

BitTorrent is a communication protocol for peer-to-peer file sharing (P2P), which enables users to distribute data and electronic files over the Internet in a decentralized manner.
To send or receive files, users use a BitTorrent client on their Internet-connected computer. A BitTorrent client is a computer program that implements the BitTorrent protocol.

How to use:-

1. Download all the files into your local machine.
2. Open your Terminal with the working directory that contains the downloaded files.
3. Run index.js along with the torrent file path as command-line arguement using node js
   ex:- node index.js /*torrent filepath*/
4. The download process starts automatically.

Future Improvements:-

1. Currently only leeching service is available , seeding will be included soon.
2. Currently only single files can be leeched, multiple folders option will be included.
3. If your device is behind a NAT , it will not be possible to estabish P2P connection. This problem will be rectified soon.
4. Interactive UI will be added.

Credits and References:-

1. https://foss.coep.org.in/coepwiki/index.php/Bittorrent_Client#Overview
2. https://en.wikipedia.org/wiki/BitTorrent
3. http://www.kristenwidman.com/blog/33/how-to-write-a-bittorrent-client-part-1/#comment-34530
4. https://wiki.theory.org/BitTorrentSpecification
5. https://roadmap.sh/guides/torrent-client
