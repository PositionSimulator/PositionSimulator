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


app.post('/compute', (req, res) => {
  // let isError = false
  // const child = child_process.fork('./child.js');
  
  // axios.get('http://localhost:8787/simulator')
  // .then((res)=>{
  //   return res.data;
  // })
  // .catch((err)=>{
  //   console.log(err);
  // })
  // .then((data)=>{
  //   isError = valueChecked(data)
    
  //   if(!isError){
  //     child.send({
  //       action:'Compute',
  //       data: data
  //     });  
  //     childNum += 1;
  //     console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`);
  //     child.on('message', msg => {
  //       childNum -= 1
  //       if(childNum === -1) childNum = 0
  //       console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`);
  //       childQueue.forEach(function(item, index) {
  //         if (item === msg.id) {
  //           childQueue.splice(index, 1);
  //         }
  //       });

  //       res.json({
  //         error: '',
  //         statusCode: 200,
  //         modules: msg.modules
  //       })
  //     })
  //   }
  //   else{
  //     console.log("error!")
  //     res.json({
  //       error: '資料有null或undefined !',
  //       statusCode: 400,
  //       modules: null
  //     })
  //   }
  // })

  const Package = req.body;
  isError = valueChecked(Package)

  if(!isError){
    const child = child_process.fork('./child.js');
    child.send({ action:'Compute', data: Package })
    childNum += 1
    console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`);
    child.on('message', msg => {
      childNum -= 1
      if(childNum === -1) childNum = 0

      console.log(`current number of [ CHILD PROCESS ] is: ${childNum}\n`);
      childQueue.forEach(function(item, index) {
        if (item === msg.id) {
          childQueue.splice(index, 1);
        }
      });

      res.json({
        error: '',
        statusCode: 200,
        modules: msg.modules
      })
    })
  }
  else{
    res.json({
      error: '資料有null或undefined !',
      statusCode: 400,
      modules: null
    })
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening at PORT ${ PORT }...`);
});

function valueChecked(obj){
  let errOccur = false
  obj.modules.forEach((module)=>{
    module.partitionedDataPhases.forEach((data)=>{
    if(data.stockPrice === undefined || data.stockPrice === null) {
      errOccur = true
      return
    }
    if(data.timeStamp === undefined || data.timeStamp === null){
      errOccur = true
      return
    }
    data.chipDataList.forEach((each)=>{
      // console.log(each.value)
      if(each.value === undefined || each.value === null){
        errOccur = true
        return
      }
    })
    if(errOccur) return
  })
  if(errOccur) return
})
  return errOccur
}