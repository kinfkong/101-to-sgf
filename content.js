
class ExtractPageVariable {
    constructor(variableName) {
      this._variableName = variableName;
      this._handShake = this._generateHandshake();
      this._inject();
      this._data = this._listen();
    }
  
    get data() {
      return this._data;
    }
  
    // Private
  
    _generateHandshake() {
      const array = new Uint32Array(5);
      return window.crypto.getRandomValues(array).toString();
    }
  
    _inject() {
      function propagateVariable(handShake, variableName) {
        const message = { handShake };
        message[variableName] = JSON.stringify(window[variableName]);
        window.postMessage(message, "*");
      }
  
      const script = `( ${propagateVariable.toString()} )('${this._handShake}', '${this._variableName}');`
      const scriptTag = document.createElement('script');
      const scriptBody = document.createTextNode(script);
  
      scriptTag.id = 'chromeExtensionDataPropagator';
      scriptTag.appendChild(scriptBody);
      document.body.append(scriptTag);
    }
  
    _listen() {
      return new Promise(resolve => {
        window.addEventListener("message", ({data}) => {
          // We only accept messages from ourselves
          if (data.handShake != this._handShake) return;
          resolve(data);
        }, false);
      })
    }
  }

var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var json = data,
            blob = new Blob([json], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());
function normalizeLocation(boardsize, str) {
  return str;
}

function calculatePrepositions(g_qq) {
  const boardsize = g_qq.lu;
  let prepos = g_qq.prepos;
  if (g_qq.psm && g_qq.psm.prepos) {
    prepos = g_qq.psm.prepos;
  }
  const abs = prepos[0].map(a => `[${normalizeLocation(boardsize, a)}]`).join('')
  const aws = prepos[1].map(a => `[${normalizeLocation(boardsize, a)}]`).join('')
  return `AB${abs}AW${aws}`;
}

function escapseComment(str) {
  let result = str.replace(/\[/g, "\\[");
  result = result.replace(/\]/g, "\\]");
  return result;
}

function calculateVariant(boardsize, blackfirst, answer) {
  // (;B[cd]N[Õý½â]	;W[dc]	;B[ce]	;W[cf]	;B[ae]	;W[bf]	;B[ac]	;W[ad]	;B[be])
  let currentColor = 'B';
  if (!blackfirst) {
    currentColor = 'W';
  }
  if(!answer.pts) {
    answer.pts = [];
  }
  let isFirst = true;
  const content = answer.pts.map(pt => {
    let result = `;${currentColor}[${normalizeLocation(boardsize, pt.p)}]`
    if (isFirst) {
      if (answer.ty === 1) {
        result += `N[正解]`;
      } else if (answer.ty === 3) {
        result += `N[失败]`;
      }
    }
    if (pt.c && pt.c.trim()) {
      result += `C[${escapseComment(pt.c.trim())}]`
    }
    isFirst = false;
    if (currentColor == 'B') {
      currentColor = 'W';
    } else {
      currentColor = 'B';
    }
    return result;
  }).join('');
  return `(${content})`
}

function calculateVariants(g_qq) {
  if (!g_qq.answers) {
    return '';
  }
  return g_qq.answers.filter(answer => answer.st === 2 && (answer.ty === 1 || answer.ty === 3)).sort((a, b) => {
    return a.ty - b.ty;
  }).map(answer => {
    return calculateVariant(g_qq.lu, g_qq.blackfirst, answer)
  }).join('');
}

function converToSGF(g_qq) {
    /*
    (;PB[Black]PW[White]HA[0]AB[bb][cb][db][ec][ed][ee][ef][bd][dg][ch][bh][dh]
AW[bc][cc][ab][dd][de][df][cg][bg][ag](;B[cd]N[Õý½â]	;W[dc]	;B[ce]	;W[cf]	;B[ae]	;W[bf]	;B[ac]	;W[ad]	;B[be])
(;B[cd]N[±ä»¯]	;W[dc]	;B[ce]	;W[cf]	;B[ae]	;W[bf]	;B[ac]	;W[be]	;B[aa]
;W[ad]	;B[bd])
(;B[be]N[Ê§°Ü]	;W[bf]	;B[ae]	;W[ce]	;B[ac]	;W[ad])
)
    */
   let title = '';
   if (g_qq.blackfirst) {
     title += '黑先';
   } else {
     title += '白先';
   }
   let comment = '';
   if (g_qq.title && g_qq.title.trim()) {
     comment = `C[${g_qq.title.trim()}]`;
   }
   let size = '';
   if (g_qq.lu !== 19) {
     size = `SZ[${g_qq.lu}]`
   }
   const prepositions = calculatePrepositions(g_qq)
   const variants = calculateVariants(g_qq)
   return `(;
        PB[Black]PW[White]HA[0]${size}N[${title} ${g_qq.qtypename}]${comment}${prepositions}
        ${variants}
   )`
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'get_g_qq') {
        (new ExtractPageVariable('g_qq')).data.then(varResult => {
            const response = JSON.parse(varResult.g_qq);
            fileName = `${response.publicid || 101}.sgf`;
            saveData(converToSGF(response), fileName);
        });
    }
});
