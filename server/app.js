const express = require('express');
const path = require('path');
const http = require('http');

const Websocket = require('ws');

const app = express();
const server = http.createServer(app);
const wsServer = new Websocket.Server({ server });
const {initialize, error, click} = require('./controller.js');

wsServer.on('connection', function (ws, request) {
  ws.on('message', function(message) {
    message = JSON.parse(message);
    console.log(message);
    var payload = {};
    switch (message.msg) {
      case "ERROR":
        payload = error(message);
        return;

      case "INITIALIZE":
        payload = initialize(message);
        break;

      case "NODE_CLICKED":
        payload = click(message);
        break;
    }

    ws.send(JSON.stringify(payload));
  });
  ws.on('error', function(message) {
    console.log("Websocket Error");
  })
})

server.listen(8081, function() {
  console.log('Server listening on port 8081')
})
