(function() {
  bu.internal.registerHandler('timeout', bu.internal.BasicHandler({
    addName: 'setTimeout',
    removeName: 'clearTimeout',
    addEvent: (ctx, args) => {
      return {
        name: 'add',
        ctx,
        func: args[0],
        delay: args[1],
        args: Array.prototype.slice.call(args, 2)
      };
    }
  }));
})();