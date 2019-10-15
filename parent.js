var child_process = require('child_process');
var axios = require('axios');
var http = require('http');


let childQueue = [];
let childNum = 0;

Server = http.createServer();

Server.on('request', (req, res) => {
    if (req.url === '/') {
        console.log('[ ROUTE ] "/" was been visited... ')
        res.writeHead(200);
        res.end(`Hello, I am [ PARENT PROCESS ] server, my process id is: ${process.pid}, my port is 8000\n`);
    }
    else if (req.url === '/compute') {
        console.log('[ ROUTE ] "/compute" was been visited...\n ')
        // ================================================================================================================
        // 寫法 B : 需要計算再建CHILD PROCESS 
        let child = child_process.fork('./child.js')
        child.send({
            action: 'compute',
            value: 1000000000
        })
        childNum += 1;
        childQueue.push(child.pid);
        console.log(`[ CHILD PROCESS ] ${child.pid} is computing now...\n`);
        console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`)
        child.on('message', (msg) => {
            console.log(`[ PARENT PROCESS ]: get result = ${msg.result} from [ CHILD PROCESS ] ${msg.id}\n`);
            console.log(`Run time: ${msg.time}`)
            childNum -= 1;
            console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`)
            childQueue.forEach(function (item, index) {
                if (item === msg.id) {
                    childQueue.splice(index, 1);
                }
            })
            console.log(`[ CHILD PROCESS QUEUE ] : ${childQueue}\n`)
            res.writeHead(200);
            res.end(`answer: ${msg.result}`);
        })
        console.log(`[ PARENT PROCESS ] is still running ...\n`);
    }
    else if (req.url === '/dog') {
        console.log('[ ROUTE ] "/dog" was visited... \n')
        axios.get('https://dog.ceo/api/breeds/image/random')
            .then((response) => {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(response.data));
                console.log(JSON.stringify(response.data));
                res.end();
            })
    }
})

Server.listen(8000, () => {
    console.log(`[ PARENT PROCESS ${process.pid} ] is running server at port 8000\n`);
})

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
