/**
 * Created by jacek on 01.02.16.
 */

(function ( angular ) {

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

                            var model, template, multiline, readonly;

                            model = scope.configuration.model;
                            multiline = scope.configuration.multiline;
                            readonly = scope.configuration.readonly;

                            if ( multiline ) {

                                template = '<textarea ng-model="$parent.editor.data.'+ ( model )+'"></textarea>';

                            } else {
                                template = '<input type="text" ng-model="$parent.editor.data.'+ ( model ) +'" />';
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