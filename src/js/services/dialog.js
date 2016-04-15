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

                this.ok = function( callback ) {

                    var result = callback();
                    $rootScope.$broadcast('dialog:ok', this.options, result );

                    this.close();
                };

                this.close = function() {

                    $rootScope.$broadcast('dialog:close');
                };
            };

            return new Dialog();
        });
})(angular);