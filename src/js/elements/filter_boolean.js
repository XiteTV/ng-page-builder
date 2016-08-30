/**
 * Created by jacek on 12.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterBoolean', function() {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/boolean.html',
                controller: function( $scope, currentFilters, $element ) {

                    var name, filter, state, trueLabel, falseLabel;

                    filter = $scope.filter;
                    name = filter.name;
                    trueLabel = filter.trueLabel || 'True';
                    falseLabel = filter.falseLabel || 'False';

                    $scope.fc.bind( name, this );

                    function render() {

                        if (null === state) {

                            $scope.displayValue = '-';

                        } else if(state) {

                            $scope.displayValue = trueLabel;

                        } else {

                            $scope.displayValue = falseLabel;
                        }
                    }

                    function serialize(value) {
                        if (null === value) {
                            return 'n';
                        } else if (value) {
                            return '1'
                        } else {
                            return '0';
                        }
                    }
                    function deserialize( value ) {

                        if (parseInt(value) === 1) {
                            return true;
                        } else if (parseInt(value) === 0) {
                            return false;
                        } else {
                            return null;
                        }
                    }

                    this.toggle = function () {
                        var n;

                        if( null === state ) {

                            n = true;

                        } else if( true === state ) {

                            n = false;

                        } else  {

                            n = null;
                        }
                        state = n;

                        $scope.$apply(function() {
                            $scope.fc.setState( name, serialize(state) );
                            render();
                        });
                    };

                    state = deserialize( currentFilters.filters[ name ]);
                    $scope.fc.setState(name , currentFilters.filters[ name ] || null);
                    render();

                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, nbpFiltersController ) {

                    var name;

                    name = $scope.filter.name;

                    $scope.$on('$destroy', function() {

                        nbpFiltersController.unbind(name)
                    });

                    if (!$scope.filter.readonly) {

                        $element.on('click', function() {

                            $scope.fbc.toggle();
                        });
                    }
                }
            };
        });
})(angular);