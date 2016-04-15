/**
 * Created by jacek on 23.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterSelect', function() {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/select.html',
                controller: function( $scope, Dictionary, currentFilters ) {

                    var name, filter , data, state, single, displayProperty;

                    filter = $scope.filter;
                    name = filter.name;
                    data = Dictionary.get( filter.data );
                    single = !filter.multi;
                    displayProperty = filter.displayProperty;


                    this.open = function() {

                        $scope.$emit('filter:clicked', filter, state );
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
                        this.update(state);
                    };

                    _construct.call(this);
                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, npbFiltersController ) {

                    var name;

                    name = $scope.filter.name;

                    $scope.$on('$destroy', function() {

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