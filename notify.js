var fs = require('fs');
var assert = require('assert');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Notifier() {
  EventEmitter.call(this);
}

util.inherits(Notifier, EventEmitter);

Notifier.prototype.close = function() {
  if (this._handle) {
    this._handle.close();
  }
};

Notifier.prototype.start = function(filename) {
  var self = this;
  var prevSize = fs.statSync(filename).size;

  this._handle = fs.watchFile(filename,
    { persistent: true, interval: 5000 },
    function (event) {
    if (event.size > prevSize) {
      self.emit('change', fs.createReadStream(filename, {
          start: prevSize,
          end: event.size
        }));
        prevSize = event.size;
    }
  });
};

module.exports = {
  notify: function(filename) {
            var notifier = new Notifier();
            notifier.start(filename);
            return notifier;
          }
};