import React, { useState } from 'react';
import { Download, Plus, Trash2, Copy, ExternalLink } from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState('utm');
  const [urls, setUrls] = useState([{ original: '', utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '' }]);
  const [directUrlText, setDirectUrlText] = useState('');
  const [globalUtm, setGlobalUtm] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useGlobalUtm, setUseGlobalUtm] = useState(false);

  const getDirectUrls = () => {
    return directUrlText.split('\n').filter(line => line.trim()).slice(0, 100);
  };

  const addUrl = () => {
    if (urls.length < 100) {
      setUrls([...urls, { original: '', utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '' }]);
    }
  };

  const removeUrl = (index) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const buildFinalUrl = (urlData) => {
    try {
      const utmParams = useGlobalUtm ? globalUtm : urlData;
      const url = new URL(urlData.original);
      
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value && value.trim()) {
          url.searchParams.set(key, value.trim());
        }
      });
      
      return url.toString();
    } catch (error) {
      return urlData.original;
    }
  };

  const generateShortUrls = async () => {
    setLoading(true);
    const newResults = [];

    const urlsToProcess = mode === 'utm' 
      ? urls 
      : getDirectUrls().map(url => ({ original: url }));

    for (const urlData of urlsToProcess) {
      if (!urlData.original.trim()) continue;

      try {
        const finalUrl = mode === 'utm' ? buildFinalUrl(urlData) : urlData.original;
        
        // 실제 API 호출
        const response = await fetch('/api/shorturl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: finalUrl,
            domain: 'nh.nu'
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          newResults.push({
            original: urlData.original,
            final: finalUrl,
            shortUrl: data.data.shortUrl,
            status: 'success'
          });
        } else {
          newResults.push({
            original: urlData.original,
            final: finalUrl,
            shortUrl: '',
            status: 'error',
            error: data.error
          });
        }

      } catch (error) {
        const finalUrl = mode === 'utm' ? buildFinalUrl(urlData) : urlData.original;
        newResults.push({
          original: urlData.original,
          final: finalUrl,
          shortUrl: '',
          status: 'error',
          error: error.message
        });
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  const downloadCSV = () => {
    const headers = ['원본 URL', '최종 URL', 'Short URL', '상태'];
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        `"${result.original}"`,
        `"${result.final}"`,
        `"${result.shortUrl}"`,
        result.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'shorturl_results.csv';
    link.click();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const pasteUrls = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(line => line.trim());
      
      const newUrls = lines.map(line => ({
        original: line.trim(),
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_content: ''
      }));
      setUrls(newUrls.slice(0, 100));
    } catch (err) {
      alert('클립보드 읽기에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NHN Cloud ShortURL 대량 생성기</h1>
        <p className="text-gray-600">최대 100개의 URL을 한 번에 단축URL로 변환하고 UTM 파라미터를 추가할 수 있습니다.</p>
      </div>

      {/* 모드 선택 */}
      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">작업 모드 선택</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setMode('utm')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'utm' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-blue-500 border border-blue-500 hover:bg-blue-50'
            }`}
          >
            UTM 생성 + Short URL
          </button>
          <button
            onClick={() => setMode('direct')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              mode === 'direct' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-blue-500 border border-blue-500 hover:bg-blue-50'
            }`}
          >
            완성된 URL → Short URL
          </button>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          {mode === 'utm' 
            ? '원본 URL에 UTM 파라미터를 추가한 후 Short URL을 생성합니다.' 
            : '이미 UTM 파라미터가 포함된 완성된 URL을 Short URL로 변환합니다.'
          }
        </div>
      </div>

      {/* 전역 UTM 설정 */}
      {mode === 'utm' && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="useGlobalUtm"
              checked={useGlobalUtm}
              onChange={(e) => setUseGlobalUtm(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useGlobalUtm" className="text-lg font-semibold text-gray-700">
              전체 URL에 동일한 UTM 파라미터 적용
            </label>
          </div>
          
          {useGlobalUtm && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Source</label>
                <input
                  type="text"
                  value={globalUtm.utm_source}
                  onChange={(e) => setGlobalUtm({...globalUtm, utm_source: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: google, facebook, email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Medium</label>
                <input
                  type="text"
                  value={globalUtm.utm_medium}
                  onChange={(e) => setGlobalUtm({...globalUtm, utm_medium: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: cpc, banner, email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Campaign</label>
                <input
                  type="text"
                  value={globalUtm.utm_campaign}
                  onChange={(e) => setGlobalUtm({...globalUtm, utm_campaign: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: summer_sale, product_launch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UTM Content</label>
                <input
                  type="text"
                  value={globalUtm.utm_content}
                  onChange={(e) => setGlobalUtm({...globalUtm, utm_content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: header_link, sidebar_ad"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL 입력 섹션 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'utm' ? `URL 목록 (${urls.length}/100)` : `완성된 URL 목록`}
          </h2>
          {mode === 'utm' && (
            <div className="space-x-2">
              <button
                onClick={pasteUrls}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                클립보드에서 붙여넣기
              </button>
              <button
                onClick={addUrl}
                disabled={urls.length >= 100}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                URL 추가
              </button>
            </div>
          )}
        </div>

        {mode === 'utm' ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {urls.map((url, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">URL #{index + 1}</span>
                  <button
                    onClick={() => removeUrl(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-3">
                  <input
                    type="url"
                    value={url.original}
                    onChange={(e) => updateUrl(index, 'original', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                {!useGlobalUtm && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={url.utm_source}
                      onChange={(e) => updateUrl(index, 'utm_source', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="UTM Source"
                    />
                    <input
                      type="text"
                      value={url.utm_medium}
                      onChange={(e) => updateUrl(index, 'utm_medium', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="UTM Medium"
                    />
                    <input
                      type="text"
                      value={url.utm_campaign}
                      onChange={(e) => updateUrl(index, 'utm_campaign', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="UTM Campaign"
                    />
                    <input
                      type="text"
                      value={url.utm_content}
                      onChange={(e) => updateUrl(index, 'utm_content', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="UTM Content"
                    />
                  </div>
                )}

                {url.original && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">미리보기: </span>
                    <span className="text-sm text-blue-600 break-all">{buildFinalUrl(url)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-2">사용법:</h3>
              <div className="text-xs text-green-700 space-y-1">
                <div>• 완성된 URL들을 한 줄에 하나씩 붙여넣으세요</div>
                <div>• 복사한 URL들을 Ctrl+V (또는 Cmd+V)로 붙여넣기 가능</div>
                <div>• 최대 100개까지 처리 가능</div>
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  완성된 URL 목록 (한 줄에 하나씩 입력)
                </label>
                <textarea
                  value={directUrlText}
                  onChange={(e) => setDirectUrlText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 resize-none"
                  placeholder="https://xromeda.com/mfc/vote/detail/airina?utm_source=airina&utm_medium=social&utm_campaign=mfc_vote&utm_content=influencer&#10;https://xromeda.com/mfc/vote/detail/jungyeoon?utm_source=jungyeoon&utm_medium=social&utm_campaign=mfc_vote&utm_content=influencer"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">입력된 URL 개수: </span>
                <span className="text-blue-600">{getDirectUrls().length}/100</span>
              </div>
              
              {getDirectUrls().length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-600 block mb-2">미리보기 (처음 3개):</span>
                  {getDirectUrls().slice(0, 3).map((url, index) => (
                    <div key={index} className="text-xs text-blue-600 break-all mb-1">
                      {index + 1}. {url}
                    </div>
                  ))}
                  {getDirectUrls().length > 3 && (
                    <div className="text-xs text-gray-500">
                      ... 외 {getDirectUrls().length - 3}개
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 생성 버튼 */}
      <div className="mb-8">
        <button
          onClick={generateShortUrls}
          disabled={loading || (mode === 'utm' ? urls.every(url => !url.original.trim()) : getDirectUrls().length === 0)}
          className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 flex items-center justify-center"
        >
          {loading ? '생성 중...' : 'Short URL 생성'}
        </button>
      </div>

      {/* 결과 섹션 */}
      {results.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">생성 결과</h2>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV 다운로드
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">원본 URL</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">최종 URL</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Short URL</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      <div className="max-w-xs truncate">{result.original}</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      <div className="max-w-xs truncate">{result.final}</div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {result.shortUrl && (
                        <div className="max-w-xs truncate text-blue-600">{result.shortUrl}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        result.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'success' ? '성공' : '실패'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex space-x-2">
                        {result.shortUrl && (
                          <>
                            <button
                              onClick={() => copyToClipboard(result.shortUrl)}
                              className="text-blue-500 hover:text-blue-700"
                              title="복사"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <a
                              href={result.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                              title="새 창에서 열기"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}