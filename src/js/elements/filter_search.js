/**
 * Created by jacek on 24.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterSearch', function( actions ) {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/select.html',
                controller: function( $scope, $element, Dictionary, currentFilters, filterDialogMapper, dialog ) {

                    var name, filter, input, data, state, displayProperty, self;

                    filter = $scope.filter;
                    displayProperty = filter.displayProperty;
                    name = filter.name;
                    data = Dictionary.get(filter.data);
                    input = $element[0].querySelector('.input');
                    self = this;

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

                    this.update = function( selection ) {

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

                        this.update( state );
                    }
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

                    $scope.$on('$destroy', function() {

                        input.removeEventListener('keydown', enterListener, true );
                        input.removeEventListener('keydown', spaceListener, true );
                        npbFiltersController.unbind(name)
                    });

                    if ($scope.filter.readonly) {

                        angular.element( input ).removeAttribute('tabindex');
                        return;
                    }


                    input.addEventListener('keydown', enterListener, true );
                    input.addEventListener('keydown', spaceListener, true );

                    $element.bind('click', function() {

                        $scope.fbc.open();
                    });
                }
            };
        });
})(angular);