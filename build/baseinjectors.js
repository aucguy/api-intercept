/*
 * Base.js by aucguy. Under MIT License.
 * built on  2016-08-26
 */
base.registerModule('phaserInjector', function() {
  function injectIntoPhaser(load) {
    var assets = base.getAssets();
    var keys = Object.keys(assets);
    for(var i=0; i<keys.length; i++) {
      var asset = assets[keys[i]];
      if(asset.type == 'image') { //TODO add all other asset types
        load.cache.addImage(asset.id, asset.url, asset.data);
      } else if(asset.type == 'tilemap'){
        load.cache.addTilemap(asset.id, asset.url, asset.data, Phaser.Tilemap.TILED_JSON);
      } else if(asset.type == 'spritesheet') {
        load.cache.addSpriteSheet(asset.id, asset.url, asset.data, asset.extra.frameWidth, asset.extra.frameHeight);
      } else if(asset.type == 'audio') {
        load.cache.addSound(asset.id, asset.url, asset.data, base.hasWebAudio(), !base.hasWebAudio());
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
