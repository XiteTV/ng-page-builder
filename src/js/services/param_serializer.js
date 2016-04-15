/**
 * Created by jacek on 18.01.16.
 */


(function ( angular ) {

    function UrlParameters() {

        this.parse = function( str ) {

            return JSON.parse(str);
        };

        this.stringify = function( obj ) {

            var params, i, p;
            params = {};
            i = 0;

            function __appear( value ) {

                var emptyArray;
                emptyArray = angular.isArray(value) && value.length === 0;
                return !( value === null || typeof value === 'undefined' || emptyArray );
            }

            for ( p in obj ) {

                if ( obj.hasOwnProperty(p) &&  __appear(obj[p])) {

                    i++;
                    params[ p ] = obj[ p ];
                }
            }

            return i ? JSON.stringify( params ) : null;
        };
    }

    angular
        .module('npb')
        .service('urlParameters', UrlParameters);

})( angular );