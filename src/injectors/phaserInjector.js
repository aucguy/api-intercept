base.registerModule('baseAssetInjector', function() {
  var TYPE_MAP = {
    'img': 'image'
  };
  
  function injectIntoPhaser(loader) {
    var assets = base.getAssets();
    var keys = Object.keys(assets);
    for(var i=0; i<keys.length; i++) {
      var asset = assets[keys[i]];
      var file = {
        type: TYPE_MAP[asset.type] || asset.type,
        key: asset.id,
        path: base.getBasePath(),
        url: asset.url,
        syncPoint: false,
        data: asset.data,
        loading: false,
        loaded: true,
        error: false
      };
      loader.fileComplete(file, asset.xhr);
    }
  }
  
  return {
    injectIntoPhaser: injectIntoPhaser
  };
});