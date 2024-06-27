const chokidar = require('chokidar');
const fs = require('fs');
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

var config = require('./config.js');

if (config.hep_config.debug) {
	console.log(config)
}

if (config.hep_config) {
  var hep_client = require('./hep.js');
  hep_client.init(config.hep_config);
  console.log('HEP Client ready!');
}

const watcher = chokidar.watch(config.meta_path, {ignored: /^\./, persistent: true });

watcher
    .on('error', function(error) {
		console.error('Error happened', error);
	})
    .on('add', function(path) {
		console.log('File', path, 'has been added');  
	})
    // .on('change', function(path) {console.log('File', path, 'has been changed'); })
    .on('unlink', async function(path) {
		console.log('File', path, 'has been removed');
		if(path.endsWith('.meta')) { 
			let pathArray = path.split('/')
			let fileName = pathArray[pathArray.length - 1]
			var newpath = fileName.replace(/\.meta/i, '-mix.wav');
			newpath = config.rec_path + '/' + newpath
			try { 
				var xcid = path.match(/\/([^\/]+)\/?\.meta$/)[1].split('-')[0]; 
			} catch(e) { 
				console.log(e); 
			}
			// Get file timestamp, detection is delayed
			var stats = fs.statSync(newpath);
			var datenow = stats.mtime ? new Date(stats.mtime).getTime() : new Date().getTime();
			var t_sec = Math.floor( datenow / 1000);
			var u_sec = ( datenow - (t_sec*1000))*1000;
			console.log('Meta Hit! Seeking Audio at: ', newpath);

			const transcript = await whisper(newpath, options);
			if (transcript) {
				for (let index = 0; index < transcript.length; index++) {
					const utterance = transcript[index];
					if (hep_client){
						console.log('Sending HEP...');
						try {
							var payload = utterance;
								payload.timestamp = new Date();
								payload.CallID = xcid;
	
							var message = {
								rcinfo: {
									type: 'HEP',
									version: 3,
									payload_type: 100,
									time_sec: t_sec,
									time_usec: u_sec,
									ip_family: 2,
									protocol: 17,
									proto_type: 100,
									srcIp: '127.0.0.1',
									dstIp: '127.0.0.1',
									srcPort: 0,
									dstPort: 0,
									captureId: 2999,
									capturePass: 'SPEECH-TO-HEP',
									correlation_id: xcid
								},
									payload: JSON.stringify(payload)
							};
							hep_client.preHep(message);
						} catch(e) { 
							console.log(e); 
						}
					}
				}
			}
		}
    });

var exit = false;
process.on('SIGINT', function() {
  console.log();
  if (exit) {
    console.log("Exiting...");
    process.exit();
  } else {
    console.log("Press CTRL-C within 2 seconds to Exit...");
    exit = true;
    setTimeout(function () {
      exit = false;
    }, 2000);
  }
});
