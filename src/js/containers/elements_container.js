/**
 * Created by jacek on 03.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .directive('npbElementsContainer', function( $compile, elementBuilder ) {

            function dispatchElement( def ) {

                if (angular.isString( def )) {

                    def = { element : def, options : {}};
                }

                return def;
            }

            return {

                replace : true,
                restrict: 'E',
                template : '<npb-container></npb-container>',
                compile : function() {

                    return {
                        pre : function( scope, element, attr ) {

                            scope.$watchCollection( attr.configuration , function( n ) {

                                element.html('');

                                if (!n) {

                                    return;
                                }

                                angular.forEach( n, function( def ) {

                                    var el, dispatched, nScope;
                                    dispatched = dispatchElement( def );

                                    el = elementBuilder( dispatched.element );
                                    nScope = scope.$new();

                                    angular.extend( nScope, dispatched.options );

                                    $compile(el)(nScope);

                                    element.append(el);
                                });
                            });
                        }
                    }
                }
            }
        });
})( angular );