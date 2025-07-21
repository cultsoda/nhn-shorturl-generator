// pages/api/shorturl.js
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, domain = 'nh.nu' } = req.body;

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    // NHN Cloud ShortURL API 호출
    const response = await fetch('https://api-shorturl.nhncloudservice.com/open-api/v1.0/appkeys/zbY2gn8pOKyD8Lx4/urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        domain: domain
      })
    });

    const data = await response.json();

    if (data.header && data.header.isSuccessful) {
      return res.status(200).json({
        success: true,
        data: {
          shortUrl: data.body.shortUrl,
          originUrl: data.body.originUrl,
          status: data.body.status
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.header ? data.header.resultMessage : 'Unknown error occurred'
      });
    }

  } catch (error) {
    console.error('ShortURL API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}