/* Basic Recording Spooler for RTPENGINE */
/* (C) 2017 QXIP BV */

const fs = require('fs');
const chokidar = require('chokidar');
const whisper = require('whisper-node');
const watcher = chokidar.watch('/recording', {ignored: /^\./, persistent: true });
  watcher
    .on('error', function(error) {console.error('Error happened', error);})
    .on('add', function(path) {console.log('File', path, 'has been added');  })
    .on('unlink', async function(path) {console.log('File', path, 'has been removed');
	   if(path.endsWith('.meta')){ 
	      var newpath = path.replace(/\.meta/i, '-mix.wav');
	      console.log('Meta Hit! Seeking Audio at: ',newpath);
	      const transcript = await whisper(newpath);
	      console.log('Meta Hit! Seeking Audio at: ',transcript);
	   }
  });
