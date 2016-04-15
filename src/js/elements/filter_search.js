/**
 * Created by jacek on 24.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterSearch', function() {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/filter.html',
                controller: function( $scope, Dictionary, currentFilters ) {

                    var name, filter , data, state, single, displayProperty;

                    filter = $scope.filter;
                    displayProperty = filter.displayProperty;
                    name = filter.name;
                    data = Dictionary.get(filter.data);
                    single = !filter.multi;

                    this.open = function() {

                        $scope.$emit('filter:clicked', filter, state );
                    };

                    this.update = function(selection ) {

                        var i, value, display;
                        state = selection;
                        value = [];
                        display = [];

                        for( i in state) {

                            if ( state.hasOwnProperty(i) ) {

                                value.push( state[i].id );
                                display.push( state[i][displayProperty] );
                            }
                        }

                        $scope.fc.setState(name, value);
                        this.displayValue = display.length ? display.join(', ') : '-';
                    };

                    function _construct () {

                        var stateValue ;

                        stateValue = currentFilters.filters[name];
                        state = [];

                        if (stateValue) {

                            angular.forEach(stateValue, function( item ) {

                                state.push(data.get( { pid: item }));
                            });
                        }

                        $scope.fc.bind( name, this );
                        this.update(state);
                    }
                    _construct.call(this);
                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, npbFiltersController ) {

                    var name;

                    name = $scope.filter.name;

                    $scope.$on('$destroy', function() {

                        npbFiltersController.unbind(name)
                    });

                    if ($scope.filter.readonly) return;

                    $element.bind('click', function() {

                        $scope.fbc.open();
                    });
                }
            };
        });
})(angular);