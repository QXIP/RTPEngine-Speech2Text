/*
* Imports
*/
import * as watcher from '@parcel/watcher'
import * as cp from 'node:child_process'
import * as os from 'node:os'


/**
 * Handle File Change Events
 * @param {*} err 
 * @param {*} ev 
 */
async function handleEvent (err, ev) {
    if (err) {
        console.log('catching err', err)
    }

    for (let i = 0; i < ev.length; i++) {
        const eventItem = ev[i];
        console.log(`Found ${eventItem.path} has been ${eventItem.type}`)

        if (eventItem.type == 'delete') {
            callModel(eventItem.path)
        }
    }
}

/**
 * Call the Model on a string
 * @param {string} path 
 */
async function callModel (path) {
    console.log('Calling Model from ', path)
    if(path.endsWith('.meta')) { 
        let pathArray = path.split('/')
        let fileName = pathArray[pathArray.length - 1]
        var newpath = fileName.replace(/\.meta/i, '-mix.wav');
        newpath = process.env.REC_PATH + '/' + newpath
        try { 
            var xcid = path.match(/\/([^\/]+)\/?\.meta$/)[1].split('-')[0]; 
        } catch(e) { 
            console.log(e); 
        }
        console.log('Converted path to ', newpath)
        console.log('Executing Model with:')
        console.log('./node_modules/whisper-node/lib/whisper.cpp/main -ml 20 -sow -l auto -m ./node_modules/whisper-node/lib/whisper.cpp/models/ggml-base.en.bin -f ' + newpath)
        let model = cp.spawn('./node_modules/whisper-node/lib/whisper.cpp/main', ['-ml', '20', '-l', 'auto', '-m', './node_modules/whisper-node/lib/whisper.cpp/models/ggml-base.en.bin', '-sow', newpath])
        model.stdout.on('data', handleReceiving)

        model.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          })
        
        model.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            handleModelResult(receivedData)
          });   
    }
}

var receivedData = ''
var transcription = []

async function handleReceiving (buffer) {
    let received = buffer.toString()
    console.log('received: ', received)
    receivedData = receivedData + received
}
/**
 * Handle the result of the model
 * @param {Buffer} buffer
 */
async function handleModelResult (data) {
    transcription = data.split(os.EOL)
    for (let i = 0; i < transcription.length; i++) {
        const el = transcription[i];
        if (el.length > 0) {
            console.log('Processing', el)
        }
    }
}


/**
 * The initial program loop
 */
async function main () {
    console.log('Initiating Watcher')
    let subscription =  await watcher.subscribe(process.env.META_PATH, handleEvent);
}

main()