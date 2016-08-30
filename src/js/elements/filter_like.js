/**
 * Created by jacek on 23.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterLike', function( actions ) {

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

                    var name, input;

                    name = $scope.filter.name;
                    input = $element[0].querySelector('input');

                    if ($scope.filter.readonly) {

                        $element.find('input').attr('readonly',true);

                    } else {
                        $scope.$watch('filterValue', function( n ) {

                            var v = n === '' ? null : n;
                            npbFiltersController.setState( name, v );
                        });
                    }

                    var enterListener = function( keyboardEvent ) {

                        if ( keyboardEvent.which !== 13 )
                            return;

                        var data = $scope.$parent.fc.getConditions();
                        data.$event = keyboardEvent;

                        actions.call( 'action:filters', data );

                        keyboardEvent.preventDefault();
                        keyboardEvent.stopPropagation();

                    };

                    input.addEventListener('keydown', enterListener, true );


                    $scope.$on('$destroy', function() {

                        input.removeEventListener('keydown', enterListener, true );
                        npbFiltersController.unbind(name)
                    });
                }
            };
        });
})(angular);