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
    }
    console.log('Converted path to ./recording/', newpath)
    console.log('Executing Model with:')
    console.log('./node_modules/whisper-node/lib/whisper.cpp/main -ml 20 -sow -l auto -m ./node_modules/whisper-node/lib/whisper.cpp/models/ggml-base.en.bin -f ./recording/' + newpath)
    cp.exec('./node_modules/whisper-node/lib/whisper.cpp/main -ml 20 -sow -l auto -m ./node_modules/whisper-node/lib/whisper.cpp/models/ggml-base.en.bin -f ./recording/' + newpath, handleModelResult)
}

/**
 * Handle the result of the model
 * @param {string} err 
 * @param {string} stdout 
 * @param {string} stderr 
 */
async function handleModelResult (err, stdout, stderr) {
    console.log('model returned ', err, stdout, stderr)
    console.log('typeof stdout')
    console.log(stdout.split(os.EOL))
    let transcription = stdout.split(os.EOL)
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