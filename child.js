process.on('message', msg => {
  let simulator = msg.data
  let { initialPrice, modules } = simulator
  let operation = [], possessed = [], funds = [], fundsWithProfit = []
  let stockPossessed, currentMoney = 0
  let preProcessedModel = {}

  modules.forEach(model => {
    let stockPriceArr = model.partitionedDataPhases.map(element => element.stockPrice)
    preProcessedModel = dataPreprocessing(model)
    currentMoney = initialPrice
    stockPossessed = 0
    let subArr = []
    let oper = []
    let poss = []
    let f_Arr = []
    let fp_Arr = []
    
    for (let i = 0; i < preProcessedModel.resultMatrix.length; i++) {
      let Calculations = preProcessedModel.content
      
      model.moduleMath.metaList.forEach((meta, index) => {
        let sub = Calculations.substring(meta['FROM'], meta['TO'])
        subArr.push(sub)
      })
      for(let j = 0; j < model.moduleMath.metaList.length; j++){
        Calculations = Calculations.replace(subArr[j],
          preProcessedModel.resultMatrix[j][i]
        )
      }
      // console.log(Calculations)
      calResult = eval(Calculations);
      // console.log(calResult)
      if(calResult == true){
        currentTemp = currentMoney;
        currentMoney -= stockPriceArr[i] * 1000
        if(currentMoney<= 0) {
          oper.push('O');
          currentMoney = currentTemp
        }
        else{
          oper.push('B');
          stockPossessed += 1;
        }
          poss.push(stockPossessed)
          f_Arr.push(currentMoney)
          fp_Arr.push(currentMoney + (stockPossessed * stockPriceArr[i] * 1000 ))
      }
      else{
        oper.push('S')
        stockPossessed -= 1
        currentMoney += stockPriceArr[i] * 1000
        poss.push(stockPossessed)
        f_Arr.push(currentMoney)
        fp_Arr.push(currentMoney + (stockPossessed * stockPriceArr[i] * 1000 ))
      }
    }
    operation.push(oper)
    possessed.push(poss)
    funds.push(f_Arr)
    fundsWithProfit.push(fp_Arr)
    
    currentMoney = initialPrice
    stockPossessed = 0
  })

  for(let i = 0; i < modules; i++){
    Object.assign({}, { id: modules[i].id }, operation[i], possessed[i], funds[i], fundsWithProfit[i])
  }
  process.send({
    operation,
    possessed,
    funds,
    fundsWithProfit
  })
})

function dataPreprocessing(unhandledData) {
  let Matrix = []
  let { moduleMath, partitionedDataPhases, gridTypePastData } = unhandledData
  let { content, metaList } = moduleMath
  let gridTypePastDataValue = []
  let strArr = []
  let valArr = []
  let resultMatrix = []
  
  if( /%/.test(content) ) {
    let { index:percentageIndex } = content.match(/%/)
    let operatorIndex = 0
    
      operatorIndex = content.indexOf('>')
      if(operatorIndex != -1 ){
        if(content.indexOf('>=') != -1){
          operatorIndex += 1
        }
      }
      else{
        operatorIndex = content.indexOf('<')
        if(operatorIndex != -1){
          if(content.indexOf('<=') != -1){
            operatorIndex += 1
          }
        }
        else{
          operatorIndex = content.indexOf('=')
        }
      }
      let subString = content.substr(0, operatorIndex + 1)
      let covertNumber = parseFloat(content.slice(operatorIndex + 1, percentageIndex)) / 100
      let newContent = subString + covertNumber.toString()
      content = newContent
  }

  metaList.forEach(meta => {
    let Str = meta['metaInfo'].name
    strArr.push(Str)
  });

  partitionedDataPhases.forEach(element => {
    for(let i = 0; i < element.chipDataList.length; i ++){
      let foundChipData = element.chipDataList.find((chipData)=>{
        return chipData.chipName === strArr[i]  
      })
      valArr.push(foundChipData.value)
    }
    Matrix.push(valArr)
    valArr = []
  });

  for (let j = 0; j < Matrix[0].length; j++) {
    let arr = []
    for (let i = 0; i < Matrix.length; i++) {
      arr.push(parseInt(Matrix[i][j], 10));
    }
    resultMatrix.push(arr)
  }
  
  console.log("resultMatrix: \n", resultMatrix)

  metaList.forEach((meta, index) => {
    switch (meta.metaInfo.type) {
      case 'GRID':
        let matchGridData = gridTypePastData.find(element=> element.chipName === meta.metaInfo.name)
        matchGridValArr = matchGridData.data.map((each)=> parseInt(each.value, 10))
        let tempArr = matchGridValArr.concat(resultMatrix[index])
        let newArr = []
        if(meta.metaInfo.columnId === 1) newArr = tempArr.slice(meta.metaInfo.columnId)
        else if(meta.metaInfo.columnId === 0 || 
        meta.metaInfo.columnId === 2) 
        newArr = tempArr.slice()
        for (let i = 0; i < resultMatrix[index].length; i++) {
          resultMatrix[index][i] = newArr[i]
        }
        break;
      case 'DATE':
        let matchedArr = partitionedDataPhases.filter(
          matched => matched.timeStamp === meta.metaInfo.timeStamp
        )
        resultMatrix[index] = resultMatrix[index].map(
          eachValue => matchedArr[0].chipDataList[index].value
        )
        break;
      case 'MAX':
        let Max = 0
        for (let i = 0; i < resultMatrix[index].length; i++) {
          resultMatrix[index][i] >= Max
            ? (Max = resultMatrix[index][i])
            : (resultMatrix[index][i] = Max)
        }
        break;
      case 'MIN':
        let Min = 1e9
        for (let i = 0; i < resultMatrix[index].length; i++) {
          resultMatrix[index][i] <= Min
            ? (Min = resultMatrix[index][i])
            : (resultMatrix[index][i] = Min)
        }
        break;
      case 'AVERAGE':
        let Sum = 0;
        for (let i = 0; i < resultMatrix[index].length; i++) {
          Sum += resultMatrix[index][i]
          resultMatrix[index][i] = Math.floor(Sum / (i + 1))
        }
        break;
    }
  });
  console.log(resultMatrix)
  return { content, strArr, resultMatrix }
}
