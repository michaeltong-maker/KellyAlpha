#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "→ type-check"
npx tsc -b

echo "→ swap router to MemoryRouter for preview"
cp src/App.tsx /tmp/App.preview.bak
sed -i 's/BrowserRouter/MemoryRouter/g' src/App.tsx

echo "→ build single-file preview"
npx vite build --config vite.preview.config.ts

echo "→ restore source (BrowserRouter)"
cp /tmp/App.preview.bak src/App.tsx

echo "→ post-process: strip crossorigin + inject shims"
python3 - <<'PY'
import pathlib
p = pathlib.Path("dist-preview/index.html")
html = p.read_text()
html = html.replace('<script type="module" crossorigin>', '<script type="module">')
shim = r"""<script>
/* Preview shim: lets this single-file build run inside a sandboxed iframe or
   from a local file:// page. Guards storage, wraps URL for the "null" origin
   case, and no-ops history ops the sandbox may forbid. */
(function(){
  function makeMem(){var m=Object.create(null);return{
    getItem:function(k){return k in m?m[k]:null;},setItem:function(k,v){m[k]=String(v);},
    removeItem:function(k){delete m[k];},clear:function(){m=Object.create(null);},
    key:function(i){return Object.keys(m)[i]??null;},get length(){return Object.keys(m).length;}};}
  function okStore(name){try{var s=window[name];s.setItem('__t','1');s.removeItem('__t');return true;}catch(e){return false;}}
  ['localStorage','sessionStorage'].forEach(function(name){
    if(!okStore(name)){try{Object.defineProperty(window,name,{value:makeMem(),configurable:true});}catch(e){}}
  });
  var Native=window.URL;
  if(Native){
    var FB='http://localhost/';
    function FixedURL(url,base){try{return base!==undefined?new Native(url,base):new Native(url);}catch(e){try{return new Native(url,FB);}catch(e2){throw e;}}}
    FixedURL.prototype=Native.prototype;
    Object.getOwnPropertyNames(Native).forEach(function(k){if(k==='prototype'||k==='length'||k==='name')return;try{var v=Native[k];FixedURL[k]=(typeof v==='function')?v.bind(Native):v;}catch(e){}});
    try{window.URL=FixedURL;}catch(e){}
    try{globalThis.URL=FixedURL;}catch(e){}
  }
  ['pushState','replaceState'].forEach(function(m){
    try{var orig=history[m];history[m]=function(){try{return orig.apply(this,arguments);}catch(e){}};}catch(e){}
  });
})();
</script>"""
html = html.replace('</title>', '</title>\n    '+shim, 1)
p.write_text(html)
assert '<script type="module" crossorigin>' not in html, "crossorigin not stripped"
assert 'FixedURL' in html and 'makeMem' in html, "shim missing"
print("post-process OK")
PY

OUT="/mnt/user-data/outputs/alphawalk-preview-v3.html"
cp dist-preview/index.html "$OUT"
echo "→ wrote $OUT ($(wc -c < "$OUT") bytes)"
