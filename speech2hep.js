const chokidar = require('chokidar');
const fs = require('fs');
const whisper = require('whisper-node');

var config = require('./config.js');
if (config.hep_config) {
  var hep_client = require('./hep.js');
  hep_client.init(config.hep_config);
  console.log('HEP Client ready!');
}

const watcher = chokidar.watch('/recording', {ignored: /^\./, persistent: true });
watcher
    .on('error', function(error) {console.error('Error happened', error);})
    .on('add', function(path) {console.log('File', path, 'has been added');  })
    // .on('change', function(path) {console.log('File', path, 'has been changed'); })
    .on('unlink', async function(path) {console.log('File', path, 'has been removed');
	   if(path.endsWith('.meta')){ 
		var newpath = path.replace(/\.meta/i, '-mix.wav');
		try { var xcid = path.match(/\/([^\/]+)\/?\.meta$/)[1].split('-')[0]; } catch(e) { console.log(e); }
		// Get file timestamp, detection is delayed
		var stats = fs.statSync(newpath);
		var datenow = stats.mtime ? new Date(stats.mtime).getTime() : new Date().getTime();
		var t_sec = Math.floor( datenow / 1000);
		var u_sec = ( datenow - (t_sec*1000))*1000;
		console.log('Meta Hit! Seeking Audio at: ',newpath);

		const transcript = await whisper(newpath);
		    if (transcript) {
				  console.log('Response',e);
				  if (hep_client){
				    console.log('Sending HEP...');
				    try {
				    var payload = { Speech: transcript };
				    	payload.timestamp = new Date();
				    	payload.CallID = xcid;
				    if ((e.DisplayText.length - e.DisplayText.replace(RegExp('*'), '').length) > 1){
					payload.profanity = true;
				    }

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
				    } catch(e) { console.log(e); }
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
