function exportToImportFBA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("Output_Data");
  const targetSheet = ss.getSheetByName("Import FBA");
  const helperSheet = ss.getSheetByName("Helper");

  if (!sourceSheet || !targetSheet || !helperSheet) {
    SpreadsheetApp.getUi().alert("❌ One or more sheets not found. Please make sure 'Output_Data', 'Import FBA', and 'Helper' exist.");
    return;
  }

  // 🧼 Clear only data starting from row 9 (keep header/format above)
  const lastRow = targetSheet.getLastRow();
  if (lastRow > 8) {
    targetSheet.getRange("A9:I" + lastRow).clearContent();
  }

  const sourceData = sourceSheet.getDataRange().getValues();
  const helperData = helperSheet.getDataRange().getValues();
  const helperMap = {};

  // 🔎 Map helper info by Merchant SKU (Column B in Helper)
  for (let i = 1; i < helperData.length; i++) {
    const sku = helperData[i][1];
    if (sku) {
      helperMap[sku] = {
        hsn: helperData[i][4] || '',
        gst: helperData[i][5] || '',
        value: helperData[i][6] || ''
      };
    }
  }

  const exportRows = [];

  for (let i = 1; i < sourceData.length; i++) {
    const bookingQty = sourceData[i][17]; // R
    const merchantSKU = sourceData[i][20]; // U

    if (merchantSKU && bookingQty !== "" && !isNaN(bookingQty)) {
      const helperInfo = helperMap[merchantSKU] || { hsn: "", gst: "", value: "" };

      exportRows.push([
        merchantSKU,                         // Merchant SKU
        parseInt(bookingQty),                // Quantity
        "ISK3",                              // FC
        "Seller",                            // Prep owner
        "Seller",                            // Labeling owner
        "No prep needed",                    // Prep category
        helperInfo.hsn,                      // HSN/SAC code
        helperInfo.gst,                      // GST rate
        helperInfo.value                     // Declared value (per unit)
      ]);
    }
  }

  if (exportRows.length > 0) {
    targetSheet.getRange(9, 1, exportRows.length, 9).setValues(exportRows);
    SpreadsheetApp.getUi().alert("✅ Export successful! Data written to 'Import FBA'.");
  } else {
    SpreadsheetApp.getUi().alert("⚠️ No rows found with Booking Qty to export.");
  }
}
