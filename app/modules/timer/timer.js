/* global define, console */
define([
    'underscore',
    'backbone',
], function(_, Backbone) {
    "use strict";

    var Timer = Backbone.Model.extend({

        defaults: {
            interval: 1000,
            ticks: 0,
            started: null,
            stopped: null,
            enabled: false,
            _ticker: null, // Will be the reference to the timeout
            _checkSubscribers: 30
        },

        initialize: function(attributes, options) {
            _.bindAll(this, '_tick', 'start', 'stop', 'clearTimer', 'subscribe', '_dispatch', 'getSubscriber', '_checkActivity', 'initializeSubscribers');

            this.initializeSubscribers();

            this.on('change:interval', function() {
                this.stop({
                    silent: true
                });
                this.start({
                    silent: true
                });
            });
        },

        initializeSubscribers: function() {
            this.set('_subscribers', {
                tick: [],
                repeat: [{
                    name: 'checkActivity',
                    time: this.get('_checkSubscribers'),
                    fn: function() {
                        app.timer._checkActivity();
                    },
                    repeat: true,
                    last: 0
                }]
            })
        },

        /**
         * Primary initialization point
         * @param {Object} args
         * @param {Function} args.fn - Function to execute when subscription fulfilled
         * @param {Number} [args.time] - If null, each tick is assumed.  Else, time in seconds for args.fn to fire.
         * @param {Boolean} [args.repeat] - If repeatable, will fire repeatedly based on args.time
         * @param {String} [args.name] - provides a named reference that can be used with getSubscriber
         */
        subscribe: function(args) {
            var subscribed = this.get('_subscribers');
            var ticks = this.get('ticks');
            var key = (args && args.repeat) ? 'repeat' : (args && args.time) ? ticks + args.time : 'tick';

            if (subscribed[key]) subscribed[key].push(args);
            else subscribed[key] = [args];

            if (args.repeat) args.last = ticks;

            this.trigger('change:_subscribers', this);
            if (this.get('enabled') == false) this.start();
        },

        getSubscriber: function(name) {
            var ret;
            $.each(this.get('_subscribers'), function(key, value) {
                for (var i = 0, ii = value.length; i < ii; i++) {
                    if (value[i].name == name) return ret = value;
                }
            });
            return ret;
        },

        killSubscriber: function(args) {
            var array, index;
            if (args.name || _.isString(args)) {
                var name = (args.name) ? args.name : args;
                $.each(this.get('_subscribers'), function(key, value) {
                    for (var i = 0, ii = value.length; i < ii; i++) {
                        if (value[i].name == name) {
                            array = value;
                            index = i;
                            return;
                        }
                    }
                });
            } else {
                array = args.array;
                index = args.index;
            }
            array.splice(index, 1);
        },

        _checkActivity: function() {
            var stop = true;
            $.each(this.get('_subscribers'), function(key, value) {
                if ((key == 'repeat' && value.length > 1) || ((key != 'repeat') && (value.length > 0))) return stop = false;
            })
            if (stop) this.stop();
        },

        _dispatch: function(tick, array, kill) {
            var i = array.length;
            while (i--) {
                if (array[i].repeat) {
                    if (array[i].last + array[i].time == tick) {
                        array[i].fn();
                        array[i].last = tick;
                    }
                } else {
                    array[i].fn();
                }

                if (kill) this.killSubscriber({
                    array: array,
                    index: i
                });
            };
        },

        _tick: function() {
            var ticks = this.get('ticks');
            var subscribed = this.get('_subscribers');

            this.clearTimer({
                silent: true
            });

            this._dispatch(ticks, subscribed.tick, false);
            this._dispatch(ticks, subscribed.repeat, false);
            if (subscribed[ticks]) this._dispatch(ticks, subscribed[ticks], true);

            if (this.get('enabled')) {
                this.set('ticks', ticks + 1);
                this.set('_ticker', setTimeout(this._tick, this.get('interval')));
            }
        },

        clearTimer: function(args) {
            var opts = {};
            if (args && args.silent) opts.silent = true;

            this.set({
                _ticker: clearTimeout(this.get('_ticker'))
            }, opts);
        },

        start: function(args) {
            var opts = {};
            if (args && args.silent) opts.silent = true;

            this.clearTimer({
                silent: true
            });

            this.trigger('starting', this);

            this.set({
                enabled: true,
                ticks: 0,
                _ticker: setTimeout(this._tick, this.get('interval'))
            }, opts);

            if (!opts || !opts.silent) this.set('started', new Date());
        },

        stop: function(args) {
            var opts = {};
            if (args && args.silent) opts.silent = true;
            this.trigger('stopping', this);

            this.clearTimer();
            this.initializeSubscribers();

            this.set({
                enabled: false,
            }, opts);

            if (!opts || !opts.silent) this.set('stopped', new Date());
        }



    });

    return Timer;
});