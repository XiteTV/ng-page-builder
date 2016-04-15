/**
 * Created by jacek on 25.03.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .provider('message', function() {

            var messages = {};

            function MessageHandler() {

                this.getRawMessage = function( tplId ) {

                    if ( typeof messages[tplId] === 'undefined') {

                        throw new Error('Message `'+tplId+'` is not registered');
                    }

                    return messages[ tplId ];
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

            this.$get = function messageHandlerFactory() {

                return new MessageHandler();
            };
        });

})( angular );