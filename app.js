var express = require('express');
var app = express();
var child_process = require('child_process');
var axios = require('axios');
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/compute', (req, res) => {
  var myPackage = {};
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
  let child = child_process.fork('./child.js');

  child.on('message', msg => {
    console.log(
      `[ PARENT PROCESS ]: get result = ${msg.result} from [ CHILD PROCESS ] ${msg.id}\n`
    );
    childNum -= 1;
    console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`);
    childQueue.forEach(function(item, index) {
      if (item === msg.id) {
        childQueue.splice(index, 1);
      }
    });
  });
});

app.listen(6789, () => {
  console.log('Server is listening at PORT 3000...');
});
