function getShopifyLocations() {
  const shopifyToken = 'token hear';
  const shopDomain = 'vitashop.in';

  const url = `https://${shopDomain}/admin/api/2023-10/locations.json`;

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'X-Shopify-Access-Token': shopifyToken,
    },
    muteHttpExceptions: true,
  });

  Logger.log(response.getContentText());
}
