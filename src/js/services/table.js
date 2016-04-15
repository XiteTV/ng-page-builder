/**
 * Created by jacek on 11.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .factory('TableColumnDefinition', function() {

            function TableColumnDefinition( config ) {

                this.id = null;
                this.header = null;
                this.sortable = false;
                this.hideable = true;
                this.property = null;
                this.visible = true;

                angular.extend(this, config);
            }

            return TableColumnDefinition;
        })
        .factory('TableColumnSet', function( TableColumnDefinition, columns ) {

            function TableColumnSet( config ) {
                var self = this;
                this.columns = [];

                angular.forEach( config, function( requestedColumn ) {

                    var id, override;

                    override =  angular.isArray( requestedColumn ) && requestedColumn[1] || {};
                    id = angular.isArray( requestedColumn ) && requestedColumn[0] || requestedColumn;

                    self.columns.push( columns.get(id,override));
                });

                this.serialize = function() {

                    return _.map( this.columns, function(col) {

                        return {
                            id : col.id,
                            v : col.visible
                        };
                    })
                };

                this.restore = function( serialized ) {

                    _.each( serialized, function( item ) {

                        _.find(this.columns, function(column) {
                            return column.id === item.id;

                        }).visible = item.v;

                    }.bind(this));
                };
            }

            return TableColumnSet;
        })
        .factory('tableState', function( $localStorage ) {

            function TableState() {

                var defaultColumnSet;

                this.currentId = null;
                this.columnSet = null;
                this.loader = null;
                this.highlighter = angular.noop;
                this.contextMenu = null;

                function getColumnsStoragePath( stateId ) {

                    return stateId + ':columns';
                }

                this.restore = function( id, columnSet, loader, highlighter, contextMenuName ) {

                    this.currentId = id;

                    var columnsPath = getColumnsStoragePath( this.currentId );
                    defaultColumnSet = columnSet.serialize();

                    columnSet.restore( $localStorage.getItem( columnsPath, defaultColumnSet));

                    this.columnSet = columnSet;
                    this.loader = loader;
                    this.highlighter = highlighter;
                    this.contextMenu = contextMenuName;
                };

                this.persistColumnSet = function( ) {

                    var columnsPath = getColumnsStoragePath( this.currentId );
                    $localStorage.setItem( columnsPath, this.columnSet.serialize());
                };

                this.restoreColumnSet = function() {

                    var columnsPath = getColumnsStoragePath( this.currentId );
                    $localStorage.setItem( columnsPath, defaultColumnSet);
                    this.columnSet.restore( defaultColumnSet );
                }
            }

            return new TableState();
        });

})(angular);