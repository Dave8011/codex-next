function 
 importAndFilterData() {
  try {
    const showFormulas = false; // ✅ Toggle this to true when you want formulas

    // 📄 Spreadsheet IDs
    const outputFileId = '1AUWumEalEdDyS5UTeWBvdMr5gQcr8Ke3YLwsGvtzEcs';
    const sourceFileId = '1XJJUT2KUSZH04zu1ErPYY1_-3UV_qoWCKmUHqVtv_sI';

    // 📂 Sheets
    const outputSpreadsheet = SpreadsheetApp.openById(outputFileId);
    const outputSheet = outputSpreadsheet.getSheetByName('Output_Data');
    const sourceSheet = SpreadsheetApp.openById(sourceFileId).getSheetByName('cal-transpo');
    const fbaOrdersSheet = outputSpreadsheet.getSheetByName('FBA Orders');
    const helperSheet = outputSpreadsheet.getSheetByName('Helper');

    if (!outputSheet || !sourceSheet || !fbaOrdersSheet || !helperSheet) {
      Logger.log("❌ One or more sheets not found!");
      return;
    }

    // 🔄 Clear previous data
    outputSheet.clear();

    // 🧾 Header row
    const headers = [
      'Bulk Sku', 'Mastersku', 'Main SKU', 'Product Name',
      'Pack Size', 'Pack of', 'In_Transit', 'Current FBA Stock',
      'Current Bulk Inhouse Stock in Gram', 'Current Processed Inhouse Stock in Gram',
      'Units to be sent to fc as per sale', 'to be sent - stock in fc',
      'Units Possible with Current Pack Size', 'Total Order Qty 3M',
      'Weightage as per sale', 'Bulk distribution as per sale', 'unit distribution as per sale',
      'Booking qty', 'Fnsku', 'Product id', 'MPSKU'
    ];
    outputSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // 📥 Source data
    const skuValues = sourceSheet.getRange('B2:B').getValues();
    const statusValues = sourceSheet.getRange('H2:H').getValues();
    const productNames = sourceSheet.getRange('A2:A').getValues();
    const packOfValues = sourceSheet.getRange('G2:G').getValues();

    // 📊 FBA Orders Map
    const fbaOrdersData = fbaOrdersSheet.getDataRange().getValues();
    const fbaOrdersMap = {};
    for (let i = 1; i < fbaOrdersData.length; i++) {
      const sku = fbaOrdersData[i][0];
      const qty = parseInt(fbaOrdersData[i][8]) || 0;
      if (sku) fbaOrdersMap[sku] = qty;
    }

    // 📊 Build row data
    const finalData = [];
    let rowCounter = 2;

    for (let i = 0; i < skuValues.length; i++) {
      const sku = skuValues[i][0];
      const status = statusValues[i][0];
      if (!sku || status === "DoNotListOnAZ") continue;

      const productName = productNames[i][0];
      const packOf = packOfValues[i][0];
      const packSizeMatch = sku.match(/-(\d{1,6})/);
      const packSize = packSizeMatch ? parseInt(packSizeMatch[1]) : '';
      const msku = sku.substring(0, 6);
      const orderQty = fbaOrdersMap[sku] || 0;

      const inTransit = `=IFERROR(SUM(FILTER('Rack Data'!E:E, 'Rack Data'!B:B = $C${rowCounter}, REGEXMATCH('Rack Data'!D:D, "^(TW|ISK3|WT)$"))),0)`;
      const fbaStock = `=SUMIFS('Rack Data'!E:E,'Rack Data'!B:B,C${rowCounter},'Rack Data'!H:H,1)`;
      const unitsToSend = `=IF(N${rowCounter}<10,10,INT(N${rowCounter}*1.2))`;
      const toBeSentMinusStock = `=INT(K${rowCounter}-H${rowCounter})`;
      const weightage = `=INT(IF(L${rowCounter}<1, 0, E${rowCounter}+E${rowCounter}*N${rowCounter}))`;
      const bulkDist = `=INT(IFERROR(I${rowCounter}/SUMIFS(O:O,A:A,A${rowCounter})*O${rowCounter},0))`;
      const unitDist = `=INT(IF(P${rowCounter}=0, 0, IF(P${rowCounter}/E${rowCounter}>L${rowCounter}, L${rowCounter}, P${rowCounter}/E${rowCounter})))`;

      finalData.push([
        '', msku, sku, productName, packSize, packOf,
        inTransit, fbaStock, '', '', unitsToSend,
        toBeSentMinusStock, '', orderQty,
        weightage, bulkDist, unitDist,
        '', '', '', '' // Booking qty, Fnsku, Product id, MPSKU
      ]);

      rowCounter++;
    }

    if (finalData.length > 0) {
      outputSheet.getRange(2, 1, finalData.length, headers.length).setValues(finalData);

      for (let i = 0; i < finalData.length; i++) {
        const row = i + 2;

        const formulas = {
          A: `=XLOOKUP(B${row},IMPORTRANGE("${sourceFileId}","Bulk Product!C:C"),IMPORTRANGE("${sourceFileId}","Bulk Product!B:B"),"")`,
          I: `=SUMIF('Rack Data'!B:B,A${row},'Rack Data'!E:E)`,
          J: `=IF(A${row}=B${row},0,SUMIF('Rack Data'!B:B,B${row},'Rack Data'!E:E))`,
          M: `=IFERROR(INT(SUMIF('Rack Data'!B:B, A${row}, 'Rack Data'!E:E) / SUMIF(A:A, A${row}, E:E)), 0)`,
          U: `=XLOOKUP($C${row},Helper!$A:$A,Helper!$B:$B,"")`,
          S: `=XLOOKUP($U${row},Helper!$B:$B,Helper!$D:$D,"")`,
          T: `=XLOOKUP($U${row},Helper!$B:$B,Helper!$C:$C,"")`
        };

        if (showFormulas) {
          outputSheet.getRange(`A${row}`).setFormula(formulas.A);
          outputSheet.getRange(`I${row}`).setFormula(formulas.I);
          outputSheet.getRange(`J${row}`).setFormula(formulas.J);
          outputSheet.getRange(`M${row}`).setFormula(formulas.M);
          outputSheet.getRange(`U${row}`).setFormula(formulas.U);
          outputSheet.getRange(`S${row}`).setFormula(formulas.S);
          outputSheet.getRange(`T${row}`).setFormula(formulas.T);
        } else {
          outputSheet.getRange(`A${row}`).setFormula(formulas.A);
          outputSheet.getRange(`I${row}`).setFormula(formulas.I);
          outputSheet.getRange(`J${row}`).setFormula(formulas.J);
          outputSheet.getRange(`M${row}`).setFormula(formulas.M);
          outputSheet.getRange(`U${row}`).setFormula(formulas.U);
          outputSheet.getRange(`S${row}`).setFormula(formulas.S);
          outputSheet.getRange(`T${row}`).setFormula(formulas.T);
        }
      }

      // ⏳ Allow formulas to calculate, then convert to values if showFormulas is false
      if (!showFormulas) {
        SpreadsheetApp.flush(); // Force calculation
        const rowCount = finalData.length;

        ['A', 'I', 'J', 'M', 'U', 'S', 'T','G','H','K','L','O','P','Q'].forEach(col => {
          const range = outputSheet.getRange(`${col}2:${col}${rowCount + 1}`);
          const values = range.getValues();
          range.setValues(values); // overwrite formula with plain values
        });
      }

      // 🎨 Styling
      outputSheet.getRange(2, 12, finalData.length, 1).setBackground('#FFFACD');
      outputSheet.getRange(2, 17, finalData.length, 1).setBackground('#FFFACD');
      outputSheet.getRange(2, 14, finalData.length, 1).setBackground('#ADD8E6');

      Logger.log('✅ Output sheet updated. Formulas ' + (showFormulas ? 'visible.' : 'removed.'));
    }

  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
  }
}
