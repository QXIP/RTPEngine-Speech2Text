<img src="https://avatars1.githubusercontent.com/u/956313?v=4&s=50">

# RTP:Engine Speech-to-Text Spooler
Simple RTPEngine Speech-to-Text Spooler using Whisper on CPU(s)

### Usage
This simple tool assumes a fully working RTPEngine WAV recorder setup and relies on its natural metadata removal pattern to pick, process and clear recording files.

-----------

### HEP Usage
Speech Recognition results can be streamed to **HOMER** or **HEPIC** using the **HEP** Type 100 container.

Both transcription and sentiment analysis is available. Transcription is always on, while sentiment analysis is opt-in via ENV var.

Below is an overview of the defaults and ENV vars

```js
/**
 * Environment Variables
 */
const HEP_SERVER = process.env.HEP_SERVER || '127.0.0.1'
const HEP_TRANS = process.env.HEP_TRANS || 'udp4'
const HEP_PORT = process.env.HEP_PORT || 9060
const HEP_PASS = process.env.HEP_PASS || '123'
const HEP_ID = process.env.HEP_ID || 44567
const sentimentEnabled = process.env.SENTIMENT || 'false'
const timeout = process.env.TIMEOUT || 8000
const offset = process.env.OFFSET || 1000
const debug = process.env.DEBUG || false
```


```bash
OFFSET=5000 META_PATH=/var/spool/rtpengine REC_PATH=/path/to/RTPEngine/recording_dir HEP_TRANS='udp4' HEP_SERVER='capture.homer.com' HEP_PORT=9060 node sentiment2hep.mjs
```

* Wait for RTP traffic
* Watch HEP logs fly out!

```
U 172.18.0.2:52593 -> x.x.x.x:9060
HEP3.%...................
.........
.........................
Y.._...
.
..........d.....
..........BINGO.....'6f9db20deb1a9871-ce2fa1345463393b......Um well I got a right now I got this absence of argan oil um for shipping handling in handling Costa fried 9-9 sample of it and um if I want to.
```
* Check your Session for Logs
![image](https://user-images.githubusercontent.com/1423657/31454437-b896f4e6-aeb5-11e7-8535-5d8069e0ef86.png)

