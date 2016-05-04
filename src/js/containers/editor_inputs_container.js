/**
 * Created by jacek on 02.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .directive('xfeInputsContainer', function( $compile, inputSets, elementBuilder, $timeout ) {

            return {
                restrict : 'E',
                replace : true,
                templateUrl: 'partials/elements/inputs_container.html',
                compile: function compile() {
                    return {

                        pre : function preLink( scope, element, attr  ) {

                            var body, actionBody, inputs, id;

                            id = scope.id;

                            angular.forEach( element.find('form'), function( form ) {

                                var $form = angular.element(form);

                                if ($form.hasClass('inputs-container')) {

                                    body = $form;
                                }
                                if (body && id) {

                                    body.attr('id',id);
                                    body.attr('name',id);
                                }
                            });

                            angular.forEach( element.find('div'), function( div ) {

                                var $div = angular.element(div);
                                
                                if ($div.hasClass('actions-container')) {
                                    actionBody = $div;
                                }
                            });


                            var build = function ( ) {

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
                            };

                            $timeout( build );

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