process.on('message', msg => {
  let simulator = msg.data;
  let { initialPrice, modules } = simulator;
  modules.forEach(model => {
    let eachModuleResult = [];
    let preProcessedObj = dataPreprocessing(model);
    console.log(preProcessedObj);
    for (let i = 0; i < preProcessedObj.resultMatrix[0].length; i++) {
      let Calculations = preProcessedObj.content;

      preProcessedObj.strArr.forEach((str, index) => {
        Calculations = Calculations.replace(
          str,
          preProcessedObj.resultMatrix[index][i]
        );
      });
      eachModuleResult.push(eval(Calculations));

      if(Calculations === true){
        
      }
    }

  });
});

function dataPreprocessing(unhandledData) {
  let Matrix = [];
  let { moduleMath, partitionedDataPhases } = unhandledData;
  let { content, metaLists } = moduleMath;
  let strArr = [];

  metaLists.forEach(metaList => {
    let Str = content.slice(metaList['FROM'], metaList['TO']);
    strArr.push(Str);
  });

  let valArr = [];

  partitionedDataPhases.forEach(element => {
    for(let i = 0; i < element.chipDataList.length; i ++){
      element.chipDataList.forEach(each => {
        if(strArr[i] === each.chipName)
        valArr.push(each.value);
      });
    }
    Matrix.push(valArr);
    valArr = [];
  });
  console.log(Matrix);
  let resultMatrix = [];
  for (let j = 0; j < Matrix[0].length; j++) {
    let arr = [];
    for (let i = 0; i < Matrix.length; i++) {
      arr.push(Matrix[i][j]);
    }
    resultMatrix.push(arr);
  }

  metaLists.forEach((metaList, index) => {
    switch (metaList.metaInfo.type) {
      case 'grid':
        break;
      case 'date':
        let matchedArr = partitionedDataPhases.filter(
          matched => matched.timeStamp === metaList.metaInfo.timeStamp
        );
        resultMatrix[index] = resultMatrix[index].map(
          eachValue => matchedArr[0].chipDataList[index].value
        );
        break;
      case 'max':
        let Max = 0;
        for (let i = 0; i < resultMatrix[index].length; i++) {
          resultMatrix[index][i] >= Max
            ? (Max = resultMatrix[index][i])
            : (resultMatrix[index][i] = Max);
        }
        break;
      case 'min':
        let Min = 1e9;
        for (let i = 0; i < resultMatrix[index].length; i++) {
          resultMatrix[index][i] <= Min
            ? (Min = resultMatrix[index][i])
            : (resultMatrix[index][i] = Min);
        }
        break;
      case 'average':
        let Sum = 0;
        for (let i = 0; i < resultMatrix[index].length; i++) {
          Sum += resultMatrix[index][i];
          resultMatrix[index][i] = Sum / (i + 1);
        }
        break;
    }
  });
  return { content, strArr, resultMatrix };
}
