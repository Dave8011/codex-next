function updateVitashopInventoryAndPrice() {
  // 📄 Get the "Vitashop" sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Vitashop");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("❌ Sheet 'Vitashop' not found.");
    return;
  }

  // 📦 Get all data from the sheet
  const data = sheet.getDataRange().getValues(); 
  // Columns: [SKU, inventory_item_id, qty, price, MRP, variant_id, status]

  // 🔐 Shopify API credentials
  const shopifyToken = 'token hear';
  const shopDomain = 'vitashop.in';
  const locationId = '74934321433'; // Replace with your confirmed Shopify location ID

  // 🔁 Loop through each row (skip header row)
  for (let i = 1; i < data.length; i++) {
    const inventoryItemId = data[i][1];
    const qty = data[i][2];
    const price = data[i][3];
    const compareAtPrice = data[i][4]; // MRP
    const variantId = data[i][5];
    const status = data[i][6]; // Status column

    // ⏭️ Skip if already updated successfully
    if (status && status.toString().includes('✅')) {
      continue;
    }

    // ❗ Check for missing required data
    if (!inventoryItemId || qty === '' || price === '' || !variantId) {
      sheet.getRange(i + 1, 7).setValue('❌ Missing inventory ID, qty, price, or variant ID');
      continue;
    }

    // ❗ Validate that MRP is greater than Price
    if (!compareAtPrice || parseFloat(compareAtPrice) <= parseFloat(price)) {
      sheet.getRange(i + 1, 7).setValue('❌ MRP missing or ≤ Price');
      continue;
    }

    let successInv = false;
    let successPrice = false;

    // 1️⃣ Update Inventory
    const inventoryPayload = {
      location_id: parseInt(locationId),
      inventory_item_id: parseInt(inventoryItemId),
      available: parseInt(qty),
    };

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

    // 2️⃣ Update Price + Compare-at Price (MRP)
    const pricePayload = {
      variant: {
        id: parseInt(variantId),
        price: price.toString(),
        compare_at_price: compareAtPrice.toString()
      }
    };

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

    // ✅ Final status message based on update result
    const finalStatus = (successInv && successPrice)
      ? '✅ Inventory & Price Updated'
      : (successInv ? '✅ Inventory Updated ❌ Price Failed' : '❌ Inventory Failed ✅ Price Updated');

    // 💾 Write final result to status column (Column G = index 6, so G+1 = 7)
    sheet.getRange(i + 1, 7).setValue(finalStatus);

    // ⏳ Add short delay to avoid Shopify API rate limit (2 calls/sec)
    Utilities.sleep(600);
  }

  // 📣 Done alert
  SpreadsheetApp.getUi().alert("✅ Vitashop inventory, price & MRP update completed!");
}
