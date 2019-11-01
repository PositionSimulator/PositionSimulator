process.on('message', msg => {
  let simulator = msg.data
  let { initialPrice, modules } = simulator
  let stockPriceArr = modules[0].partitionedDataPhases.map(element => element.stockPrice)
  let moduleRateArr = modules.map(element => element.moduleRate)

  let operation = [], possessed = [], funds = [], fundsWithProfit = []
  let stockPossessed = 0, currentMoney = initialPrice
  let subStringArr = [], oper = [], poss = [], f_Arr = [], fp_Arr = [], RateCalArr = []

  // let returnModule = {
  //   modules:[]
  // }
  modules.forEach(model => {
    let preProcessedModel = dataPreprocessing(model)

    for (let i = 0; i < preProcessedModel.resultMatrix[0].length; i++) {
      let Calculations = preProcessedModel.content
      
      model.moduleMath.metaList.forEach((meta, index) => {
        let subString = Calculations.substring(meta['FROM'], meta['TO'])
        subStringArr.push(subString)
      })
      for(let j = 0; j < model.moduleMath.metaList.length; j++){
        Calculations = Calculations.replace(subStringArr[j],
          preProcessedModel.resultMatrix[j][i]
        )
      }
      console.log("Calculations: ", Calculations)
      calResult = eval(Calculations);
      console.log("calResult: ", calResult)

      if(calResult == true){
        let currentTemp = currentMoney;
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
        if(stockPossessed == 0) {
          oper.push('N');
        }
        else{
          oper.push('S')
          stockPossessed -= 1
          currentMoney += stockPriceArr[i] * 1000
        }
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
    subStringArr = []
    oper = []
    poss = []
    f_Arr = []
    fp_Arr = []
  })

  moduleRateArr = moduleRateArr.map((moduleRate)=>{
    if( /%/.test(moduleRate) ) {
      // console.log(parseInt(moduleRate.slice(0, moduleRate.length), 10) / 100)
      return parseInt(moduleRate.slice(0, moduleRate.length), 10) / 100
      // console.log(moduleRate)
    }
  })
  
  
  for(let i = 0; i < operation[0].length; i++){
    let resultOp = 0;
    for(let j = 0; j < operation.length; j++){
      if(operation[j][i] === 'B'){
        resultOp += 1 * moduleRateArr[j]
      }
      else if(operation[j][i] === 'S'){
        resultOp += (-1) * moduleRateArr[j]
      }
      else{
        resultOp += 0 * moduleRateArr[j]
      }
    }
    if(resultOp > 0){
      let currentTemp = currentMoney;
      currentMoney -= stockPriceArr[i] * 1000
      if(currentMoney <= 0) {
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
    else if(resultOp === 0){
      oper.push('M');
      poss.push(stockPossessed)
      f_Arr.push(currentMoney)
      fp_Arr.push(currentMoney + (stockPossessed * stockPriceArr[i] * 1000 ))
    }
    else if(resultOp < 0){
      if(stockPossessed == 0) {
        oper.push('N');
      }
      else{
        oper.push('S')
        stockPossessed -= 1
        currentMoney += stockPriceArr[i] * 1000
      }
      poss.push(stockPossessed)
      f_Arr.push(currentMoney)
      fp_Arr.push(currentMoney + (stockPossessed * stockPriceArr[i] * 1000 ))
    }
  }
  operation.push(oper)
  possessed.push(poss)
  funds.push(f_Arr)
  fundsWithProfit.push(fp_Arr)
  
  console.log("operation: ", operation)
  console.log("possessed: ", possessed)
  console.log("funds: ", funds)
  console.log("fundsWithProfit: ", fundsWithProfit)

  // for(let i = 0; i < modules; i++){
  //   Object.assign({}, { id: modules[i].id }, operation[i], possessed[i], funds[i], fundsWithProfit[i])
  // }
  process.send('send')
})

function dataPreprocessing(unhandledData) {
  let Matrix = []
  let { moduleMath, partitionedDataPhases, gridTypePastData } = unhandledData
  let { content, metaList } = moduleMath
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
  console.log("content: ", content)
  metaList.forEach(meta => {
    let Str = meta['metaInfo'].chipName
    strArr.push(Str)
  });
  console.log("strArr: ", strArr)
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
  
  console.log("resultMatrix before transformed: \n", resultMatrix)

  metaList.forEach((meta, index) => {
    switch (meta.metaInfo.type) {
      case 'GRID':
        let matchGridPastData = gridTypePastData.find(element=> element.chipName === meta.metaInfo.chipName)
        let gridValArr = matchGridPastData.data.map((each)=> parseInt(each.value, 10))
        let tempArr = gridValArr.concat(resultMatrix[index])
        let newArr = []
        if(meta.metaInfo.rowId === 1) {
          newArr = tempArr.slice(meta.metaInfo.rowId)
          for (let i = 0; i < resultMatrix[index].length; i++) {
            resultMatrix[index][i] = newArr[i]
          }
        }
        else if(meta.metaInfo.rowId === 0) {
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
  console.log("resultMatrix after transformed: ", resultMatrix)
  return { content, strArr, resultMatrix }
}
