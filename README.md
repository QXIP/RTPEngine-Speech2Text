# rtpengine-stt-spooler
Simple RTPEngine Speech-to-Text Spooler using the [Bing Speech API](https://azure.microsoft.com/en-us/services/cognitive-services)

### Usage
This simple tool assumes a fully working RTPEngine recorder setup and relies on the natural metadata removal pattern to process and clear recording files. A valid Bing Speech-to-Text API key is also required for the demo to work as-is.

### Output
```
nodejs index.js 
File /recording/0827ab93e5636d54-7310c8bc193850b5-mix.wav has been added
File /recording/0827ab93e5636d54-7310c8bc193850b5.meta has been removed
Meta Hit! Seeking Audio at:  /recording/0827ab93e5636d54-7310c8bc193850b5-mix.wav
service started
{ RecognitionStatus: 'Success',
  DisplayText: 'You are currently the only person it\'s conference I\'ll be assisting you with your increase today please be informed that this call is being recorded and monitored.',
  Offset: 1800000,
  Duration: 97700000 }
undefined
File /recording/0827ab93e5636d54-7310c8bc193850b5-mix.wav has been removed
```

#### Todo
* [ ] Use Proc buffers
* [ ] Implement other Speech-to-Text options
