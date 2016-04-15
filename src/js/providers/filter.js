/**
 * Created by jacek on 12.01.16.
 */


(function (angular) {

    var filterTypes,//:hash with templates Urls
        filters, //:hash with allRegistered Filters
        filterDefaults;//:hash default filter configuration

    filterTypes = {

        like : {
            element : '<npb-filter-like />'
        },
        boolean : {
            element : '<npb-filter-boolean />'
        },
        search : {
            element : '<npb-filter-search />'
        },
        select : {
            element : '<npb-filter-select />'
        }
    };

    filters = {};

    filterDefaults = {
        name : null,
        type: 'like',
        nullable: true,
        defaultValue: null,
        readonly: false,
        multi: false,
        displayProperty : 'name'
    };

    function FilterDefinition( config ) {

        angular.extend(this, filterDefaults, config || {});

        function __validate() {
            if (!this.name) {

                throw new Error('FilterDefinition Error. Name in not defined!','filter_definition_name_not_defined');
            }
            if (!this.type in filterTypes) {
                throw new Error('FilterDefinition Error. filter type must be one of: `'
                    +Object.keys(filterTypes).join(', ')+'`.','filter_definition_wrong_type');
            }
        }
        __validate.call(this);
    }

    FilterDefinition.prototype = {
        //deprecated
        get kbDriven() {

            return ( this.type in { like : 1, sLike : 1 });
        },
        get element() {

            return filterTypes[ this.type].element;
        }
    };

    function FilterHandler( ) {

    }

    FilterHandler.prototype.get = function( name, override ) {

        var filter, filterOverride;

        if (!name) {

            throw new Error('FilterHandler Error. Filter\'s name is required.'
                ,'filter_handler_get_filter_name_is_required');
        }
        else if (!filters[name]) {

            throw new Error('FilterHandler Error. Fiter \''+name+'\' is not defined.'
                ,'filter_handler_get_filter_is_not_defined');
        }

        filter = filters[name];

        if (override && angular.isObject(override)) {

            filterOverride = new FilterDefinition({name:1});
            angular.extend(filterOverride,filter,override);
            return filterOverride;
        } else {
            return filter;
        }
    };
    FilterHandler.prototype.resolve = function( entry ) {

        if (angular.isString( entry )) {
            return this.get(entry);
        }
        else if (angular.isArray(entry) && entry.length === 2) {
            return this.get(entry[0],entry[1]);
        }
    };


    angular
        .module('npb')
        .provider('filters', function() {

            this.setDefaults = function ( config ) {

                angular.extend( filterDefaults, config );
            };

            this.add = function( name, config ) {

                filters[ name ] = new FilterDefinition( config );

                return this;
            };

            this.addAll = function( filtersHash ) {

                var p;

                for (p in filtersHash) {

                    if (filtersHash.hasOwnProperty(p)) {

                        filtersHash[p] = new FilterDefinition( filtersHash[p] );
                    }
                }

                angular.extend(filters,filtersHash);

                return this;
            };

            this.$get = function FiltersFactory() {

                return new FilterHandler();
            };
        })
        .factory('currentFilters', function () {

            return {
                filters : {},
                update : function( value ) {

                    this.filters = value;
                }
            };
        });

})( angular );