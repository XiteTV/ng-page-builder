/**
 * Created by jacek on 25.02.16.
 */


(function ( angular ) {

    angular
        .module('npb')
        .filter('name', function() {

            return function ( object ) {

                return object && object.name || '-';
            }
        })
        .filter('names', function( nameFilter ) {

            return function ( arrayOfObjects ) {

                if (!arrayOfObjects.length) {
                    return '-';
                }

                return _.map( arrayOfObjects, function( item) {
                    return nameFilter( item );
                }).join(', ');
            }
        })
        .filter('join', function() {

            return function ( array ) {

                return array && array.length > 0 && array.join(', ') || '-';
            }
        })
})( angular );