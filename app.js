const express = require('express');
const app = express();
const child_process = require('child_process');
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const PORT = 3000
let childQueue = [];
let childNum = 0;

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/compute', (req, res) => {
  const child = child_process.fork('./child.js');
  
  axios.get('http://localhost:8787/simulator')
  .then((res)=>{
    return res.data;
  })
  .catch((err)=>{
    console.log(err);
  })
  .then((data)=>{
    child.send({
      action:'Compute',
      data: data
    });
  })
  // const Package = req.body;
  // console.log(Package);
  // res.send("hihi parker")
  // const child = child_process.fork('./child.js');
  // child.send({ action:'Compute', data: Package })

  child.on('message', msg => {
    if( childNum === -1 ) childNum = 0
    else childNum -= 1
    console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`);
    childQueue.forEach(function(item, index) {
      if (item === msg.id) {
        childQueue.splice(index, 1);
      }
    });
    // if(msg.modules){
    //   res.send({
    //     error: '資料不能為空',
    //     statusCode: 400
    //   })
    // }
    // else{

    // }
    // console.log(msg.operation)
    // console.log(msg.possessed)
    // console.log(msg.funds)
    // console.log(msg.fundsWithProfit)
    res.send('finish')
  })
});

app.listen(PORT, () => {
  console.log(`Server is listening at PORT ${ PORT }...`);
});
