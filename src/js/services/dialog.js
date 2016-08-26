/**
 * Created by jacek on 12.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .factory('dialog', function( $rootScope, $q ) {

            function Dialog() {


                this.title = null;
                this.options = null;

                this.open = function( id, title, options ) {

                    this.title = title;
                    this.options = options;

                    $rootScope.$broadcast('dialog:open', id, title, options);
                };


                this.openPromise = function( id, title, options ) {


                    this.title = title;
                    this.options = options;

                    return $q(

                        function( resolve, reject ) {

                            var refId = Math.random();

                            options.$refId = refId;

                            $rootScope.$broadcast('dialog:open', id, title, options );

                            $rootScope.$on('dialog:ok', function( $event, options, result ) {

                                if ( options.$refId === refId) {

                                    resolve( result );
                                }
                            });

                            $rootScope.$on('dialog:cancel', function( $event, options ) {

                                if ( options.$refId === refId ) {

                                    reject();
                                }
                            });
                        }
                    );
                };

                this.ok = function( callback ) {

                    var result = callback();
                    $rootScope.$broadcast('dialog:ok', this.options, result );

                    close( );
                };

                this.cancel = function ( ) {

                    $rootScope.$broadcast('dialog:cancel', this.options );

                    close( );
                };

                var close = function( ) {

                    $rootScope.$broadcast('dialog:close', this.options );
                };
            };

            return new Dialog();
        });
})(angular);