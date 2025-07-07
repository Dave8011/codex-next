// utils/ptfs_product_sku.js

// Shopify PTFS SKU mapping.
// Example: { "PT1234-0001": { variant_id: "123456789", inv_id: "987654321", price: 499 } }
export const shopifyMap = {
  "PT0078-000850BP-1M1": {
    variant_id: "123456789",
    inv_id: "987654321",
    price: 499, // Optional: pre-fill, user can update in UI
  },
  "PT0102-000850BP-1M1": {
    variant_id: "223456789",
    inv_id: "887654321",
    price: 699,
  },
  // Add the rest of your mappings here
};