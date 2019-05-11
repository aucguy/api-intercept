(function(global) {
  const TOKEN = {};

  function DomEventHandler() {
    var sup = bu.internal.GlobalExternalHandler();
    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        var self = this;

        for (let property of Object.getOwnPropertyNames(HTMLElement.prototype)) {
          if (property.startsWith('on')) {
            let desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, property);

            (function() {
              var value = TOKEN;
              Object.defineProperty(HTMLElement.prototype, property, {
                get: desc.get,
                set(func) {
                  if (value === TOKEN) {
                    value = desc.get.call(this);
                  }

                  var ctx = bu.internal.getCurrCtx();
                  var handler = self.getSpecificHandler(ctx);

                  if (handler !== null) {
                    handler.fire({
                      name: 'change',
                      oldValue: value,
                      newValue: func,
                      property,
                      object: this
                    });
                  }

                  value = func;

                  desc.set.call(this, arg => {
                    if (ctx === null) {
                      func(arg);
                    } else {
                      try {
                        ctx.run(() => {
                          func(arg);
                        });
                      } catch (error) {
                        if (handler !== null) {
                          handler.fire({
                            name: 'error',
                            value: func,
                            property,
                            error
                          });
                        }
                      }
                    }
                  });
                }
              });
            })();
          }
        }
      }
    });
  }

  bu.internal.registerHandler('domEvent', DomEventHandler());
})(window);