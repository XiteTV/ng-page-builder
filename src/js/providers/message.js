/**
 * Created by jacek on 25.03.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .provider('message', function() {

            var messages = {};
            var fallback = [
                {
                    test : /error|fail/i,
                    message : 'Error!'
                },
                {
                    test : /success|successful|/i,
                    message: 'OK!'
                }
            ];

            var findCallback = function ( id ) {

                for( var i in fallback ) {

                    if ( fallback.hasOwnProperty(i) && fallback[i].test.test( id )) {

                        return fallback[ i ].message;
                    }
                }
            };

            function MessageHandler() {

                this.getRawMessage = function( tplId ) {

                    var message;

                    if ( typeof messages[tplId] === 'undefined') {

                        console.warn('Message `%s` is not registered. You can customize this message instead of using fallback', tplId );

                        message = findCallback( tplId );

                    } else {

                        message = messages[ tplId ];
                    }

                    if (!message) {

                        throw new Error('Message `'+tplId+'` is not registered and dont match any fallback');
                    }

                    return message;
                };

                this.getMessage = function( tplId, content ) {

                    var messageFormat = this.getRawMessage( tplId );

                    return stringFormat( messageFormat, content );
                };
            }

            this.addMessage = function( msgId, msgFormat ) {

                if (!typeof messages[ msgId ] === 'undefined') {

                    throw new Error('Message "'+msgId+'" already exists. Existing format: "'
                        +messages[msgId]+'" was attempt to change by "'+msgFormat+"");
                }

                messages[ msgId ] = msgFormat;
            };

            this.addAll = function( messagesMap ) {

                angular.forEach( messagesMap, function( msgFormat, msgId ) {

                    this.addMessage( msgId, msgFormat );

                }.bind(this));
            };

            this.setFallback = function ( userFallback ) {

                fallback = userFallback;
            };

            this.$get = function messageHandlerFactory() {

                return new MessageHandler();
            };
        });

})( angular );