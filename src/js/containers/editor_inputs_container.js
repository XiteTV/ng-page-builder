/**
 * Created by jacek on 02.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .directive('xfeInputsContainer', function( $compile, inputSets, elementBuilder ) {

            return {
                restrict : 'E',
                replace : true,
                templateUrl: 'partials/elements/inputs_container.html',
                compile: function compile() {
                    return {

                        pre : function preLink( scope, element, attr  ) {

                            var body, actionBody, inputs;


                            angular.forEach( element.find('div'), function( div ) {
                                var $div = angular.element(div);
                                if ($div.hasClass('inputs-container')) {
                                    body = $div;
                                }
                                if ($div.hasClass('actions-container')) {
                                    actionBody = $div;
                                }
                            });

                            inputs = inputSets.getSet( scope.inputsSet );

                            angular.forEach( inputs, function( inputDefinition ) {

                                var elName, elementTemplate, element, nScope;
                                elName = inputDefinition.element;
                                elementTemplate =
                                    '<div class="form-group">' +
                                    '   <label class="control-label col-md-5">' +
                                    '       {{ configuration.label }}' +
                                    '   </label>' +
                                    '   <div class="col-md-7">' +
                                    '       %%'+
                                    '   </div>' +
                                    '</div>';

                                element = elementBuilder( elName, elementTemplate);
                                nScope = scope.$new();

                                nScope.configuration = inputDefinition;

                                $compile(element)(nScope);

                                body.append(element);
                            });

                            if ( scope.headerActions && scope.headerActions.length ) {

                                angular.forEach( scope.headerActions, function ( elementTemplate ) {

                                    var element = angular.element( elementTemplate );
                                    $compile(element)(scope);
                                    actionBody.append(element);
                                });
                            }
                        }
                    }
                },
            }
        });

})( angular );