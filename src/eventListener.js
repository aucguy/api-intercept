(function() {
  bu.internal.registerHandler('eventListener', bu.internal.BasicHandler({
    obj: Element.prototype,
    addName: 'addEventListener',
    removeName: 'removeEventListener',
    addEvent: (ctx, args, self) => {
      return {
        name: 'add',
        ctx,
        object: self,
        listenerName: args[0],
        func: args[1]
      };
    },
    addArgs: (self, args, cb) => [self, args[0], cb]
      .concat(Array.prototype.slice.call(args, 2)),
    removeEvent: (ctx, args, self) => {
      return {
        ctx,
        name: 'remove',
        object: self,
        listenerName: args[0],
        func: args[1]
      };
    },
    func: args => args[1],
    params: (apiArgs, cbArgs) => []
  }));
})();