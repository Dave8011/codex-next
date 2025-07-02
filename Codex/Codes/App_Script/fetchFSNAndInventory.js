

function fetchFSNAndInventory() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fk");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Sheet 'fk' not found!");
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No data found in 'fk' sheet.");
    return;
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  // Columns: A = SKU, B = FSN, C = Inventory Qty

  const skusToFetchFSN = [];1
  const skuRowMap = {};

  // Collect SKUs missing FSN
  data.forEach((row, index) => {
    const sku = row[0];
    const fsn = row[1];
    if (sku && !fsn) {
      skusToFetchFSN.push(sku);
      skuRowMap[sku] = index + 2; // row number in sheet
    }
  });

  // Step 1: Fetch FSN for SKUs missing FSN
  if (skusToFetchFSN.length > 0) {
    Logger.log(`Fetching FSN for ${skusToFetchFSN.length} SKUs...`);
    fetchFSNBatch(skusToFetchFSN, skuRowMap, sheet);
  } else {
    Logger.log("All SKUs have FSN. Proceeding to fetch inventory...");
  }

  // Step 2: Fetch Inventory for all rows with FSN and missing inventory quantity
  const inventoryFetchList = [];
  const inventoryRowMap = {};

  data.forEach((row, index) => {
    const fsn = row[1];
    const invQty = row[2];
    if (fsn && (invQty === "" || invQty === null)) {
      inventoryFetchList.push(fsn);
      inventoryRowMap[fsn] = index + 2;
    }
  });

  if (inventoryFetchList.length > 0) {
    Logger.log(`Fetching inventory for ${inventoryFetchList.length} FSNs...`);
    fetchInventoryBatch(inventoryFetchList, inventoryRowMap, sheet);
  } else {
    Logger.log("No inventory quantity to fetch.");
  }

  SpreadsheetApp.getUi().alert("✅ FSN and Inventory fetch process completed.");
}

// Fetch FSN for SKUs in batches of 20 (Flipkart API limit)
function fetchFSNBatch(skus, skuRowMap, sheet) {
  const batchSize = 20;
  const url = 'https://api.flipkart.net/sellers/skus/v2/details';

  for (let i = 0; i < skus.length; i += batchSize) {
    const batch = skus.slice(i, i + batchSize);

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: `Bearer ${CONFIG.accessToken}` },
        payload: JSON.stringify({ skuIds: batch }),
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        const result = JSON.parse(response.getContentText());
        if (result.responses) {
          result.responses.forEach(item => {
            const sku = item.skuId;
            const fsn = item.productId || 'NOT FOUND';
            const row = skuRowMap[sku];
            if (row) {
              sheet.getRange(row, 2).setValue(fsn); // Set FSN in col B
            }
          });
        }
      } else {
        Logger.log(`Error fetching FSN for batch starting at index ${i}: ${response.getContentText()}`);
      }

    } catch (e) {
      Logger.log(`Exception fetching FSN batch at index ${i}: ${e.message}`);
    }

    Utilities.sleep(1500); // Delay 1.5 seconds between batches
  }
}

// Fetch inventory quantity for FSNs in batches of 20
function fetchInventoryBatch(fsnList, inventoryRowMap, sheet) {
  const batchSize = 20;
  const url = 'https://api.flipkart.net/sellers/listings/v3/get/inventory';

  for (let i = 0; i < fsnList.length; i += batchSize) {
    const batch = fsnList.slice(i, i + batchSize);
    const payload = {
      productIds: batch,
      locationId: CONFIG.locationId
    };

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: `Bearer ${CONFIG.accessToken}` },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        const result = JSON.parse(response.getContentText());

        if (result.inventoryDetails && Array.isArray(result.inventoryDetails)) {
          result.inventoryDetails.forEach(inv => {
            const fsn = inv.productId;
            const qty = inv.inventory || 0;
            const row = inventoryRowMap[fsn];
            if (row) {
              sheet.getRange(row, 3).setValue(qty); // Set inventory qty in col C
            }
          });
        }
      } else {
        Logger.log(`Error fetching inventory for batch starting at index ${i}: ${response.getContentText()}`);
      }
    } catch (e) {
      Logger.log(`Exception fetching inventory batch at index ${i}: ${e.message}`);
    }

    Utilities.sleep(1500); // Delay 1.5 seconds between batches
  }
}
