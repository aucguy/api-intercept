(function() {
  bu.internal.registerHandler('interval', bu.internal.BasicHandler({
    addName: 'setInterval',
    removeName: 'clearInterval',
    addEvent: (ctx, args) => {
      return {
        name: 'add',
        ctx,
        func: args[0],
        period: args[1],
        args: Array.prototype.slice.call(args, 2)
      };
    }
  }));
})();