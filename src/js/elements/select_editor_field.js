/**
 * Created by jacek on 01.02.16.
 */


(function ( angular ) {

    angular
        .module('npb')
        .directive('npbSelectInput', function( propertyRenderer, dialog, dictionaryWeakSet, weakSetDictionary ) {

            return {

                replace : true,
                restrict: 'E',
                template : '<p data-pseudo-input>{{ displayValue }}</p>',
                controller: function ( $scope ) {
                    
                    this.$valid;
                    
                },
                controllerAs : 'npbSi',
                link : function( scope, element ) {

                    var model, multi, prop, dataSrc, readonly, type, mode, switchMode, validators, required;

                    model = scope.configuration.model;
                    multi = scope.configuration.multi;

                    dataSrc = scope.configuration.data;

                    prop = scope.configuration.displayProperty;
                    readonly = scope.configuration.readonly;
                    type = scope.configuration.type;
                    mode = scope.configuration.selectionMode;
                    switchMode = scope.configuration.switchMode;
                    validators = scope.configuration.validators || [];
                    required = validators.indexOf('required') > -1;
                    

                    function getDialogId() {

                         return { search : 'dictionary_searcher', select : 'dictionary_chooser' }[ type ];
                    }

                    function getConfig( ) {

                        return {
                            data : dataSrc,
                            name : model,
                            mode : mode,
                            multi : multi,
                            displayProperty : prop
                        };
                    }
                    function getState( ) {

                        var value = scope.$eval('$parent.editor.data.'+ model);

                        if ( 'search' === type ) {

                            return value;

                        } else {

                            return dictionaryWeakSet( dataSrc, value );
                        }
                    }

                    function getTitle( ) {

                        return 'Set `'+ scope.configuration.label + '` Value';
                    }

                    function handleOpen() {

                        var did, options, state, title;

                        did = getDialogId();
                        options = getConfig();
                        state = getState();
                        title = getTitle();

                        dialog.open(did, title, {
                            filter : options,
                            state : state
                        });
                    }


                    function handleValue( value) {
                        var ret;
                        ret = value;

                        if (!multi) {

                            ret = value[0];
                        }

                        return ret;
                    }

                    function  valid( d ) {

                        if (
                            !required
                            ||
                            (required && multi && d.length)
                            ||
                            (required && !multi && d !== null && typeof d === 'object')
                        )
                            scope.npbSi.$valid = true;
                        else
                            scope.npbSi.$valid = false;
                    }

                    scope.$watch('$parent.editor.data.'+ model, function( n ) {

                        valid( n );

                        if ( n && (n.length || n.name) ) {


                            var d = propertyRenderer( n, prop, multi );

                            scope.displayValue = d;
                        }
                        else {

                            scope.displayValue = '-';
                        }
                    });



                    scope.$on('dialog:ok', function( $event, options, result ) {

                        var val;

                        if (options.filter && model === options.filter.name) {

                            val = result instanceof WeakSet ? weakSetDictionary( dataSrc, result ) : result;

                            scope.$applyAsync(function() {

                                scope.$parent.editor.data[model] = handleValue( val );
                            });
                        }
                    });

                    if (!readonly && dataSrc) {

                        element.on('click', handleOpen) ;
                    }
                }
            }
        });
})( angular );