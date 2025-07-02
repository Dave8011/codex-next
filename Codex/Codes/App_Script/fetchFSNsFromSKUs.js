function fetchFSNsFromSKUs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Flipkart Listings");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("❌ Sheet 'Flipkart Listings' not found.");
    return;
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1).getValues(); // SKUs
  const skuBatchSize = 20;
  const skus = data.map(row => row[0]).filter(sku => sku);

  for (let i = 0; i < skus.length; i += skuBatchSize) {
    const batch = skus.slice(i, i + skuBatchSize);
    const url = 'https://api.flipkart.net/sellers/skus/v2/details';
    let attempt = 0;
    let success = false;
    let result;

    while (attempt < 3 && !success) {
      try {
        const response = UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          headers: {
            Authorization: `Bearer ${CONFIG.accessToken}`,
          },
          payload: JSON.stringify({ skuIds: batch }),
          muteHttpExceptions: true,
        });

        const status = response.getResponseCode();
        result = JSON.parse(response.getContentText());

        if (status === 200 && result.responses) {
          success = true;
        } else {
          Logger.log(`⚠️ Attempt ${attempt + 1}: ${response.getContentText()}`);
          Utilities.sleep(5000);
          attempt++;
        }

      } catch (e) {
        Logger.log(`❌ Network Error: ${e.message}`);
        attempt++;
        Utilities.sleep(5000);
      }
    }

    if (!success) {
      Logger.log("❌ Failed after 3 attempts.");
      continue;
    }

    for (const res of result.responses) {
      const sku = res.skuId;
      const fsn = res.productId || '❌ Not found';
      const rowIndex = data.findIndex(row => row[0] === sku);
      if (rowIndex !== -1) {
        sheet.getRange(rowIndex + 2, 2).setValue(fsn); // Column B
      }
    }

    Utilities.sleep(1000);
  }

  SpreadsheetApp.getUi().alert("⏳ Fetch attempt complete (some may have failed if Flipkart was down).");
}
