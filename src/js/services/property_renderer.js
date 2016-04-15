/**
 * Created by jacek on 03.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .factory('propertyRenderer', function() {


            return function propertyRenderer( obj, property, multi) {

                var collection, i, a;

                a = [];

                if (multi) {
                    collection = obj;
                } else {
                    collection = [obj];
                }

                for ( i in collection ) {

                    if (collection.hasOwnProperty(i)) {

                        a.push( collection[i][property] );
                    }
                }

                return a.join(', ');
            }
        });

})( angular );