base.registerModule('phaserInjector', function() {
  function injectIntoPhaser(load) {
    var assets = base.getAssets();
    var keys = Object.keys(assets);
    for(var i=0; i<keys.length; i++) {
      var asset = assets[keys[i]];
      if(asset.type == 'image') {
        load.cache.addImage(asset.id, asset.url, asset.data);
      } else if(asset.type == 'tilemap'){
        load.cache.addTilemap(asset.id, asset.url, asset.data, Phaser.Tilemap.TILED_JSON);
      } else if(asset.type == 'spritesheet') {
        load.cache.addSpriteSheet(asset.id, asset.url, asset.data, asset.extra.frameWidth, asset.extra.frameHeight);
      }
      if(['image', 'spritesheet'].indexOf(asset.type) != -1 && asset.extra.pixelated){
        load.cache.getBaseTexture(asset.id).scaleMode = Phaser.scaleModes.NEAREST;
      }
    }
  }

  return {
    injectIntoPhaser: injectIntoPhaser
  };
});
