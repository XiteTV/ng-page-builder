/**
 * Created by jacek on 18.03.16.
 */

/**
 * Created by jacek on 05.01.16.
 */
(function (angular) {

    'use strict';

    function SortParam( name, direction ) {

        this.field = name;
        this.direction = direction || null;

        this.toggle = function() {

            this.direction = this.direction === '+' ? '-' : '+';
        };

        this.toString = function() {

            return this.direction + this.field;
        };
    }

    function Sorting() {

        this.fields = [];

        this.getSortParam = function( fieldName, direction ) {

            return this.findSortParam( fieldName ) || new SortParam( fieldName, direction );
        };

        this.findSortParam = function( fieldName ) {

            var i;

            for (i in this.fields) {

                if (this.fields.hasOwnProperty(i) && this.fields[i].field === fieldName) {

                    return this.fields[ i ];
                }
            }
        };

        this.sort = function( fieldName, add ) {

            var sortParam, newParam;

            sortParam = this.getSortParam( fieldName );
            newParam = sortParam.direction === null;
            sortParam.toggle();

            if (!add)
            {
                this.fields = [ sortParam ];
            }
            else if(add && newParam)
            {
                this.fields.push( sortParam );
            }
        };

        this.setup = function( sorts ) {
            this.fields = [];
            var fieldsArr = sorts.split(',');

            angular.forEach( fieldsArr, function( field ) {

                var fieldMatches = /^(\+|\-)?([\w+_\-]+)$/.exec(field);

                this.fields.push( this.getSortParam( fieldMatches[2], fieldMatches[1]));

            }.bind(this));
        };


        this.toString = function() {

            return this.fields.join(',');
        };
    }
    function resourceLoaderFactory( $dataResource ) {

        return function ResourceLoader( resourceName, settings ) {

            this.data = [];
            var filters = {};
            var sorting = new Sorting();
            var self = this;
            var contentRange = new ContentRange(resourceName);
            var resourceSettings = settings.resource || {};


            var resource = $dataResource( resourceName, null, contentRange);

            function load() {

                var sortString = sorting.toString();
                var sortingPart = {};
                var query;

                if (sortString.length) {
                    sortingPart.sort = sortString;
                }

                query = angular.extend({}, filters, sortingPart);

                self.data = resource.query(query);

                return self.data;
            }

            this.getInstance = function( ) {

                return new ResourceLoader( resourceName );
            };

            this.newEntity = function () {

                return new resource;
            };

            this.nextPage = function () {

                contentRange.nextPage();
                load();
            };

            this.prevPage = function () {

                contentRange.prevPage();
                load();
            };

            this.goToPage = function (pageNo) {

                contentRange.goToPage(pageNo);
            };

            this.setPageSize = function (pageSize) {

                contentRange.setPageSize(pageSize);
            };

            this.applySort = function (field, add) {

                sorting.sort(field, add || false);
                return this;
            };

            this.getSorting = function () {

                return sorting;
            };

            this.applyFilters = function (newFilters) {

                filters = newFilters;
                return this;
            };

            this.load = function () {

                return load();
            };

            this.getPage = function () {

                return contentRange.page;
            };

            this.getPages = function () {
                return contentRange.totalPages;
            };

            this.getCollectionSize = function () {
                return contentRange.items;
            };

            this.getPageSize = function () {

            };

            this.getPrevPage = function () {

                return contentRange.getPrevPage();
            };

            this.getNextPage = function () {

                return contentRange.getNextPage();
            };
        }
    };

    /**
     *
     * @param resourceName string
     * @param [page] int
     * @param [pageSize] int
     * @constructor
     */
    function ContentRange( resourceName, page, pageSize ) {

        var self = this;

        this.from = null;
        this.to = null;
        this.range = null;


        this.pageSize = 50;
        this.page = 1;

        this.totalPages = null;
        this.items = null;

        this.calculateRange = function() {

            this.from = this.pageSize * ( this.page - 1 );
            this.to = (this.pageSize * this.page) - 1;
        };

        this.bindRequest = function( ) {

            return function () {

                return self.range+'='+self.from+'-'+self.to;
            }
        };

        /**
         * interceptor method
         */
        this.response = function() {

            return function( data, headers ) {

                var contentRangeString, pattern, result, respondedRange, respondedFrom, respondedTo, respondedItems;


                contentRangeString = headers('content-range');
                pattern =  /^([a-z0-9\-\_]+)\s+(\d+)-(\d+)\/(\d+)$/i;
                result = pattern.exec(contentRangeString)

                if (result) {

                    respondedFrom = parseInt( result[2] );
                    respondedTo = parseInt( result[3] );
                    respondedItems = parseInt( result[4] );

                    self.items = respondedItems;
                    self.totalPages = Math.floor( self.items / self.pageSize) + (( self.items % self.pageSize ) ? 1 : 0);

                } else {

                    self.items = 0;
                    self.totalPages = 0;
                    self.page = 0;
                }

                return data;
            }
        };

        this.goToPage = function( page ) {

            this.page = page;
            this.calculateRange();
        };


        this.setPageSize = function ( pageSize ) {

            this.page = 1;
            this.pageSize = pageSize;
            this.calculateRange();
        };

        this.nextPage = function() {

            if ( this.totalPages && this.page < this.totalPages ) {

                this.page++;
                this.calculateRange();
            }
        };

        this.getPrevPage = function() {

            if ( 1 < this.page ) {

                return this.page - 1;
            }
        };

        this.getNextPage = function() {

            if ( this.totalPages && this.page < this.totalPages ) {

                return this.page + 1;
            }

        };

        this.prevPage = function() {

            if ( 1 > this.page ) {

                this.page--;
                this.calculateRange();
            }
        };

        function __construct( resourceName, page, pageSize ) {

            this.range = resourceName;

            if (page) {

                this.page = page;
            }

            if (pageSize) {

                this.pageSize = pageSize;
            }

            this.calculateRange();
        }

        __construct.call( this, resourceName, page, pageSize );
    }

    angular
        .module('npb')
        .factory('ResourceLoader', function ( $dataResource ) {

            return resourceLoaderFactory( $dataResource );
        });

})( angular );