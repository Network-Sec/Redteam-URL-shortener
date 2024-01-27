function getWebGLFingerprint() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    return 'WebGL not supported';
  }

  const renderer = gl.getParameter(gl.RENDERER);

  return renderer;
}

function getWebGLFingerprint2() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    return 'WebGL not supported';
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

  return `${vendor}~${renderer}`;
}

function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Hello, world!', 2, 15);

  const dataURL = canvas.toDataURL();
  return hashString(dataURL);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function getAudioFingerprint() {
  return new Promise((resolve) => {
    const context = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);

    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();
    oscillator.connect(compressor);
    compressor.connect(context.destination);

    oscillator.start(0);
    context.startRendering();

    context.oncomplete = (event) => {
      const renderedBuffer = event.renderedBuffer;
      const data = renderedBuffer.getChannelData(0);
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash += Math.abs(data[i]);
      }
      resolve(hashString(hash.toString()));
    };
  });
}

function getClientRectsFingerprint() {
  const div = document.createElement('div');
  div.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
  document.body.appendChild(div);

  const rect = div.getBoundingClientRect();
  const rectString = `${rect.top}~${rect.left}~${rect.bottom}~${rect.right}`;
  return hashString(rectString);
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getLanguage() {
  return navigator.language || navigator.userLanguage;
}

function getScreenResolution() {
  return `${window.screen.width}x${window.screen.height}`;
}

function getBrowserDetails() {
  return {
    browser: navigator.userAgent,
    platform: navigator.platform
  };
}

function getLanguages() {
  return navigator.languages.join(', ');
}

function getLocalTime() {
  return new Date().toString();
}

function getSystemTime() {
  return new Date().toISOString();
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getBrowserFeatures() {
  return {
    javascript: 'Enabled',
    flash: 'Disabled', // Flash is no longer supported in modern browsers
    activeX: typeof ActiveXObject !== 'undefined' ? 'Enabled' : 'Disabled', // Mostly relevant for older versions of IE
    java: navigator.javaEnabled() ? 'Enabled' : 'Disabled',
    cookies: navigator.cookieEnabled ? 'Enabled' : 'Disabled'
  };
}

function getCookies() {
  const cookies = document.cookie.split(';');
  const cookieList = cookies.map(cookie => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    return { name, value };
  });

  return cookieList;
}

function setUniqueVisitorCookie() {
  const visitorId = `visitor_${new Date().getTime()}`;
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Set expiry for 1 year

  document.cookie = `uniqueVisitorId=${visitorId}; expires=${expiryDate.toUTCString()}; path=/`;
}

function getCookie(name) {
  const cookieArray = document.cookie.split(';');
  for(let i = 0; i < cookieArray.length; i++) {
    const cookiePair = cookieArray[i].split('=');
    if(name === cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return null;
}

async function getFingerprintData() {
  const audioFp = await getAudioFingerprint();
  return {
    userAgent: navigator.userAgent,
    webGL: getWebGLFingerprint(),
    canvas: getCanvasFingerprint(),
    audio: audioFp[0],
    clientRects: getClientRectsFingerprint(),
    timezone: getTimezone(),
    localTime: getLocalTime(),
    systemTime: getSystemTime(),
    languages: getLanguages(),
    browserFeatures: getBrowserFeatures(),
    browserDetails: getBrowserDetails(),
    cookies: getCookies(),
    audio: audioFp
  };
}

document.addEventListener('DOMContentLoaded', () => {
    const visitorCookie = getCookie('uniqueVisitorId');
    if (!visitorCookie) setUniqueVisitorCookie();

    let fp;
    Promise.all([
      getAudioFingerprint() // Asynchronous
    ]).then((results) => {
      fp = {
        userAgent: navigator.userAgent,
        webGL: getWebGLFingerprint(),
        canvas: getCanvasFingerprint(),
        audio: results[0],
        clientRects: getClientRectsFingerprint(),
        timezone: getTimezone(),
        localTime: getLocalTime(),
        systemTime: getSystemTime(),
        languages: getLanguages(),
        browserFeatures: getBrowserFeatures(),
        browserDetails: getBrowserDetails(),
        cookies: getCookies()
      };
    });

    const form = document.querySelector('#url-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = form.elements.url.value;
        let subData = {};
        if (url) subData['originalUrl'] = url;
        if (fp) subData['fp'] = fp;

        const response = await fetch('/shorten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subData)
        });
    
        const data = await response.json();
    
        document.getElementById("shortUrlDisplay").innerHTML = `Your Short URL is: <span id="shortUrlCopy">https://ldkn.in/${data.shortUrl}</span><span id="copySymbol">&#x1F4CB;</span>`;
    
        document.getElementById("shortUrlCopy").addEventListener("click", function() {
            const urlToCopy = this.innerText;
            navigator.clipboard.writeText(urlToCopy).then(function() {
              document.getElementById("shortUrlDisplay").insertAdjacentHTML('beforeend', '<div id="msg-copied">Short URL copied to clipboard</div>');
            }).catch(function(err) {
              console.log('Could not copy text: ', err);
            });
            
        });
      });  
    }
});

