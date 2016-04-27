/**
 * Created by jacek on 13.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .constant('filterTypeDialogIdMap', {
            'select' : 'dictionary_chooser',
            'search' : 'dictionary_searcher'
        })
        .factory('filterDialogMapper', function( filterTypeDialogIdMap ) {

            function FilterDialogMapper() {

                this.getIdByType = function ( type ) {

                    return filterTypeDialogIdMap[ type ];
                };
            }

            return new FilterDialogMapper();
        });
    
})( angular );