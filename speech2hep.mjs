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
const timeout = process.env.TIMEOUT || 8000
const debug = process.env.DEBUG || false

/**
 * Globals
 */

/**
 * @param {string[]} calls An array of directions to be processed
 */
var calls = new Map()

/**
 * Object to pass along time in seconds and microseconds for HEP
 * @typedef {{datenow: integer, t_sec: integer, u_sec: integer}} timeInfo 
 */

/**
 * Handle Watcher File Change Events
 * @param {string} err Error if the File Change Event Fails / Watcher Fails
 * @param {object} ev File Change Event emitted by File Watcher
 * @param {string} ev.path Full Path to file that triggered the event
 * @param {string} ev.type Type of Event ('create', 'update', 'delete' etc)
 */
async function handleEvent (err, ev) {
    if (err) {
        console.log('catching err', err)
    }

    for (let i = 0; i < ev.length; i++) {
        const eventItem = ev[i];
        if (debug) console.log(`Found ${eventItem.path} has been ${eventItem.type}d`)

        if (eventItem.type == 'create') {
            if (eventItem.path.match(/.*\.meta/)) {
                let callid = eventItem.path.match(/[0-9]+-[0-9A-Za-z%\.]*[^.meta]/)[0];
                callid = callid.replace(/\%40/i, '@')
                if (debug) console.log('New call detected with callid: ', callid)
            }
        }

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
            var callid = fileName.match(/[0-9]+-[0-9A-Za-z%\.]*/)[0]; 
            callid = callid.replace(/\%40/i, '@')
            if (debug) console.log(callid)
        } catch(err) { 
            console.log('Caught fileName error: ', err); 
        }
        try {
            var stats = fs.statSync(newpath);
            var datenow = stats.mtime ? new Date(stats.mtime).getTime() : new Date().getTime();
            datenow -= timeout
            var t_sec = Math.floor( datenow / 1000);
            var u_sec = ( datenow - (t_sec*1000))*1000;
        } catch (err) {
            console.log('Caught statSync error: ', err)
        }
        
        if (debug) console.log('Looking for Audio File: ', newpath)
        console.log('Executing Model on file with cmd:')
        /* Wait for a period, as RTPEngine may not have finished writing the file */
        await new Promise((resolve, reject)=>{
            setTimeout(resolve, timeout)
        })
        /* Print command for confirmation */
        console.log('./node_modules/whisper-node/lib/whisper.cpp/main -pp -tdrz -l auto -m ./node_modules/whisper-node/lib/whisper.cpp/models/ggml-small.en-tdrz.bin -f ' + newpath)
        let model = cp.spawn('./node_modules/whisper-node/lib/whisper.cpp/main', ['-l', 'auto', '-m', './node_modules/whisper-node/lib/whisper.cpp/models/ggml-small.en-tdrz.bin', '-pp', '-tdrz', newpath], {
            shell: true,
            timeout: 180000,
        })
        model.stdout.on('data', handleReceiving.bind(null, callid, {datenow, t_sec, u_sec}))

        model.stderr.on('data', (data) => {
            if (debug) console.log(`MODEL stderr Stream: ${data}`);
          })
        
        model.on('close', (code) => {
            console.log(`Model process closed with code: ${code}`);
            handleModelResult(callid)
          });   
    }
}

/**
 * Handle Data as it comes in from the Model
 * @param {string} callid 
 * @param {timeInfo} timeInfo
 * @param {Buffer} buffer 
 */
async function handleReceiving (callid, timeInfo, buffer) {
    let received = buffer.toString()
    let direction = 0
    if (calls.has(callid)) {
        direction = calls.get(callid)
    } else {
        calls.set(callid, 0)
    }
    if (received.length > 0) {
        let utterArray = received.split(os.EOL)
        for (let i = 0; i < utterArray.length; i++) {
            const el = utterArray[i];
            if (el.length > 1) {
                if (debug) console.log('Processing :', el)
                let timeUtterance = el.match(/[0-9]*:[0-9]*:[0-9]*.[0-9]*/)[0]
                let text = el.match(/\](?<text>.*) (\[SPEAKER_TURN\])*/).groups.text
                let turn = false
                if (el.match(/\[SPEAKER_TURN\]?/)) {
                    turn = true
                    direction = direction == 0 ? 1 : 0
                    calls.set(callid, direction)
                } else { 
                    turn = false
                }
                let diff = getSeconds(timeUtterance)
                timeInfo.datenow += diff
                timeInfo.t_sec = Math.floor( timeInfo.datenow / 1000);
                timeInfo.u_sec = ( timeInfo.datenow - (timeInfo.t_sec*1000))*1000;
                if (debug) console.log('Sending :', text)
                sendHEP(text.trim(), callid, timeInfo, direction)
            }

        }
    }
}

/**
 * Get Seconds diff for HEP timestamp
 * @param {string} timestampString 
 * @returns {integer} Time since 00:00:00 in Seconds
 */
function getSeconds (timestampString) {
    let total = 0

    let hours = Number(timestampString.slice(0, 2))
    console.log('hours:', hours)
    total += hours * 60 * 60 
    console.log('total', total)

    let minutes = Number(timestampString.slice(3, 5))
    console.log('minutes', minutes)
    total += minutes * 60
    console.log('total', total)

    let seconds = Number(timestampString.slice(6, 8))
    console.log('seconds', seconds)
    total += seconds 
    console.log('total', total)
    // ignore micros for now
    return total
}


/**
 * Remove call record from map
 * @param {string} callid
 */
async function handleModelResult (callid) {
    if (debug) console.log(`Call with call-id: ${callid} completed`)
    calls.delete(callid)
    if (debug) console.log('Waiting for next call')
}

/**
 * Prepare and send HEP packet
 * @param {string} text Transcribed words
 * @param {string} callid Used for correlation to SIP signalling
 * @param {timeInfo} timeInfo 
 * @param {integer} direction Speaker directionality (e.g. 0|1 )
 */
async function sendHEP (text, callid, timeInfo, direction) {
    try {
        let payload = text
        let srcPort = 0
        let dstPort = 1

        if (direction == 0) {
            srcPort = 0
            dstPort = 1
        } else {
            srcPort = 1
            dstPort = 0
        }
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
                srcPort: srcPort,
                dstPort: dstPort,
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