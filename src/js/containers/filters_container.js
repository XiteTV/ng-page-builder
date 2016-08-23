/**
 * Created by jacek on 12.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .constant('filtersState',{})
        .directive('npbFiltersContainer', function(  dialog, filterDialogMapper, $compile, filtersState ) {

            return {
                replace : false,
                restrict : 'E',
                controller : function($scope) {

                    var states = filtersState;
                    var filters = {};


                    var openFilter;

                    $scope.$on('filter:clicked', function( $event, filter, state ) {

                        var id;
                        id = filterDialogMapper.getIdByType( filter.type );

                        openFilter = filter;

                        dialog.open( id , filter.label, { filter: filter, state: state } );
                    });

                    $scope.$on('dialog:ok', function($event, options, result) {

                        if ( options.filter && openFilter && openFilter.name === options.filter.name) {

                            filters[openFilter.name].update(result);
                        }
                    });

                    var enterListener = function( event ) {
                        //prevent other than enter
                        if (event.which !== 13)
                            return;

                        console.log('enter',event);


                        var eventScope = angular.element( event.target ).scope();


                        if ( eventScope && ( eventScope.fc || eventScope.$parent.fc )) {

                            var data = this.getConditions();
                            data.$event = event;

                            actions.call( 'action:filters', data );

                            event.preventDefault();
                            event.stopPropagation();
                        }

                    }.bind( this );

                    document.addEventListener('keydown', enterListener, true );

                    $scope.$on('$destroy', function () {

                        document.removeEventListener('keydown', enterListener, true );
                    });

                    this.getConditions = function() {

                        return states;
                    };


                    this.getState = function(name) {

                        if (states[ name ]) {

                            return states[ name ];

                        } else {

                            return null;
                        }
                    };

                    this.setState = function(name, value) {

                        states[name] = value;
                    };

                    this.bind = function(name, ctrl) {

                        filters[name] = ctrl;
                    };

                    this.unbind = function(name) {

                        if (states[name]) {

                            delete states[name];
                        }
                        if (filters[name]) {

                            delete filters[name];
                        }
                    };

                },
                controllerAs : 'fc',
                link : function( $scope, $element ) {

                    function makeFilter( definition ) {

                        var element = angular.element( definition.element );
                        var nScope = $scope.$new();
                        nScope.filter = definition;
                        $compile(element)(nScope);
                        $element.append(element);
                    }

                    $scope.$watchCollection('pc.filters', function ( n ) {

                        $element.html();
                        n && angular.forEach( n, makeFilter );
                    });
                }
            }
        })
})(angular);