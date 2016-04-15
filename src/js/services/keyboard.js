/**
 * Created by jacek on 24.03.16.
 */

(function (angular) {
    angular
        .module('npb')
        .factory('keyboard', function (ObservableDecorator) {

            var namedKeyMap = {

                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                ENTER: 13,
                ESC: 27,
                BACKSPACE: 8,
                SPACE: 32
            };

            var switchKeyMap = {

                SHIFT: 4,
                CTRL: 2,
                ALT: 1
            };

            function getNamedKey(code) {

                var p;

                for (p in namedKeyMap) {

                    if (namedKeyMap.hasOwnProperty(p) && namedKeyMap[p] === code)

                        return p;
                }
            }

            function getBitSignature(event) {

                var bitMap = 0;

                if (event.shiftKey) {

                    bitMap |= 4;
                }

                if (event.ctrlKey || event.metaKey) {

                    bitMap |= 2;
                }

                if (event.altKey) {

                    bitMap |= 1;
                }

                return bitMap;
            }

            function normalizeStroke(stroke) {

                var r = /(SHIFT|CTRL|ALT)?\+?(SHIFT|CTRL|ALT)?\+?(SHIFT|CTRL|ALT)?\+?(LEFT|RIGHT|UP|DOWN|ENTER|ESC|BACKSPACE|SPACE|[A-Z])/;

                if (!r.test(stroke)) {
                    throw new Error('Keyboard stroke syntax error. :' + stroke + ' is not valid!');
                }

                var matches = r.exec(stroke);
                var bitMap = 0;

                for (var i = 1; i < 4; i++) {

                    if (matches[i] && switchKeyMap[matches[i]]) {
                        bitMap |= switchKeyMap[matches[i]];
                    }
                }

                return bitMap + '_' + matches[4];
            }

            function KbDispatcher() {

                var self = this;

                function dispatch(event) {

                    var bitSignature = getBitSignature(event);

                    var eventName = bitSignature + '_' + (  getNamedKey(event.which) || String.fromCharCode(event.which) );

                    if (self.__events[eventName]) {

                        event.preventDefault();
                        event.stopPropagation();
                        self.triggerEvent(eventName);
                        return false;
                    }
                }

                this.bindMap = function (map, context) {

                    angular.forEach(map, function (handler, keyStroke) {

                        var normalizedStroke = normalizeStroke(keyStroke);
                        this.on(normalizedStroke, handler, context);

                    }.bind(this));
                };

                this.unbindMap = function (map, context) {

                    angular.forEach(map, function (handler, keyStroke) {

                        var normalizedStroke = normalizeStroke(keyStroke);
                        this.un(normalizedStroke, handler, context);

                    }.bind(this));
                };

                window.addEventListener('keydown', dispatch, false);
                ObservableDecorator.decorate(this);
            }

            return new KbDispatcher();
        });

})(angular);