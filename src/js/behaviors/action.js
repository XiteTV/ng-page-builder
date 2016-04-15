/**
 * Created by jacek on 15.01.16.
 */

(function ( angular) {

    angular
        .module('npb')
        .directive('actionCall', function( actions  ) {

            return {
                restrict : 'A',
                link : function( $scope, $element, $attributes ) {

                    var action, data;

                    $element.on('click', function (event) {

                        action = $scope.$eval($attributes.actionCall);
                        data = $scope.$eval($attributes.actionData) || {};
                        data.$event = event;

                        actions.call( 'action:' + action, data );
                    });
                }
            }
        });

})( angular);