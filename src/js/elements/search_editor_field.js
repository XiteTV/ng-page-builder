/**
 * Created by jacek on 01.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .directive('searchEditorField', function( ) {

            return {

                replace : true,
                restrict: 'E',
                template : '<div >{{ displayValue }}</div>',
                link : function( $scope, $element, attributes ) {


                },
                controllerAs : 'inputCtrl',
                controller : function() {

                }
            }
        });

})( angular );