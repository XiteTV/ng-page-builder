/**
 * Created by jacek on 23.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterSelect', function( actions ) {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/select.html',
                controller: function( $scope, $element, Dictionary, currentFilters, dialog, filterDialogMapper ) {

                    var name, filter , data, state, single, displayProperty, input;

                    filter = $scope.filter;
                    name = filter.name;
                    data = Dictionary.get( filter.data );
                    single = !filter.multi;
                    displayProperty = filter.displayProperty;
                    input = $element[0].querySelector('[tabindex]');

                    var self = this;

                    this.open = function() {
                        
                        var id = filterDialogMapper.getIdByType( filter.type );
                        
                        dialog
                            .openPromise( id, filter.label, { state : state, filter : filter })
                            .then( function( result ) {

                                self.update( result );
                            })
                            .finally( function( ) {

                                input.focus();
                            });
                    };

                    this.update = function ( wSet ) {

                        var i, value, display;
                        state = wSet;
                        value = [];
                        display = [];


                        for( i in data ) {

                            if ( wSet.has(data[i]) ) {

                                display.push( data[i][displayProperty] );
                                if (single ) {

                                    value = data[i].id;
                                    break;

                                } else {

                                    value.push( data[i].id );
                                }
                            }
                        }

                        $scope.fc.setState(name, value);

                        this.displayValue = display.length ? display.join(', ') : '-';
                    };

                    function _in( id, array) {

                        var i;

                        return (angular.isArray( array ) && _.contains(array,id)) || ( array == id);
                    }

                    function _construct( ) {


                        var stateValue, i ;

                        stateValue = currentFilters.filters[name];

                        state = new WeakSet();

                        if (stateValue) {

                            angular.forEach(data, function( item ) {

                                if (_in(item.id, stateValue)) {

                                    state.add(item);
                                }
                            });
                        }
                        $scope.fc.bind( name, this );
                        
                        this.update( state );
                    };

                    _construct.call(this);
                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, npbFiltersController ) {

                    var name, input, enterListener, spaceListener;

                    name = $scope.filter.name;
                    input = $element[0].querySelector('.input');

                    enterListener = function( keyboardEvent ) {

                        if ( keyboardEvent.which !== 13 || input !== document.activeElement)
                            return;

                        var data = $scope.$parent.fc.getConditions();
                        data.$event = keyboardEvent;

                        actions.call( 'action:filters', data );

                        keyboardEvent.preventDefault();
                        keyboardEvent.stopPropagation();
                    };

                    spaceListener = function( keyboardEvent ) {

                        if ( keyboardEvent.which !== 32 || input !== document.activeElement)
                            return;

                        $scope.fbc.open();
                    };

                    input.addEventListener('keydown', enterListener, false );
                    input.addEventListener('keydown', spaceListener, false );

                    $scope.$on('$destroy', function() {

                        input.removeEventListener('keydown', enterListener, false );
                        input.removeEventListener('keydown', spaceListener, false );

                        npbFiltersController.unbind(name)
                    });

                    if ($scope.filter.readonly) {

                        return;
                    }

                    $element.bind('click', function() {

                        $scope.fbc.open();
                    });

                }
            };
        });
})(angular);