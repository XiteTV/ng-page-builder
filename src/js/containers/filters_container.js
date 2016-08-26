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
                controller : function( ) {

                    var states = filtersState;
                    var filters = {};
                    

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