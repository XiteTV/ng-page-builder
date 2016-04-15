/**
 * Created by jacek on 24.03.16.
 */

(function ( angular ) {

    function ObservableDecorator() {

        this.decorate = function (object) {

            object.__proto__.__events = {};

            object.__proto__.on = function (event, callback, context) {

                if (!this.__events[event]) {

                    this.__events[event] = [];
                }

                var call = {
                    fn: callback,
                    ctx: context
                };

                this.__events[event].push(call);
            };

            object.__proto__.un = function (event, callback, context) {

                if (this.__events[event]) {

                    var calls = this.__events[event];

                    for (var i in calls) {

                        if ( calls.hasOwnProperty(i)
                            && angular.equals(calls[i].fn,callback)
                            && angular.equals(calls[i].ctx,context)) {

                            calls.splice(i,1);
                        }
                    }
                }
            };

            object.__proto__.triggerEvent = function () {

                var call;
                var eventName;
                var args = [];

                for (var i in arguments) {

                    if (arguments.hasOwnProperty(i)) {

                        args.push(arguments[i]);
                    }
                }

                eventName = args.shift();

                if (this.__events[eventName]) {

                    for (var p in this.__events[eventName]) {

                        if (this.__events[eventName].hasOwnProperty(p)) {

                            call = this.__events[eventName][p];

                            if (call.ctx) {

                                call.fn.apply(call.ctx, args);
                            } else {

                                call.fn.apply(this, args);
                            }

                        }
                    }
                }
            };
        };
    }

    angular
        .module('npb')
        .service('ObservableDecorator', ObservableDecorator);

})( angular );