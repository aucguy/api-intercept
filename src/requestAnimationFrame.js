(function(global) {
  bu.internal.registerHandler('requestAnimationFrame',
    bu.internal.BasicAddHandler(bu.internal.GlobalExternalHandler(), {
      addName: 'requestAnimationFrame',
      addArgs: (self, args, cb) => [global, cb],
      params: (apiArgs, cbArgs) => cbArgs,
      addEvent: (ctx, args) => {
        return {
          name: 'add',
          ctx,
          func: args[0]
        };
      }
    }));
})(window);