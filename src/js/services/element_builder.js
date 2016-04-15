/**
 * Created by jacek on 04.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .factory('elementBuilder', function() {

            return function elementBuilder( element, wrapper ) {

                var template;

                template = '<' + (element) + '></' + (element) + '>';

                if ( wrapper ) {

                    template = wrapper.replace('%%', template);
                }

                return angular.element(template);
            }
        });
})( angular );