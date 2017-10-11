<img src="https://avatars1.githubusercontent.com/u/956313?v=4&s=50">

# RTP:Engine Speech-to-Text Spooler
Simple RTPEngine Speech-to-Text Spooler using the [Bing Speech API](https://azure.microsoft.com/en-us/services/cognitive-services)

### Usage
This simple tool assumes a fully working RTPEngine WAV recorder setup and relies on its natural metadata removal pattern to pick, process and clear recording files. A valid Bing Speech-to-Text API key is also required for the demo to work as-is.

### Debug Usage
```
nodejs index.js 
File /recording/0827ab93e5636d54-7310c8bc193850b5-mix.wav has been added
File /recording/0827ab93e5636d54-7310c8bc193850b5.meta has been removed
Meta Hit! Seeking Audio at:  /recording/0827ab93e5636d54-7310c8bc193850b5-mix.wav
service started
{ RecognitionStatus: 'Success',
  DisplayText: 'You are currently the only person in this conference I\'ll be assisting you with your increase today please be informed that this call is being recorded and monitored.',
  Offset: 1800000,
  Duration: 97700000 }
File /recording/0827ab93e5636d54-7310c8bc193850b5-mix.wav has been removed
```

-----------

### HEP Usage
Speech Recognition results can be streamed to **HOMER** or **HEPIC** using the **HEP** Type 100 container.

* Fill in the API and HEP Server details in ```config.js```
* Run the HEP-enabled version ```nodejs speech2hep.js```
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
<img src="https://i.imgur.com/FT9lngi.gif">

#### Todo
* [ ] Use Proc buffer samples in real-time
* [ ] Integrate more Speech-to-Text APIs
