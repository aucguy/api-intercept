(function(global) {
  function FetchHandler() {
    var sup = bu.internal.GlobalExternalHandler();
    var fetchOriginal = null;

    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        fetchOriginal = fetch;
        var self = this;

        fetch = function() {
          var ret = fetchOriginal.apply(global, arguments);
          var handler = self.getSpecificHandler(bu.internal.getCurrCtx());
        };
      },
      cleanup() {
        fetch = fetchOriginal;
      },
      uses() {
        return ['promise'];
      }
    });
  }
  bu.internal.registerHandler('fetch', FetchHandler());
})(window);