/**
 * Created by jacek on 30.03.16.
 */

(function ( angular ) {


    angular
        .module('npb')
        .factory('$localStorage', function() {

            function LocalStorage( ) {}

            LocalStorage.prototype = {

                getItem : function( itemId, defaults ) {

                    if (null === localStorage.getItem( itemId ) && defaults) {

                        this.setItem( itemId, defaults);
                    }

                    return JSON.parse( localStorage.getItem( itemId ));
                },
                setItem : function( itemId, value ) {

                    localStorage.setItem( itemId, JSON.stringify( value ));
                },
                removeItem : function( itemId ) {

                    localStorage.removeItem( itemId );
                }
            }

            return new LocalStorage();
        })
})( angular );