/**
 * Created by jacek on 22.03.16.
 */

(function ( angular ) {

    function Message( notifier, level, text ) {

        this.level = level;
        this.read = false;
        this.text = text;

        this.close = function( ) {

            notifier.messages.splice( notifier.messages.indexOf( this ) , 1 );
        };
    }

    function Task( notifier, text ) {

        this.text = text;
        this.level = 'progress';
        this.onResolve = angular.noop;

        this.resolve = function( level, msg ) {

            this.level = level;
            this.onResolve(this);

            if (level === 'error') {

                notifier.message( level, msg || text );

            } else {

                notifier.notify( level, msg || text );
            }

            notifier.tasks.splice( notifier.tasks.indexOf( this ) , 1 );
        };
    }

    function  Notifier( notifyHandler ) {

        this.tasks = [];
        this.messages = [];
        this.notifyHandler = notifyHandler;
    }

    Notifier.prototype = {

        message : function createMessage( level, text ) {

            var message = new Message( this, level, text );
            this.messages.unshift(message);

            return message;
        },

        task : function createTask( text ) {

            var task = new Task( this, text );
            this.tasks.unshift( task );
            return task;
        },

        notify : function( level, text ) {

            this.notifyHandler( level, text );
        }
    };

    angular
        .module('npb')
        .provider('notifier', function NotifierProvider() {

            var notifyHandler = angular.noop;

            this.registerNotifyHandler = function( handler ) {

                notifyHandler = handler;
            };

            this.$get = function notifierFactory ( $injector ) {

                var notifyHandlerResolved = notifyHandler;

                if (angular.isString( notifyHandler )) {

                    notifyHandlerResolved = $injector.get( notifyHandler );
                }

                return new Notifier( notifyHandlerResolved );
            };
        });

})( angular );