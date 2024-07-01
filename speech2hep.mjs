/*
* Imports
*/
import watcher from '@parcel/watcher'
import * as cp from 'node:child_process'
import * as os from 'node:os'
import fs from 'node:fs'
import hep from './hep.js'

/**
 * Environment Variables
 */
const HEP_SERVER = process.env.HEP_SERVER || '127.0.0.1'
const HEP_TRANS = process.env.HEP_TRANS || 'udp4'
const HEP_PORT = process.env.HEP_PORT || 9060
const HEP_PASS = process.env.HEP_PASS || '123'
const HEP_ID = process.env.HEP_ID || 44567
const debug = process.env.DEBUG || false

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
        if (debug) console.log(`Found ${eventItem.path} has been ${eventItem.type}`)

        if (eventItem.type == 'delete') {
            callModel(eventItem.path)
        }
    }
}

/**
 * Call the Model on a file path
 * @param {string} path 
 */
async function callModel (path) {
    console.log('Triggered Model call from file: ', path)
    if(path.endsWith('.meta')) { 
        let pathArray = path.split('/')
        let fileName = pathArray[pathArray.length - 1]
        var newpath = fileName.replace(/\.meta/i, '-mix.wav');
        newpath = process.env.REC_PATH + '/' + newpath
        try { 
            var callid = fileName.match(/[0-9]?-[0-9A-Za-z%\.]*/)[0]; 
            callid = callid.replace(/\%40/i, '@')
            if (debug) console.log(callid)
        } catch(e) { 
            console.log(e); 
        }
        var stats = fs.statSync(newpath);
        var datenow = stats.mtime ? new Date(stats.mtime).getTime() : new Date().getTime();
        var t_sec = Math.floor( datenow / 1000);
        var u_sec = ( datenow - (t_sec*1000))*1000;
        if (debug) console.log('Looking for Audio File: ', newpath)
        console.log('Executing Model on file with cmd:')
        await new Promise((resolve, reject)=>{
            setTimeout(resolve, process.env.TIMEOUT | 5000)
        })
        console.log('./node_modules/whisper-node/lib/whisper.cpp/main -ml 20 -sow -l auto -m ./node_modules/whisper-node/lib/whisper.cpp/models/ggml-base.en.bin -f ' + newpath)
        let model = cp.spawn('./node_modules/whisper-node/lib/whisper.cpp/main', ['-ml', '20', '-l', 'auto', '-m', './node_modules/whisper-node/lib/whisper.cpp/models/ggml-base.en.bin', '-sow', newpath], {
            shell: true,
            timeout: 180000,
        })
        model.stdout.on('data', handleReceiving)

        model.stderr.on('data', (data) => {
            if (debug) console.log(`MODEL stderr Stream: ${data}`);
          })
        
        model.on('close', (code) => {
            console.log(`Model process closed with code: ${code}`);
            handleModelResult(receivedData, callid, {t_sec, u_sec})
          });   
    }
}

var receivedData = ''
var transcription = []

/**
 * Handle partial data
 * @param {Buffer} buffer 
 */
async function handleReceiving (buffer) {
    let received = buffer.toString()
    // if (debug) console.log('received: ', received)
    receivedData = receivedData + received
}
/**
 * Handle the result of the model
 * @param {Buffer} buffer
 */
async function handleModelResult (data, callid, timeInfo) {
    transcription = data.split(os.EOL)
    for (let i = 0; i < transcription.length; i++) {
        const el = transcription[i];
        if (el.length > 0) {
            if(hep) {
                if (debug) console.log('Sending', el)
                sendHEP(el, callid, timeInfo)
            } else {
                console.error('Unable to send:', el)
            }
        }
    }

    if (debug) console.log(`Call with call-id: ${callid} completed`)
    if (debug) console.log('Waiting for next call')
}

async function sendHEP (el, callid, timeInfo) {
    try {
        var payload = {}
            payload.text = el
            payload.timestamp = new Date();
            payload.CallID = callid;

        var message = {
            rcinfo: {
                type: 'HEP',
                version: 3,
                payload_type: 100,
                time_sec: timeInfo.t_sec,
                time_usec: timeInfo.u_sec,
                ip_family: 2,
                protocol: 17,
                proto_type: 100,
                srcIp: '127.0.0.1',
                dstIp: '127.0.0.1',
                srcPort: 0,
                dstPort: 0,
                captureId: HEP_ID,
                capturePass: 'SPEECH-TO-HEP',
                correlation_id: callid
            },
                payload: JSON.stringify(payload)
        };
        hep.preHep(message);
    } catch (err) {
        console.error('Sender error: ', err)
    }
}


/**
 * The initial program loop
 */
async function main () {
    hep.init({
        HEP_SERVER,
        HEP_PORT,
        HEP_TRANS,
        HEP_PASS,
        HEP_ID,
        debug
    })
    
    console.log('SPEECH TO HEP MODULE - Whisper Transcription Service')
    console.log('HEP sender initialized and ready.')

    console.log('Initiating File Watcher on ', process.env.META_PATH)
    let subscription =  await watcher.subscribe(process.env.META_PATH, handleEvent);
    console.log('and on ', process.env.REC_PATH)
    let subscription2 =  await watcher.subscribe(process.env.REC_PATH, handleEvent);
}

main()