/* Basic Recording Spooler for RTPENGINE */
/* (C) 2017 QXIP BV */

const fs = require('fs');
const chokidar = require('chokidar');
const whisper = require('whisper-node').whisper;
const options = {
	modelName: "base.en",       // default
	// modelPath: "/custom/path/to/model.bin", // use model in a custom directory (cannot use along with 'modelName')
	whisperOptions: {
	  language: 'auto',          // default (use 'auto' for auto detect)
	  gen_file_txt: false,      // outputs .txt file
	  gen_file_subtitle: false, // outputs .srt file
	  gen_file_vtt: false,      // outputs .vtt file
	  word_timestamps: false,     // timestamp for every word
	  timestamp_size: 0      // cannot use along with word_timestamps:true
	}
  }
console.log('Starting watcher', whisper)
const watcher = chokidar.watch(__dirname + '/recording', {ignored: /^\./, persistent: true });
watcher
.on('error', function(error) {console.error('Error happened', error);})
.on('add', function(path) {console.log('File', path, 'has been added');  })
.on('unlink', async function(path) {
	console.log('File', path, 'has been removed');
	if(path.endsWith('.meta')){ 
		var newpath = path.replace(/\.meta/i, '-mix.wav');
		console.log('Meta Hit! Seeking Audio at: ',newpath);
		const transcript = await whisper(newpath, options);
		console.log('Meta Hit! Transcript: ', transcript);
	}
});
