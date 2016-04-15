/**
 * Created by jacek on 05.02.16.
 */

(function ( angular ) {


    function dictionaryWeakSetFactory( Dictionary ) {

        return function dictionaryWeakSet( dictionaryName, value ) {

            var dictionary, ws;

            ws = new WeakSet();
            if (value === null || typeof value === 'undefined') {

                return ws;
            }

            dictionary = Dictionary.get( dictionaryName );

            if (!angular.isArray( value )) {

                value = [value];
            }

            angular.forEach( value , function( vi ) {

                angular.forEach( dictionary, function( di ) {

                    if (vi.id === di.id) {

                        ws.add( di );
                    }
                });
            });

            return ws;
        }
    }

    function weakSetDictionaryFactory(Dictionary) {

        return function weakSetDictionary( dictionaryName, ws ) {

            var dictionary, a;
            dictionary = Dictionary.get( dictionaryName );
            a = [];

            angular.forEach( dictionary, function( item ) {
                if (ws.has(item)) {
                    a.push(item);
                }
            });

            return a;
        }
    }



    angular
        .module('npb')
        .factory('dictionaryWeakSet', dictionaryWeakSetFactory )
        .factory('weakSetDictionary', weakSetDictionaryFactory );

})( angular );