function fetchFlipkartAccessToken() {
  const url = 'https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api';
  const authHeader = Utilities.base64Encode(`${CONFIG.appId}:${CONFIG.appSecret}`);

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Basic ${authHeader}`
      },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    const body = response.getContentText();

    if (code >= 200 && code < 300) {
      const json = JSON.parse(body);
      const accessToken = json.access_token;

      if (!accessToken) {
        Logger.log('❌ No access_token found in the response.');
        return null;
      }

      Logger.log('✅ Access Token: ' + accessToken);
      SpreadsheetApp.getUi().alert('✅ New Access Token fetched and logged.');
      return accessToken;
    } else {
      Logger.log(`❌ Error ${code}: ${body}`);
      SpreadsheetApp.getUi().alert(`❌ Error fetching token: ${code}`);
      return null;
    }
  } catch (e) {
    Logger.log(`❌ Exception: ${e.message}`);
    SpreadsheetApp.getUi().alert(`❌ Exception: ${e.message}`);
    return null;
  }
}
