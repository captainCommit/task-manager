const express = require('express'); // using express
const socketIO = require('socket.io');
const http = require('http')
const port = 3001// setting the port
let app = express();
let server = http.createServer(app)
let io = socketIO(server,{
    cors : {
        origin : "*"
    }
})
 
server.listen(port,"127.0.0.1",(req,res)=>{
    console.log('Socket server operating on port '+port)
});

module.exports = io