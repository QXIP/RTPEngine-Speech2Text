/*
HEPIPE-JS
(c) 2015 QXIP BV
For License details, see LICENSE
*/

var HEPjs = require('hep-js');
var dgram = require('dgram');
const net = require('net')
const tls = require('node:tls')

var debug = false; 
var stats = {rcvd: 0, parsed: 0, hepsent: 0, err: 0, heperr: 0 };
var socketUsers = 0;
var socket;

var hep_server;
var hep_port;
var hep_pass;
var hep_id;
var transport

module.exports = {
  init:function(config) {
    hep_server = config.HEP_SERVER;
    hep_port = config.HEP_PORT;
    hep_pass = config.HEP_PASS;
    hep_id = config.HEP_ID;
    transport = config.HEP_TRANS;
    debug = config.debug;
    socket = getSocket(transport); 
  },
  preHep:function(message) {
    var rcinfo = message.rcinfo;
    var msg = message.payload;
    if (rcinfo.correlation_id == null || !(rcinfo.correlation_id.toString().length)) return;
    if (debug) console.log(msg);
    stats.rcvd++;
    if (!rcinfo.hep_id){
      rcinfo.hep_id = hep_id;
    }
    if (!rcinfo.hep_pass){
      rcinfo.hep_pass = hep_pass;
    }
    if (!rcinfo.time_sec){
	    var hrTime = process.hrtime();
	    var datenow = new Date().getTime();
	    rcinfo.time_sec = Math.floor( datenow / 1000);
	    rcinfo.time_usec = (datenow - (rcinfo.time_sec*1000))*1000;
    }
    // force sequence for split second sequences
    rcinfo.time_usec = new Date().getTime() - (rcinfo.time_sec*1000) + 1;
    if (debug) console.log(rcinfo);
    sendHEP3(msg, rcinfo);	
  },
  ping: function(){ return '200 OK'; },
  getStats:function() {
    return stats;
  }
};

var getSocket = function (type) {
  if(debug)console.log('Socket Type =', type);
  if (undefined === socket && type === 'udp4') {
      socket = dgram.createSocket(type);
  } else if (type === 'tcp') {
    socket = net.connect(hep_port, hep_server)
  } else if (type === 'tls') {
  socket = tls.connect(hep_port, hep_server)
  console.log('TLS Socket', socket)
}

  var socketErrorHandler = (err)=>{
    console.log(err);
    throw(err);
  }

  socket.on('error', socketErrorHandler);
  /**
   * Handles socket's 'close' event,
   * recover socket in case of unplanned closing.
   */
  var socketCloseHandler = function () {
      if (socketUsers > 0) {
          socket = undefined;
          --socketUsers;
          getSocket(type);
      }
  };

  socket.on('close', socketCloseHandler);


  return socket;
}

var sendHEP3 = function(msg,rcinfo) {
  if (rcinfo && msg) {
    try {
      if (debug) console.log('Sending HEP3 Packet to '+ hep_server + ':' + hep_port + '...');
      if (! typeof msg === 'string' || ! msg instanceof String) msg = JSON.stringify(msg);
      var hep_message = HEPjs.encapsulate(msg.toString(),rcinfo);
      stats.parsed++;
      if (hep_message && hep_message.length) {
        if(socket && transport == 'udp4') {
          socket.send(hep_message, 0, hep_message.length, hep_port, hep_server, function(err) {
           stats.hepsent++;
           });
        } else {
          socket.write(hep_message, function(err) {
            if(!err){
              stats.hepsent++;
            } else {
              if(debug) console.log('tcp socket err: ', err);
              stats.err++;
            }
  				});
        }
      } else { console.log('HEP Parsing error!'); stats.heperr++; }
    } 
    catch (e) {
      console.log('HEP3 Error sending!');
      console.log(e);
      stats.heperr++;
    }
  }
}
