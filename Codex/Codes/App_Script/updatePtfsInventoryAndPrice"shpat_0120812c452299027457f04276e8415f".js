function updatePtfsInventoryAndPrice() {
  // 📄 Get the "PTFS" sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PTFS");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("❌ Sheet 'PTFS' not found.");
    return;
  }

  // 📦 Get all data from the sheet
  const data = sheet.getDataRange().getValues(); 
  // Columns: [SKU, inventory_item_id, qty, price, MRP, variant_id, status]

  // 🔐 Shopify API credentials
  const shopifyToken = 'token hear';
  const shopDomain = 'puretreefoods.myshopify.com';
  const locationId = '60002631857'; // Your Shopify location ID

  // 🔁 Loop through each row (skip header row)
  for (let i = 1; i < data.length; i++) {
    const inventoryItemId = data[i][1];
    const qty = data[i][2];
    const price = data[i][3];
    const compareAtPrice = data[i][4]; // MRP
    const variantId = data[i][5];
    const status = data[i][6];

    // ⏭️ Skip rows already marked as updated
    if (status && status.toString().includes('✅')) {
      continue;
    }

    // ❗ Skip rows with missing required fields
    if (!inventoryItemId || qty === '' || price === '' || !variantId) {
      sheet.getRange(i + 1, 7).setValue('❌ Missing data');
      continue;
    }

    // ❗ Ensure MRP (compare_at_price) is provided and higher than selling price
    if (!compareAtPrice || parseFloat(compareAtPrice) <= parseFloat(price)) {
      sheet.getRange(i + 1, 7).setValue('❌ MRP missing or ≤ Price');
      continue;
    }

    // ✅ Track success status
    let successInv = false;
    let successPrice = false;

    // 1️⃣ Prepare Inventory Payload
    const inventoryPayload = {
      location_id: parseInt(locationId),
      inventory_item_id: parseInt(inventoryItemId),
      available: parseInt(qty),
    };

    // 1️⃣ Send Inventory Update Request
    try {
      const inventoryUrl = `https://${shopDomain}/admin/api/2023-10/inventory_levels/set.json`;
      const invRes = UrlFetchApp.fetch(inventoryUrl, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
        },
        payload: JSON.stringify(inventoryPayload),
        muteHttpExceptions: true,
      });

      const invCode = invRes.getResponseCode();
      successInv = (invCode >= 200 && invCode < 300);
    } catch (err) {
      sheet.getRange(i + 1, 7).setValue(`❌ Inventory Error: ${err.message}`);
      continue;
    }

    // 2️⃣ Prepare Price + MRP Payload
    const pricePayload = {
      variant: {
        id: parseInt(variantId),
        price: price.toString(),
        compare_at_price: compareAtPrice.toString()
      }
    };

    // 2️⃣ Send Price Update Request
    try {
      const priceUrl = `https://${shopDomain}/admin/api/2023-10/variants/${variantId}.json`;
      const priceRes = UrlFetchApp.fetch(priceUrl, {
        method: 'put',
        contentType: 'application/json',
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
        },
        payload: JSON.stringify(pricePayload),
        muteHttpExceptions: true,
      });

      const priceCode = priceRes.getResponseCode();
      successPrice = (priceCode >= 200 && priceCode < 300);
    } catch (err) {
      sheet.getRange(i + 1, 7).setValue(`❌ Price Error: ${err.message}`);
      continue;
    }

    // 🧾 Final status message
    const finalStatus = (successInv && successPrice)
      ? '✅ Inventory & Price Updated'
      : (successInv ? '✅ Inventory Updated ❌ Price Failed' : '❌ Inventory Failed ✅ Price Updated');

    // 💾 Write result to Status Column (G = index 6 + 1 = 7)
    sheet.getRange(i + 1, 7).setValue(finalStatus);

    // 🕒 Add short delay to avoid Shopify API rate limits
    Utilities.sleep(600);
  }

  // 📣 Completion message
  SpreadsheetApp.getUi().alert("✅ PTFS inventory, price & MRP update completed!");
}
