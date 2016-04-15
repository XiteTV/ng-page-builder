/**
 * Created by jacek on 23.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterLike', function() {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/like.html',
                controller: function( $scope, Dictionary, currentFilters ) {

                    var name, filter , data, state, single;

                    filter = $scope.filter;
                    name = filter.name;

                    $scope.fc.bind( name, this );
                    $scope.filterValue = currentFilters.filters[ name ] ? currentFilters.filters[name] : null;

                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, npbFiltersController ) {

                    var name;

                    name = $scope.filter.name;
                    $scope.$on('$destroy', function() {

                        npbFiltersController.unbind(name)
                    });

                    if ($scope.filter.readonly) {

                        $element.find('input').attr('readonly',true);

                    } else {
                        $scope.$watch('filterValue', function( n ) {

                            var v = n === '' ? null : n;
                            npbFiltersController.setState( name, v );
                        });
                    }
                }
            };
        });
})(angular);