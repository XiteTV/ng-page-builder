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
        .directive('npbTextInput', function( $compile, dialog, weakSetDictionary ) {

            return {

                replace : true,
                restrict: 'E',
                template : '<em></em>',
                compile : function() {

                    return {
                        pre : function( scope, element ) {

                            var model, template, multiline, readonly, validators, validatorsTplChunk, autocomplete;

                            model = scope.configuration.model;
                            multiline = scope.configuration.multiline;
                            readonly = scope.configuration.readonly;
                            validators = scope.configuration.validators;
                            autocomplete = scope.configuration.autocomplete;


                            validatorsTplChunk = buildValidators( validators );

                            if ( multiline ) {

                                template = '<textarea '+validatorsTplChunk+'ng-model="$parent.editor.data.'+ ( model )+'"></textarea>';

                            } else {

                                template = '<input type="text" '+validatorsTplChunk+'ng-model="$parent.editor.data.'+ ( model ) +'" />';
                            }

                            function getDialogId() {

                                return { search : 'dictionary_searcher', select : 'dictionary_chooser' }[ autocomplete.mode ];
                            }

                            function getConfig( ) {

                                return Object.assign({
                                    name : model,
                                    multi : false,
                                    displayProperty : 'name'
                                },autocomplete);
                            }

                            var newElement = angular.element( template );

                            if (readonly || autocomplete ) {

                                newElement.attr('readonly',true);
                            }

                            if ( autocomplete ) {

                                newElement.bind( 'click', function() {

                                    dialog.open( getDialogId(), scope.configuration.label, {

                                        filter : getConfig(),
                                        state : new WeakSet()
                                    });
                                });


                                scope.$on('dialog:ok', function( $event, options, result ) {

                                    var val;

                                    if (options.filter && model === options.filter.name) {

                                        val = result instanceof WeakSet ? weakSetDictionary( autocomplete.data, result ) : result;

                                        scope.$applyAsync(function() {

                                            scope.$parent.editor.data[ model ] = val[0][ getConfig().displayProperty ];
                                        });
                                    }
                                });
                            }

                            $compile( newElement )( scope );
                            element.replaceWith( newElement );
                        }
                    }
                }
            }
        });
})( angular );