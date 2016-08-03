/**
 * Created by jacek on 25.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .provider('columns', function ColumnsProvider() {

            var columns, self, columnDefault;

            self = this;
            columns = {};
            columnDefault = {

                header : null,
                property : null,
                sortable : false,
                filter: null,
                on : null,
                resolver : null,
                visible : true,
                hide_able : true,
                width: null
            };


            this.add = function( id, definition ) {

                var newDef;

                if ( id in columns ) {

                    throw new Error('columnsProvider Conflict! Column `'+id+'` already exists!');
                }

                newDef = { };
                newDef[ id ] = definition;

                columns = Object.assign( newDef, columns );
            };

            this.addAll = function( defintions ) {

                angular.forEach( defintions, function( definition, id ) {

                    self.add(id,definition);
                });
            };

            function ColumnsHandler( ) {

                this.get = function( id, override ) {

                    if ( typeof columns[ id ] === 'undefined' ) {

                        return new Error('ColumnHandler Error! Column `'+id+'` does not exists!');
                    }

                    return Object.assign( { id: id }, columnDefault, columns[ id ], override || {});
                };

                this.lazyGet = function ( column ) {

                    var id, override, isArray;

                    isArray = angular.isArray( column );

                    override =  isArray && column[ 1 ] || { };
                    id = isArray && column[ 0 ] || column;

                    return this.get( id, override );
                };
            };

            this.$get = function columnsHandlerFactory() {

                return new ColumnsHandler();
            };

        });

})( angular );