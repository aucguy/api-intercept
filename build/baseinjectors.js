/*
 * Base.js by aucguy. Under MIT License.
 * built on  2016-08-09
 */
base.registerModule('phaserInjector', function() {
  function injectIntoPhaser(loader) {
    var assets = base.getAssets();
    var keys = Object.keys(assets);
    for(var i=0; i<keys.length; i++) {
      var asset = assets[keys[i]];
      var file = {
        type: asset.type,
        key: asset.id,
        path: base.getBasePath(),
        url: asset.url,
        syncPoint: false,
        data: asset.data,
        loading: false,
        loaded: true,
        error: false
      };
      if(file.type == 'audio') file.autoDecode = true;
      if(asset.extra) {
        var names = Object.getOwnPropertyNames(asset.extra);
        for(var k=0; k<names.length; k++) {
          file[names[k]] = asset.extra[names[k]];
        }
      }
      if(['json', 'tilemap'].indexOf(file.type) != -1) {
        loader.jsonLoadComplete(file, asset.xhr);
      } else {
        loader.fileComplete(file, asset.xhr);
      }
    }
  }

  return {
    injectIntoPhaser: injectIntoPhaser
  };
});
