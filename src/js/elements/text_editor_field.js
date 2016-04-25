/**
 * Created by jacek on 01.02.16.
 */

(function ( angular ) {

    var buildValidators = function ( validators ) {

        if (!validators) {
            return '';
        }

        return validators.join(' ')+' ';
    };

    angular
        .module('npb')
        .directive('npbTextInput', function( $compile ) {

            return {

                replace : true,
                restrict: 'E',
                template : '<em></em>',
                compile : function() {

                    return {
                        pre : function( scope, element ) {

                            var model, template, multiline, readonly, validators, validatorsTplChunk;

                            model = scope.configuration.model;
                            multiline = scope.configuration.multiline;
                            readonly = scope.configuration.readonly;
                            validators = scope.configuration.validators;
                            
                            validatorsTplChunk = buildValidators( validators );

                            if ( multiline ) {

                                template = '<textarea '+validatorsTplChunk+'ng-model="$parent.editor.data.'+ ( model )+'"></textarea>';

                            } else {
                                template = '<input type="text" '+validatorsTplChunk+'ng-model="$parent.editor.data.'+ ( model ) +'" />';
                            }


                            var newElement = angular.element( template );

                            if (readonly) {

                                newElement.attr('readonly',true);
                            }

                            $compile( newElement )( scope );
                            element.replaceWith( newElement );
                        }
                    }
                }
            }
        });
})( angular );