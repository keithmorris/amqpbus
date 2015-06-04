var EventStream = require('./event-stream');
var inherits = require('util').inherits;

/**
 *
 * @param channel
 * @param options
 * @constructor
 */
function Subscriber(channel, options) {
  EventStream.call(this, channel, options);
  var self = this;
  var queueOptions = {exclusive: true, autoDelete: true};
  var consumeOptions = {noAck: true, exclusive: true};
  channel.then(function (ch) {
    return ch.assertQueue('', queueOptions).then(function (ok) {
      self.queue = ok.queue;
      return ch.consume(ok.queue, function (msg) {
        self.emit('message', msg, function (){});
      }, consumeOptions)
        .then(function (){
          return ch;
        });
    });
  });
}
inherits(Subscriber, EventStream);

Subscriber.prototype.ack = function (msg) {
  this.channel.then(function (channel) {
    channel.ack(msg);
  });
};

Subscriber.prototype.connect = function (source, topic, callback) {
  // Support the general form of connect
  if (callback === undefined && typeof topic === 'function') {
    callback = topic;
    topic = '';
  } else topic = topic || '';

  var queue = this.queue,
    exchangeOptions = {durable: false, autoDelete: false},
    self = this;
  this.channel.then(function (channel) {
    channel.assertExchange(source, self.options.routing || 'fanout', exchangeOptions)
      .then(function (ok) {
        return channel.bindQueue(queue, source, topic);
      })
      .then(callback);
  });
};

module.exports = Subscriber;