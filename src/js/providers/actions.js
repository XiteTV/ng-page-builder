/**
 * Created by jacek on 02.03.16.
 */

(function ( angular ) {



    function ActionsHandler( actions, $injector, $rootScope ) {

        this.call = function( actionName, payload ) {

            $rootScope.$broadcast( actionName, payload );
        };

        function getLocals( $event, $payload, $action ) {
            return {
                $event : $event,
                $action : $action,
                $payload : $payload
            };
        }

        function _construct() {

            angular.forEach( actions, function( handlers, actionName ) {

                angular.forEach( handlers, function( handler ) {

                    $rootScope.$on( actionName, function( $event, payload ) {

                        $injector.invoke(
                            handler, //we invoke handler fn
                            handler, // in their scope
                            getLocals( $event, payload, actionName ) // with our locals
                        );
                    });
                });
            });
        }

        _construct.call( this );
    }


    angular
        .module('npb')
        .provider('actions', function ActionsProvider() {

            /**
             * Action folder
             * @type {{}}
             */
            var actions = {};

            this.addHandler = function( actionName, handlerFn ) {

                if ( !actions[ actionName ] ) {
                    actions[ actionName ] = [];
                }

                actions[ actionName ].push( handlerFn );
                return this;
            };

            this.$get = function ( $injector, $rootScope ) {

                return new ActionsHandler( actions, $injector, $rootScope );
            };
        });

})( angular );