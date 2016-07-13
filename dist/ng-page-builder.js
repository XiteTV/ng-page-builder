/**
 * Created by jacek on 13.04.16.
 */

(function ( angular ) {

    angular
        .module('npb',[
            'ngCachedResource'
        ]);


})( angular );
/**
 * Created by jacek on 15.01.16.
 */

(function ( angular) {

    angular
        .module('npb')
        .directive('actionCall', function( actions  ) {

            return {
                restrict : 'A',
                link : function( $scope, $element, $attributes ) {

                    var action, data;

                    $element.on('click', function (event) {

                        action = $scope.$eval($attributes.actionCall);
                        data = $scope.$eval($attributes.actionData) || {};
                        data.$event = event;

                        actions.call( 'action:' + action, data );
                    });
                }
            }
        });

})( angular);
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

                                    $compile( element ) ( nScope );

                                    body.append(element);
                                });
                            };

                            $timeout( function () {

                                $timeout( build );
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
                controller : function($scope) {

                    var states = filtersState;
                    var filters = {};


                    var openFilter;

                    $scope.$on('filter:clicked', function( $event, filter, state ) {

                        var id;
                        id = filterDialogMapper.getIdByType( filter.type );

                        openFilter = filter;

                        dialog.open( id , filter.label, { filter: filter, state: state } );
                    });

                    $scope.$on('dialog:ok', function($event, options, result) {

                        if ( options.filter && openFilter && openFilter.name === options.filter.name) {

                            filters[openFilter.name].update(result);
                        }
                    });

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
/**
 * Created by jacek on 23.02.16.
 */


/**
 * Created by jacek on 12.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterBoolean', function() {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/boolean.html',
                controller: function( $scope, currentFilters ) {

                    var name, filter, state, trueLabel, falseLabel;

                    filter = $scope.filter;
                    name = filter.name;
                    trueLabel = filter.trueLabel || 'True';
                    falseLabel = filter.falseLabel || 'False';

                    $scope.fc.bind( name, this );

                    function render() {

                        if (null === state) {

                            $scope.displayValue = '-';

                        } else if(state) {

                            $scope.displayValue = trueLabel;

                        } else {

                            $scope.displayValue = falseLabel;
                        }
                    }

                    function serialize(value) {
                        if (null === value) {
                            return 'n';
                        } else if (value) {
                            return '1'
                        } else {
                            return '0';
                        }
                    }
                    function deserialize( value ) {

                        if (parseInt(value) === 1) {
                            return true;
                        } else if (parseInt(value) === 0) {
                            return false;
                        } else {
                            return null;
                        }
                    }

                    this.toggle = function () {
                        var n;

                        if( null === state ) {

                            n = true;

                        } else if( true === state ) {

                            n = false;

                        } else  {

                            n = null;
                        }
                        state = n;

                        $scope.$apply(function() {
                            $scope.fc.setState( name, serialize(state) );
                            render();
                        });
                    };

                    state = deserialize( currentFilters.filters[ name ]);
                    $scope.fc.setState(name , currentFilters.filters[ name ] || null);
                    render();

                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, nbpFiltersController ) {

                    var name;

                    name = $scope.filter.name;

                    $scope.$on('$destroy', function() {

                        nbpFiltersController.unbind(name)
                    });

                    if (!$scope.filter.readonly) {

                        $element.on('click', function() {

                            $scope.fbc.toggle();
                        });
                    }
                }
            };
        });
})(angular);
/**
 * Created by jacek on 23.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterLike', function() {

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

                    var name;

                    name = $scope.filter.name;
                    $scope.$on('$destroy', function() {

                        npbFiltersController.unbind(name)
                    });

                    if ($scope.filter.readonly) {

                        $element.find('input').attr('readonly',true);

                    } else {
                        $scope.$watch('filterValue', function( n ) {

                            var v = n === '' ? null : n;
                            npbFiltersController.setState( name, v );
                        });
                    }
                }
            };
        });
})(angular);
/**
 * Created by jacek on 24.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterSearch', function() {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/filter.html',
                controller: function( $scope, Dictionary, currentFilters ) {

                    var name, filter , data, state, single, displayProperty;

                    filter = $scope.filter;
                    displayProperty = filter.displayProperty;
                    name = filter.name;
                    data = Dictionary.get(filter.data);
                    single = !filter.multi;

                    this.open = function() {

                        $scope.$emit('filter:clicked', filter, state );
                    };

                    this.update = function(selection ) {

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
                        this.update(state);
                    }
                    _construct.call(this);
                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, npbFiltersController ) {

                    var name;

                    name = $scope.filter.name;

                    $scope.$on('$destroy', function() {

                        npbFiltersController.unbind(name)
                    });

                    if ($scope.filter.readonly) return;

                    $element.bind('click', function() {

                        $scope.fbc.open();
                    });
                }
            };
        });
})(angular);
/**
 * Created by jacek on 23.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('npbFilterSelect', function() {

            return {
                replace: true,
                restrict: 'E',
                require : '^npbFiltersContainer',
                templateUrl : 'partials/ui/filter/select.html',
                controller: function( $scope, Dictionary, currentFilters ) {

                    var name, filter , data, state, single, displayProperty;

                    filter = $scope.filter;
                    name = filter.name;
                    data = Dictionary.get( filter.data );
                    single = !filter.multi;
                    displayProperty = filter.displayProperty;


                    this.open = function() {

                        $scope.$emit('filter:clicked', filter, state );
                    };

                    this.update = function ( wSet ) {

                        var i, value, display;
                        state = wSet;
                        value = [];
                        display = [];


                        for( i in data ) {

                            if ( wSet.has(data[i]) ) {

                                display.push( data[i][displayProperty] );
                                if (single ) {

                                    value = data[i].id;
                                    break;

                                } else {

                                    value.push( data[i].id );
                                }
                            }
                        }

                        $scope.fc.setState(name, value);

                        this.displayValue = display.length ? display.join(', ') : '-';
                    };

                    function _in( id, array) {

                        var i;

                        return (angular.isArray( array ) && _.contains(array,id)) || ( array == id);
                    }

                    function _construct( ) {


                        var stateValue, i ;

                        stateValue = currentFilters.filters[name];

                        state = new WeakSet();

                        if (stateValue) {

                            angular.forEach(data, function( item ) {

                                if (_in(item.id, stateValue)) {

                                    state.add(item);
                                }
                            });
                        }
                        $scope.fc.bind( name, this );
                        this.update(state);
                    };

                    _construct.call(this);
                },
                controllerAs : 'fbc',
                link : function( $scope, $element, $attributes, npbFiltersController ) {

                    var name;

                    name = $scope.filter.name;

                    $scope.$on('$destroy', function() {

                        npbFiltersController.unbind(name)
                    });

                    if ($scope.filter.readonly) {

                        return;
                    }

                    $element.bind('click', function() {

                        $scope.fbc.open();
                    });

                }
            };
        });
})(angular);
/**
 * Created by jacek on 01.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .directive('searchEditorField', function( ) {

            return {

                replace : true,
                restrict: 'E',
                template : '<div >{{ displayValue }}</div>',
                link : function( $scope, $element, attributes ) {


                },
                controllerAs : 'inputCtrl',
                controller : function() {

                }
            }
        });

})( angular );
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

                    var model, multi, prop, dataSrc, readonly, type, mode, switchMode, validators, settings, required;

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
/**
 * Created by jacek on 17.02.16.
 */

(function (angular) {

    angular
        .module('npb')
        .directive('svgIcon',function() {

            const regexp = /^\@(.+)/;

            return {
                replace: true,
                restrict: 'E',
                template: function(tEelement,tAttributes) {

                    if (!tAttributes.src) {
                        throw new Error('Svg Icon Error! src argument must be specified');
                    }

                    var icon = tAttributes.src;

                    if (regexp.test(icon)) {

                        icon = "{{ iconId }}";
                    }

                    return '<svg><use xlink:href="'+icon+'"></use></svg>';
                },
                link : function($scope, $element, $attributes) {

                    const rr = regexp.exec($attributes.src);

                    if (rr) {

                        const iconPath = rr[1];

                        $scope.$watch(iconPath, function(n) {

                            if (n) {
                                $scope.iconId = n;
                            }
                        });
                    }
                }
            }
        });
})(angular);
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
/**
 * Created by jacek on 25.02.16.
 */


(function ( angular ) {

    angular
        .module('npb')
        .filter('name', function() {

            return function ( object ) {

                return object && object.name || '-';
            }
        })
        .filter('names', function( nameFilter ) {

            return function ( arrayOfObjects ) {

                if (!arrayOfObjects.length) {
                    return '-';
                }

                return _.map( arrayOfObjects, function( item) {
                    return nameFilter( item );
                }).join(', ');
            }
        })
        .filter('join', function() {

            return function ( array ) {

                return array && array.length > 0 && array.join(', ') || '-';
            }
        })
})( angular );
/**
 * Created by jacek on 02.03.16.
 */

(function ( angular ) {



    function ActionsHandler( actions, $injector, $rootScope ) {

        this.call = function( actionName, payload ) {

            $rootScope.$broadcast( actionName, payload );
        };

        function getLocals( $event, $payload, $action ) {
            return {
                $event : $event,
                $action : $action,
                $payload : $payload
            };
        }

        function _construct() {

            angular.forEach( actions, function( handlers, actionName ) {

                angular.forEach( handlers, function( handler ) {

                    $rootScope.$on( actionName, function( $event, payload ) {

                        $injector.invoke(
                            handler, //we invoke handler fn
                            handler, // in their scope
                            getLocals( $event, payload, actionName ) // with our locals
                        );
                    });
                });
            });
        }

        _construct.call( this );
    }


    angular
        .module('npb')
        .provider('actions', function ActionsProvider() {

            /**
             * Action folder
             * @type {{}}
             */
            var actions = {};

            this.addHandler = function( actionName, handlerFn ) {

                if ( !actions[ actionName ] ) {
                    actions[ actionName ] = [];
                }

                actions[ actionName ].push( handlerFn );
                return this;
            };

            this.$get = function ( $injector, $rootScope ) {

                return new ActionsHandler( actions, $injector, $rootScope );
            };
        });

})( angular );
/**
 * Created by jacek on 25.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .provider('columns', function ColumnsProvider() {

            var columns, self, columnDefault;

            self = this;
            columns = {};
            columnDefault = {

                header : null,
                property : null,
                sortable : false,
                filter: null,
                on : null,
                resolver : null,
                visible : true,
                hide_able : true
            };


            this.add = function( id, definition ) {

                var newDef;

                if ( id in columns ) {

                    throw new Error('columnsProvider Conflict! Column `'+id+'` already exists!');
                }

                newDef = { };
                newDef[ id ] = definition;

                columns = Object.assign( newDef, columns );
            };

            this.addAll = function( defintions ) {

                angular.forEach( defintions, function( definition, id ) {

                    self.add(id,definition);
                });
            };

            function ColumnsHandler( ) {

                this.get = function( id, override ) {

                    if ( typeof columns[ id ] === 'undefined' ) {

                        return new Error('ColumnHandler Error! Column `'+id+'` does not exists!');
                    }

                    return Object.assign( { id: id }, columnDefault, columns[ id ], override || {});
                };

                this.lazyGet = function ( column ) {

                    var id, override, isArray;

                    isArray = angular.isArray( column );

                    override =  isArray && column[ 1 ] || { };
                    id = isArray && column[ 0 ] || column;

                    return this.get( id, override );
                };
            };

            this.$get = function columnsHandlerFactory() {

                return new ColumnsHandler();
            };

        });

})( angular );
/**
 * Created by jacek on 05.01.16.
 */

/**
 * @param angular
 */
(function( angular ) {

    var pageHierarchy;

    var flat = {};

    function buildTree( pref, container ) {

        var reg = new RegExp('^'+pref+':?([^:]+|\@)$');

        angular.forEach( flat, function( item, key ) {

            var matches = reg.exec( key );
            if ( matches ) {

                container.addMember( matches[1], item );
                buildTree( key, item );
            }
        });
    }

    function buildKey( sectionName, contentName, contentPartName ) {

        function d(v) {return v && angular.isString(v) ?':'+v:''}
        return sectionName+d(contentName)+d(contentPartName);
    }

    /**
     *
     * @param config
     * @param objParent
     * @constructor
     */
    function ContentPageDefinition( config, objParent ) {

        var parent = null;
        var members = {};

        this.abstract = false;
        this.status = 200;
        this.title = null;
        this.contentLoader = null;
        this.columnSet = null;
        this.defaultClumnSet = null;
        this.filterSet = null;
        this.defaultFilterSet = null;
        this.editor = null;
        this.highlighter = null;
        this.aside = null;
        this.wildCardResolver = null;
        this.initialFilterValues = {};
        this.contextMenu = null;
        this.pageMenu = null;

        this.getMembers = function() {

            return members;
        };

        this.setParent = function ( contentPageDefinition ) {

            if (contentPageDefinition && contentPageDefinition instanceof ContentPageDefinition) {

                parent = contentPageDefinition;
            }
        };

        this.getParent  = function() {

            return parent;
        };

        this.addMember = function( memberName, objMember ) {

            objMember.setParent( this );
            members[ memberName ] = objMember;
        };

        this.hasMember = function( memberName ) {

            return (members[memberName] && members[memberName] instanceof ContentPageDefinition);
        };

        this.getMember = function( memberName ) {

            return members[ memberName ] || new ContentPageDefinition( { status: 404 } );
        };

        this.getContentLoader = function( ) {

            return this.contentLoader || ( parent instanceof ContentPageDefinition ? parent.getContentLoader() : null);
        };

        this.getTitle = function() {

            return this.title || ( parent instanceof ContentPageDefinition ? parent.getTitle() : null);
        };

        this.getColumnSet = function() {

            return this.columnSet || ( parent instanceof ContentPageDefinition ? parent.getColumnSet() : null);
        };

        this.getDefaultColumnSet = function() {

            return this.defaultClumnSet || ( parent instanceof ContentPageDefinition ? parent.getDefaultColumnSet() : null);
        };

        this.getFilterSet = function( ) {

            return this.filterSet || ( parent instanceof ContentPageDefinition ? parent.getFilterSet() : null );
        };

        this.getDefaultFilterSet = function() {

            return this.defaultFilterSet || ( parent instanceof ContentPageDefinition ? parent.getDefaultFilterSet() : null);
        };

        this.getInitialFilterValues = function() {

            return this.initialFilterValues || ( parent instanceof ContentPageDefinition ? parent.getInitialFilterValues() : null);
        }

        this.getEditor = function() {

            return this.editor || ( parent instanceof ContentPageDefinition ? parent.getEditor() : null);
        };

        this.getHighlighter = function() {

            return this.highlighter || ( parent instanceof ContentPageDefinition ? parent.getHighlighter() : angular.noop);
        };

        this.getAside = function( ) {

            return this.aside || ( parent instanceof ContentPageDefinition ? parent.getAside() : null);
        };

        this.getContextMenu = function( ) {
            return this.contextMenu || ( parent instanceof ContentPageDefinition ? parent.getContextMenu() : null);
        };

        this.getPageMenu = function ( ) {

            return this.pageMenu || ( parent instanceof  ContentPageDefinition ? parent.getPageMenu() : null);
        };

        function __constructor( config, objParent ) {

            if (objParent && objParent instanceof ContentPageDefinition) {

                parent = objParent;
                parent.addMember(this);
            }

            angular.extend(this, config);
        }

        __constructor.call( this, config, objParent );
    }

    function ContentPage( ) {

        this.findDefintion = function findDefinition( sectionName, contentName, contentPartName ) {

            var definition = null;

            var key = buildKey( sectionName, contentName, contentPartName );

            //find hard coded pages
            if (flat[key] && flat[key] instanceof ContentPageDefinition) {

                definition = flat[key];

            } else {

                var wildCard = key.replace(/^(.+):([^:])+$/,'$1:@');

                definition = flat[ wildCard ] || null;
            }

            return definition || { stats : 404 };
        };
    }

    angular
        .module('npb')
        .provider('contentPage', function ContentPageProvider() {

            pageHierarchy = new ContentPageDefinition();

            /**
             * @private
             * @param args
             */
            function checkArguments( args ) {

                var l, i, n;

                l = args.length;

                if ( 2 > l || 4 < l )
                {
                    throw new Error('ContentPageProvider Error. Wrong addPage method call. ' +
                        'Expected at least 2 but max 4 args!', 'content_page_provider_args_num_out_of_range');
                }
                if ( !angular.isObject(args[l-1]) )
                {
                    throw new Error('ContentPageProvider Error. Last argument must be a page definition object!',
                        'content_page_provider_last_arg');
                }

                for ( i = 0; i < l - 1; i++)
                {
                    if ( args.hasOwnProperty( i ) && !angular.isString( args[ i ] ) )
                    {
                        n = (i+1).toString();
                        throw new Error('ContentPageProvider Error. Wrong addPage method call. '+n+' argument' +
                            ' must be a string', 'content_page_provider_page_identification');
                    }
                }
            }

            /**
             *
             * @param contentPageDefinitionConfig
             */
            this.setBaseConfig = function setBaseConfig( contentPageDefinitionConfig ) {

                pageHierarchy  = new ContentPageDefinition( contentPageDefinitionConfig );
            };

            /**
             *
             * @param string 1st sectionName required
             * @param string 2nd optional [contentName]
             * @param string 3rd optional [contentPartName]
             * @param object last config required
             */
            this.addPage = function addPage( sectionName, contentName, contentPartName, config ) {

                checkArguments( arguments );

                //function d(v) {return v && angular.isString(v) ?':'+v:''}
                //var key = sectionName+d(contentName)+d(contentPartName);

                var key = buildKey(sectionName,contentName,contentPartName);

                function a(l) { return l[l.length - 1]; }
                var conf =a(arguments);

                flat[key] = new ContentPageDefinition(conf, null);

                return this;
            };

            this.$get = function ContentPageFactory() {

                buildTree( '', pageHierarchy );

                return new ContentPage();
            };
        });

})( angular );
/**
 * Created by jacek on 13.01.16.
 */

(function(angular) {

    var configs = {};

    function Dialogs() {

        this.get = function( name ) {

            if (!configs[name]) {

                throw new Error('Dialogs Error! Dialog `'+name+'` doesn\'t exists!','dialog_does_not_exists');
            }

            return configs[ name ];
        }
    }

    angular
        .module('npb')
        .provider('dialogs', function DialogsProvider() {

            this.add = function addDialog( name, config ) {

                if ( 'undefined' === typeof configs[name]) {

                    configs[ name ] = config;
                }

                return this;
            };

            this.$get = function DictionaryFactory() {

                return new Dialogs();
            };
        });

})( angular );
/**
 * Created by jacek on 05.01.16.
 */

(function(angular) {

    var configs = {};

    function Dictionary( $q, $injector ) {

        var data;
        data = {};

        this.get = function( name ) {

            return data[ name ];
        };

        this.prefetch = function( ) {

            var promises;

            promises = [];


            angular.forEach(configs, function( definition, name ) {

                var service;
                var hasEmbeddedData;
                var resource;

                resource = definition.resource;
                hasEmbeddedData = angular.isArray( resource );

                if ( hasEmbeddedData ) {

                    data[name] = resource;
                }
                else if ( definition.prefetch ) {

                    service = $injector.get(resource);
                    data[name] = service.query();
                    promises.push(data[name].$promise);
                }
                else {

                    data[name] = $injector.get(resource);
                }

            }.bind( this ));

        };
    }

    angular
        .module('npb')
        .provider('Dictionary', function DictionaryProvider() {

            this.add = function addDictionary( name, config ) {

                if ( 'undefined' === typeof configs[name]) {

                    configs[ name ] = config;
                }

                return this;
            };

            this.$get = function DictionaryFactory( $q, $injector ) {

                return new Dictionary( $q, $injector );
            };
        });

})( angular );
/**
 * Created by jacek on 02.02.16.
 */

(function ( angular ) {

    var relationTypes = { select : true, search : true };

    function InputConfig( config ) {

        var defaults = {

            type : 'normal', //allowed values are: normal, select, search, extra
            label : null, // for any type
            readonly : false, // change to true for lock edition posobility, for any type
            model : null, // name of edit object field, for any type
            data : null, // name of dictionary for work with, for search and select type
            allowNew : false, // determine if we can create new relation on this field, for search and select type
            multi: false, // false means relation n:1, true relation n:m , for search and select type
            switchMode: false, // this one negate selection method basing on `multi` flag (eg. if `multi` and `switchMode` are true then we'll select single value for this field)
            displayProperty : 'name', // which property we should use to render state, for search and select type
            multiline : false , // true means textarea, only for normal type
            directive : null //input element name, ony for extra type
        };

        function __construct() {

            angular.extend( this, defaults, config );
        }
        __construct.call(this);
    }

    InputConfig.prototype = {

        extend : function( config ) {

            var copy = new InputConfig( this );
            return angular.extend( copy, config );
        },
        get selectionMode ( ) {

            var mode, flag;

            if (! ( this.type in relationTypes )) {

                mode = null;
            }

            flag = this.switchMode ? !this.multi : this.multi;

            return flag ? 'multi' : 'single';
        },
        get element() {

            var map = { normal : 'npb-text-input', search: 'npb-select-input',
                select: 'npb-select-input', extra : this.directive };

            return map[ this.type ];

        }
    };

    function InputsHolderProvider() {

        var inputConfigs = {};

        this.add = function( name, config ) {

            if ( inputConfigs[ name ] instanceof InputConfig ) {

                throw new Error('InputsProvider Error! Input : `' + name + '` already exists','inputs_provider_name_in_use');
            }

            inputConfigs[ name ] = new InputConfig( config );
            return this;
        };

        this.addAll = function( configsHash ) {
            var p;

            for ( p in configsHash ) {

                if (configsHash.hasOwnProperty( p )) {

                    this.add( p, configsHash[ p ]);
                }
            }

            return this;
        };

        this.$get = function inputsHolderFactory( ) {

            function InputsHolder() {

            }

            InputsHolder.prototype = {

                getDefinition : function ( name, override ) {

                    if ( ! (inputConfigs[ name ] instanceof InputConfig)) {

                        throw new Error('InputsHolder Error! Input: `' + name +'` is not defined');
                    }

                    return inputConfigs[ name ].extend( override || {});
                }
            };

            return new InputsHolder();
        };
    }

    angular
        .module('npb')
        .provider('inputs', InputsHolderProvider );

})( angular );
/**
 * Created by jacek on 12.01.16.
 */


(function (angular) {

    var filterTypes,//:hash with templates Urls
        filters, //:hash with allRegistered Filters
        filterDefaults;//:hash default filter configuration

    filterTypes = {

        like : {
            element : '<npb-filter-like />'
        },
        boolean : {
            element : '<npb-filter-boolean />'
        },
        search : {
            element : '<npb-filter-search />'
        },
        select : {
            element : '<npb-filter-select />'
        }
    };

    filters = {};

    filterDefaults = {
        name : null,
        type: 'like',
        nullable: true,
        defaultValue: null,
        readonly: false,
        multi: false,
        displayProperty : 'name'
    };

    function FilterDefinition( config ) {

        angular.extend(this, filterDefaults, config || {});

        function __validate() {
            if (!this.name) {

                throw new Error('FilterDefinition Error. Name in not defined!','filter_definition_name_not_defined');
            }
            if (!this.type in filterTypes) {
                throw new Error('FilterDefinition Error. filter type must be one of: `'
                    +Object.keys(filterTypes).join(', ')+'`.','filter_definition_wrong_type');
            }
        }
        __validate.call(this);
    }

    FilterDefinition.prototype = {
        //deprecated
        get kbDriven() {

            return ( this.type in { like : 1, sLike : 1 });
        },
        get element() {

            return filterTypes[ this.type].element;
        }
    };

    function FilterHandler( ) {

    }

    FilterHandler.prototype.get = function( name, override ) {

        var filter, filterOverride;

        if (!name) {

            throw new Error('FilterHandler Error. Filter\'s name is required.'
                ,'filter_handler_get_filter_name_is_required');
        }
        else if (!filters[name]) {

            throw new Error('FilterHandler Error. Fiter \''+name+'\' is not defined.'
                ,'filter_handler_get_filter_is_not_defined');
        }

        filter = filters[name];

        if (override && angular.isObject(override)) {

            filterOverride = new FilterDefinition({name:1});
            angular.extend(filterOverride,filter,override);
            return filterOverride;
        } else {
            return filter;
        }
    };
    FilterHandler.prototype.resolve = function( entry ) {

        if (angular.isString( entry )) {
            return this.get(entry);
        }
        else if (angular.isArray(entry) && entry.length === 2) {
            return this.get(entry[0],entry[1]);
        }
    };


    angular
        .module('npb')
        .provider('filters', function() {

            this.setDefaults = function ( config ) {

                angular.extend( filterDefaults, config );
            };

            this.add = function( name, config ) {

                filters[ name ] = new FilterDefinition( config );

                return this;
            };

            this.addAll = function( filtersHash ) {

                var p;

                for (p in filtersHash) {

                    if (filtersHash.hasOwnProperty(p)) {

                        filtersHash[p] = new FilterDefinition( filtersHash[p] );
                    }
                }

                angular.extend(filters,filtersHash);

                return this;
            };

            this.$get = function FiltersFactory() {

                return new FilterHandler();
            };
        })
        .factory('currentFilters', function () {

            return {
                filters : {},
                update : function( value ) {

                    this.filters = value;
                }
            };
        });

})( angular );
/**
 * Created by jacek on 03.02.16.
 */

(function ( angular ) {

    var inputSets;

    inputSets = {};

    function inputsSetsFactory( inputs ) {

        function resolveInput( input ) {

            if (angular.isObject(input)) {

                return inputs.getDefinition(input.name, input.setting );
            } else {
                return inputs.getDefinition(input, {} );
            }
        }

        function resolveSet( inputSet ) {

            var i, r;

            r = [];

            for ( i in inputSet ) {

                if ( inputSet.hasOwnProperty(i) ) {

                    r.push( resolveInput( inputSet[i] ));
                }
            }
            return r;
        }

        function InputSets( ) {

        }

        InputSets.prototype.getSet = function( setName ) {
            //looking for named set
            if ( angular.isString(setName) && ! inputSets[ setName ]) {

                throw new Error('InputSets Error! Set named `'+setName+'` doesn\'t exists!',
                    'input_sets_set_does_not_exists');
            }
            else if (angular.isString(setName) && inputSets[ setName ]) {

                return resolveSet( inputSets[ setName ]);
            }
            else if (angular.isArray(setName)) {

                return resolveSet( setName );
            }
            else {
                throw new Error('Cant handle input set');
            }
        };

        return new InputSets();
    }

    function InputSetsProvider() {

        this.add = function( setName, inputSet ) {

            if ( angular.isArray( inputSets[ setName ])) {

                throw new Error('InputSetsProvider Error! Set named `' + setName +'` already exists'
                    ,'input_sets_provider_set_already_exists');
            }

            inputSets[ setName ] = inputSet;
        }

        this.$get = inputsSetsFactory;
    }

    angular
        .module('npb')
        .provider('inputSets', InputSetsProvider);

})( angular );
/**
 * Created by jacek on 25.03.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .provider('message', function() {

            var messages = {};
            var fallback = [
                {
                    test : /error|fail/i,
                    message : 'Error!'
                },
                {
                    test : /success|successful|/i,
                    message: 'OK!'
                }
            ];

            var findCallback = function ( id ) {

                for( var i in fallback ) {

                    if ( fallback.hasOwnProperty(i) && fallback[i].test.test( id )) {

                        return fallback[ i ].message;
                    }
                }
            };

            /**
             * Messages handler
             * @constructor
             */
            function MessageHandler() {

                /**
                 *
                 * @param tplId string
                 * @param fallback string
                 * @returns string
                 */
                this.getRawMessage = function( tplId, fallback ) {

                    var message;

                    if ( typeof messages[tplId] === 'undefined' && !fallback) {

                        console.warn('Message `%s` is not registered. You can customize this message instead of using fallback', tplId );

                        message = findCallback( tplId );

                    }
                    else if ( typeof messages[tplId] === 'undefined' && fallback ) {

                        message = fallback;
                    }
                    else {

                        message = messages[ tplId ];
                    }

                    if (!message) {

                        throw new Error('Message `' + tplId + '` is not registered and dont match any fallback');
                    }

                    return message;
                };

                /**
                 *
                 * @param tplId string
                 * @param content object
                 * @param fallback string
                 * @returns string
                 */
                this.getMessage = function( tplId, content, fallback ) {

                    var messageFormat = this.getRawMessage( tplId, fallback );

                    return stringFormat( messageFormat, content );
                };
            }

            this.addMessage = function( msgId, msgFormat ) {

                if (!typeof messages[ msgId ] === 'undefined') {

                    throw new Error('Message "'+msgId+'" already exists. Existing format: "'
                        +messages[msgId]+'" was attempt to change by "'+msgFormat+"");
                }

                messages[ msgId ] = msgFormat;
            };

            this.addAll = function( messagesMap ) {

                angular.forEach( messagesMap, function( msgFormat, msgId ) {

                    this.addMessage( msgId, msgFormat );

                }.bind(this));
            };

            this.setFallback = function ( userFallback ) {

                fallback = userFallback;
            };

            this.$get = function messageHandlerFactory() {

                return new MessageHandler();
            };
        });

})( angular );
/**
 * Created by jacek on 22.03.16.
 */

(function ( angular ) {

    function Message( notifier, level, text ) {

        this.level = level;
        this.read = false;
        this.text = text;

        this.close = function( ) {

            notifier.messages.splice( notifier.messages.indexOf( this ) , 1 );
        };
    }

    function Task( notifier, text ) {

        this.text = text;
        this.level = 'progress';

        /**
         *
         * @type {float|null}
         */
        this.progress = null;
        this.onResolve = angular.noop;

        this.resolve = function( level, msg ) {

            this.level = level;
            this.onResolve(this);

            if (level === 'error') {

                notifier.message( level, msg || text );

            } else {

                notifier.notify( level, msg || text );
            }

            notifier.tasks.splice( notifier.tasks.indexOf( this ) , 1 );
        };

        /**
         *
         * @param progress float
         */
        this.setProgress = function ( progress ) {
            this.progress = progress;
        }
    }

    function  Notifier( notifyHandler ) {

        this.tasks = [];
        this.messages = [];
        this.notifyHandler = notifyHandler;
    }

    Notifier.prototype = {

        message : function createMessage( level, text ) {

            var message = new Message( this, level, text );
            this.messages.unshift(message);

            return message;
        },

        task : function createTask( text ) {

            var task = new Task( this, text );
            this.tasks.unshift( task );
            return task;
        },

        notify : function pushNotify( level, text ) {

            this.notifyHandler( level, text );
        }
    };

    angular
        .module('npb')
        .provider('notifier', function NotifierProvider() {

            var notifyHandler = angular.noop;

            this.registerNotifyHandler = function( handler ) {

                notifyHandler = handler;
            };

            this.$get = function notifierFactory ( $injector ) {

                var notifyHandlerResolved = notifyHandler;

                if (angular.isString( notifyHandler )) {

                    notifyHandlerResolved = $injector.get( notifyHandler );
                }

                return new Notifier( notifyHandlerResolved );
            };
        });

})( angular );
/**
 * Created by jacek on 12.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .factory('dialog', function( $rootScope, $q ) {

            function Dialog() {


                this.title = null;
                this.options = null;

                this.open = function( id, title, options ) {

                    this.title = title;
                    this.options = options;

                    $rootScope.$broadcast('dialog:open', id, title, options);
                };

                this.ok = function( callback ) {

                    var result = callback();
                    $rootScope.$broadcast('dialog:ok', this.options, result );

                    this.close();
                };

                this.close = function() {

                    $rootScope.$broadcast('dialog:close');
                };
            };

            return new Dialog();
        });
})(angular);
/**
 * Created by jacek on 05.02.16.
 */

(function ( angular ) {


    function dictionaryWeakSetFactory( Dictionary ) {

        return function dictionaryWeakSet( dictionaryName, value ) {

            var dictionary, ws;

            ws = new WeakSet();
            if (value === null || typeof value === 'undefined') {

                return ws;
            }

            dictionary = Dictionary.get( dictionaryName );

            if (!angular.isArray( value )) {

                value = [value];
            }

            angular.forEach( value , function( vi ) {

                angular.forEach( dictionary, function( di ) {

                    if (vi.id === di.id) {

                        ws.add( di );
                    }
                });
            });

            return ws;
        }
    }

    function weakSetDictionaryFactory(Dictionary) {

        return function weakSetDictionary( dictionaryName, ws ) {

            var dictionary, a;
            dictionary = Dictionary.get( dictionaryName );
            a = [];

            angular.forEach( dictionary, function( item ) {
                if (ws.has(item)) {
                    a.push(item);
                }
            });

            return a;
        }
    }



    angular
        .module('npb')
        .factory('dictionaryWeakSet', dictionaryWeakSetFactory )
        .factory('weakSetDictionary', weakSetDictionaryFactory );

})( angular );
/**
 * Created by jacek on 04.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .factory('elementBuilder', function() {

            return function elementBuilder( element, wrapper ) {

                var template;

                template = '<' + (element) + '></' + (element) + '>';

                if ( wrapper ) {

                    template = wrapper.replace('%%', template);
                }

                return angular.element(template);
            }
        });
})( angular );
/**
 * Created by jacek on 13.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .constant('filterTypeDialogIdMap', {
            'select' : 'dictionary_chooser',
            'search' : 'dictionary_searcher'
        })
        .factory('filterDialogMapper', function( filterTypeDialogIdMap ) {

            function FilterDialogMapper() {

                this.getIdByType = function ( type ) {

                    return filterTypeDialogIdMap[ type ];
                };
            }

            return new FilterDialogMapper();
        });
    
})( angular );
/**
 * Created by jacek on 24.03.16.
 */

(function (angular) {
    angular
        .module('npb')
        .factory('keyboard', function (ObservableDecorator) {

            var namedKeyMap = {

                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                ENTER: 13,
                ESC: 27,
                BACKSPACE: 8,
                SPACE: 32
            };

            var switchKeyMap = {

                SHIFT: 4,
                CTRL: 2,
                ALT: 1
            };

            function getNamedKey(code) {

                var p;

                for (p in namedKeyMap) {

                    if (namedKeyMap.hasOwnProperty(p) && namedKeyMap[p] === code)

                        return p;
                }
            }

            function getBitSignature(event) {

                var bitMap = 0;

                if (event.shiftKey) {

                    bitMap |= 4;
                }

                if (event.ctrlKey || event.metaKey) {

                    bitMap |= 2;
                }

                if (event.altKey) {

                    bitMap |= 1;
                }

                return bitMap;
            }

            function normalizeStroke(stroke) {

                var r = /(SHIFT|CTRL|ALT)?\+?(SHIFT|CTRL|ALT)?\+?(SHIFT|CTRL|ALT)?\+?(LEFT|RIGHT|UP|DOWN|ENTER|ESC|BACKSPACE|SPACE|[A-Z])/;

                if (!r.test(stroke)) {
                    throw new Error('Keyboard stroke syntax error. :' + stroke + ' is not valid!');
                }

                var matches = r.exec(stroke);
                var bitMap = 0;

                for (var i = 1; i < 4; i++) {

                    if (matches[i] && switchKeyMap[matches[i]]) {
                        bitMap |= switchKeyMap[matches[i]];
                    }
                }

                return bitMap + '_' + matches[4];
            }

            function KbDispatcher() {

                var self = this;

                function dispatch(event) {

                    var bitSignature = getBitSignature(event);

                    var eventName = bitSignature + '_' + (  getNamedKey(event.which) || String.fromCharCode(event.which) );

                    if (self.__events[eventName]) {

                        event.preventDefault();
                        event.stopPropagation();
                        self.triggerEvent(eventName);
                        return false;
                    }
                }

                this.bindMap = function (map, context) {

                    angular.forEach(map, function (handler, keyStroke) {

                        var normalizedStroke = normalizeStroke(keyStroke);
                        this.on(normalizedStroke, handler, context);

                    }.bind(this));
                };

                this.unbindMap = function (map, context) {

                    angular.forEach(map, function (handler, keyStroke) {

                        var normalizedStroke = normalizeStroke(keyStroke);
                        this.un(normalizedStroke, handler, context);

                    }.bind(this));
                };

                window.addEventListener('keydown', dispatch, false);
                ObservableDecorator.decorate(this);
            }

            return new KbDispatcher();
        });

})(angular);
/**
 * Created by jacek on 30.03.16.
 */

(function ( angular ) {


    angular
        .module('npb')
        .factory('$localStorage', function() {

            function LocalStorage( ) {}

            LocalStorage.prototype = {

                getItem : function( itemId, defaults ) {

                    if (null === localStorage.getItem( itemId ) && defaults) {

                        this.setItem( itemId, defaults);
                    }

                    return JSON.parse( localStorage.getItem( itemId ));
                },
                setItem : function( itemId, value ) {

                    localStorage.setItem( itemId, JSON.stringify( value ));
                },
                removeItem : function( itemId ) {

                    localStorage.removeItem( itemId );
                }
            }

            return new LocalStorage();
        })
})( angular );
/**
 * Created by jacek on 24.03.16.
 */

(function ( angular ) {

    function ObservableDecorator() {

        this.decorate = function (object) {

            object.__proto__.__events = {};

            object.__proto__.on = function (event, callback, context) {

                if (!this.__events[event]) {

                    this.__events[event] = [];
                }

                var call = {
                    fn: callback,
                    ctx: context
                };

                this.__events[event].push(call);
            };

            object.__proto__.un = function (event, callback, context) {

                if (this.__events[event]) {

                    var calls = this.__events[event];

                    for (var i in calls) {

                        if ( calls.hasOwnProperty(i)
                            && angular.equals(calls[i].fn,callback)
                            && angular.equals(calls[i].ctx,context)) {

                            calls.splice(i,1);
                        }
                    }
                }
            };

            object.__proto__.triggerEvent = function () {

                var call;
                var eventName;
                var args = [];

                for (var i in arguments) {

                    if (arguments.hasOwnProperty(i)) {

                        args.push(arguments[i]);
                    }
                }

                eventName = args.shift();

                if (this.__events[eventName]) {

                    for (var p in this.__events[eventName]) {

                        if (this.__events[eventName].hasOwnProperty(p)) {

                            call = this.__events[eventName][p];

                            if (call.ctx) {

                                call.fn.apply(call.ctx, args);
                            } else {

                                call.fn.apply(this, args);
                            }

                        }
                    }
                }
            };
        };
    }

    angular
        .module('npb')
        .service('ObservableDecorator', ObservableDecorator);

})( angular );
/**
 * Created by jacek on 18.01.16.
 */


(function ( angular ) {

    function UrlParameters() {

        this.parse = function( str ) {

            return JSON.parse(str);
        };

        this.stringify = function( obj ) {

            var params, i, p;
            params = {};
            i = 0;

            function __appear( value ) {

                var emptyArray;
                emptyArray = angular.isArray(value) && value.length === 0;
                return !( value === null || typeof value === 'undefined' || emptyArray );
            }

            for ( p in obj ) {

                if ( obj.hasOwnProperty(p) &&  __appear(obj[p])) {

                    i++;
                    params[ p ] = obj[ p ];
                }
            }

            return i ? JSON.stringify( params ) : null;
        };
    }

    angular
        .module('npb')
        .service('urlParameters', UrlParameters);

})( angular );
/**
 * Created by jacek on 03.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .factory('propertyRenderer', function() {


            return function propertyRenderer( obj, property, multi) {

                var collection, i, a;

                a = [];

                if (multi) {
                    collection = obj;
                } else {
                    collection = [obj];
                }

                for ( i in collection ) {

                    if (collection.hasOwnProperty(i)) {

                        a.push( collection[i][property] );
                    }
                }

                return a.join(', ');
            }
        });

})( angular );
/**
 * Created by jacek on 08.02.16.
 */

(function ( angular ) {

    angular
        .module('npb')
        .service('resourceHandler', function() {

            function ResourceHandler() {}

            ResourceHandler.prototype = {

                persistState : function( resource ) {

                    resource.$serverState = {};

                    angular.forEach( resource, function( item, key) {

                        resource[ key ] = _.clone( item );
                    });

                    return resource;
                },
                restoreState : function( resource ) {

                    if (!resource.$serverState) {

                        resource.$get();
                    }

                    angular.forEach( resource.$serverState, function( item, key) {

                        resource[key] = _.clone(item);
                    });

                },
                stateDiff : function (resource) {

                    var p;
                    var dataToPatch;

                    dataToPatch= {};

                    if (typeof resource.$serverState === 'undefined') {

                        return dataToPatch = resource;
                    }

                    var serverState = resource.$serverState;

                    for ( p in serverState ) {

                        if (serverState.hasOwnProperty(p) && !angular.equals(resource[p], serverState[p])) {

                            dataToPatch[p] = resource[p];
                        }
                    }

                    for ( p in resource ) {

                        if ( resource.hasOwnProperty(p) && !serverState.hasOwnProperty(p) && /^[^\$]/.test(p) ) {

                            dataToPatch[p] = resource[p];
                        }
                    }

                    return dataToPatch;
                }
            };

            return new ResourceHandler();
        });
})( angular );
/**
 * Created by jacek on 18.03.16.
 */

/**
 * Created by jacek on 05.01.16.
 */
(function (angular) {

    'use strict';

    function SortParam( name, direction ) {

        this.field = name;
        this.direction = direction || null;

        this.toggle = function() {

            this.direction = this.direction === '+' ? '-' : '+';
        };

        this.toString = function() {

            return this.direction + this.field;
        };
    }

    function Sorting() {

        this.fields = [];

        this.getSortParam = function( fieldName, direction ) {

            return this.findSortParam( fieldName ) || new SortParam( fieldName, direction );
        };

        this.findSortParam = function( fieldName ) {

            var i;

            for (i in this.fields) {

                if (this.fields.hasOwnProperty(i) && this.fields[i].field === fieldName) {

                    return this.fields[ i ];
                }
            }
        };

        this.sort = function( fieldName, add ) {

            var sortParam, newParam;

            sortParam = this.getSortParam( fieldName );
            newParam = sortParam.direction === null;
            sortParam.toggle();

            if (!add)
            {
                this.fields = [ sortParam ];
            }
            else if(add && newParam)
            {
                this.fields.push( sortParam );
            }
        };

        this.setup = function( sorts ) {
            this.fields = [];
            var fieldsArr = sorts.split(',');

            angular.forEach( fieldsArr, function( field ) {

                var fieldMatches = /^(\+|\-)?([\w+_\-]+)$/.exec(field);

                this.fields.push( this.getSortParam( fieldMatches[2], fieldMatches[1]));

            }.bind(this));
        };


        this.toString = function() {

            return this.fields.join(',');
        };
    }
    function resourceLoaderFactory( $dataResourceNew ) {

        return function ResourceLoader( resourceName ) {

            this.data = [];
            var filters = {};
            var sorting = new Sorting();
            var self = this;
            var contentRange = new ContentRange(resourceName);

            var resource = $dataResourceNew( resourceName, null, contentRange);

            function load() {

                var sortString = sorting.toString();
                var sortingPart = {};
                var query;

                if (sortString.length) {
                    sortingPart.sort = sortString;
                }

                query = angular.extend({}, filters, sortingPart);

                self.data = resource.query(query);

                return self.data;
            }

            this.getInstance = function( ) {

                return new ResourceLoader( resourceName );
            };

            this.newEntity = function () {

                return new resource;
            };

            this.nextPage = function () {

                contentRange.nextPage();
                load();
            };

            this.prevPage = function () {

                contentRange.prevPage();
                load();
            };

            this.goToPage = function (pageNo) {

                contentRange.goToPage(pageNo);
            };

            this.setPageSize = function (pageSize) {

                contentRange.setPageSize(pageSize);
            };

            this.applySort = function (field, add) {

                sorting.sort(field, add || false);
                return this;
            };

            this.getSorting = function () {

                return sorting;
            };

            this.applyFilters = function (newFilters) {

                filters = newFilters;
                return this;
            };

            this.load = function () {

                return load();
            };

            this.getPage = function () {

                return contentRange.page;
            };

            this.getPages = function () {
                return contentRange.totalPages;
            };

            this.getCollectionSize = function () {
                return contentRange.items;
            };

            this.getPageSize = function () {

            };

            this.getPrevPage = function () {

                return contentRange.getPrevPage();
            };

            this.getNextPage = function () {

                return contentRange.getNextPage();
            };
        }
    };

    /**
     *
     * @param resourceName string
     * @param [page] int
     * @param [pageSize] int
     * @constructor
     */
    function ContentRange( resourceName, page, pageSize ) {

        var self = this;

        this.from = null;
        this.to = null;
        this.range = null;


        this.pageSize = 50;
        this.page = 1;

        this.totalPages = null;
        this.items = null;

        this.calculateRange = function() {

            this.from = this.pageSize * ( this.page - 1 );
            this.to = (this.pageSize * this.page) - 1;
        };

        this.bindRequest = function( ) {

            return function () {

                return self.range+'='+self.from+'-'+self.to;
            }
        };

        /**
         * interceptor method
         */
        this.response = function() {

            return function(data, headers) {

                var contentRangeString, pattern, result, respondedRange, respondedFrom, respondedTo, respondedItems;


                contentRangeString = headers('content-range');
                pattern =  /^([a-z0-9\-\_]+)\s+(\d+)-(\d+)\/(\d+)$/i;
                result = pattern.exec(contentRangeString)

                if (result) {

                    respondedFrom = parseInt( result[2] );
                    respondedTo = parseInt( result[3] );
                    respondedItems = parseInt( result[4] );

                    self.items = respondedItems;
                    self.totalPages = Math.floor( self.items / self.pageSize) + (( self.items % self.pageSize ) ? 1 : 0);

                } else {

                    self.items = 0;
                    self.totalPages = 0;
                    self.page = 0;
                }

                return data;
            }
        };

        this.goToPage = function( page ) {

            this.page = page;
            this.calculateRange();
        };


        this.setPageSize = function ( pageSize ) {

            this.page = 1;
            this.pageSize = pageSize;
            this.calculateRange();
        };

        this.nextPage = function() {

            if ( this.totalPages && this.page < this.totalPages ) {

                this.page++;
                this.calculateRange();
            }
        };

        this.getPrevPage = function() {

            if ( 1 < this.page ) {

                return this.page - 1;
            }
        };

        this.getNextPage = function() {

            if ( this.totalPages && this.page < this.totalPages ) {

                return this.page + 1;
            }

        };

        this.prevPage = function() {

            if ( 1 > this.page ) {

                this.page--;
                this.calculateRange();
            }
        };

        function __construct( resourceName, page, pageSize ) {

            this.range = resourceName;

            if (page) {

                this.page = page;
            }

            if (pageSize) {

                this.pageSize = pageSize;
            }

            this.calculateRange();
        }

        __construct.call( this, resourceName, page, pageSize );
    }

    angular
        .module('npb')
        .factory('ResourceLoader', function ( $dataResource ) {

            return resourceLoaderFactory( $dataResource );
        });

})( angular );
/**
 * Created by jacek on 07.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .factory('api_url', function( frontend_conf ) {

            return window.url(frontend_conf.xite_cms_api);
        })
        .factory('resourceUrlBuilder', function( api_url ) {

            return function( resourceName ) {

                var normalizedName;

                normalizedName = resourceName.replace(/\_/,'-');

                return api_url+'/' + normalizedName + '/:pid';
            }
        });
})(angular);
/**
 * Created by jacek on 07.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .factory('$dataResource', function( $resource, $cachedResource, resourceUrlBuilder, resourceHandler, notifier, message ) {

            var defaultResponseTransform, defaultActions, rpcAction, defaultSettings;

            defaultResponseTransform = [angular.fromJson, copyState];

            defaultActions = {
                query : {
                    method: 'GET',
                    isArray: true,
                    transformResponse: [
                        angular.fromJson,

                        function (data,headersGetter,status) {

                            if (status <= 206) {
                                for (var p in data) {

                                    if (data.hasOwnProperty(p)) {

                                        data[p] = copyState(data[p]);
                                    }
                                }
                            }

                            return data;
                        }],
                    headers: {}
                },
                get : {
                    method: 'GET',
                    transformResponse: defaultResponseTransform
                },
                save : {
                    method : 'POST',
                    transformResponse: defaultResponseTransform
                },
                update : {
                    method : 'PUT',
                    transformResponse: defaultResponseTransform
                },
                patch : {
                    method : 'PATCH',
                    transformResponse: defaultResponseTransform,
                    transformRequest: [ resourceHandler.stateDiff, angular.toJson ]
                },
                remove : {
                    method: 'DELETE'
                }
            };

            function queryActionFactory( contentRange ) {

                function n(d) {

                    return d;
                }

                function persistServerState( data,headersGetter,status ) {

                    if (status <= 206) {
                        for (var p in data) {

                            if (data.hasOwnProperty(p)) {

                                data[p] = copyState(data[p]);
                            }
                        }
                    }

                    return data;
                }

                return {
                    query : {
                        method: 'GET',
                        isArray: true,
                        transformResponse: [
                            angular.fromJson,
                            contentRange && contentRange.response() || n,
                            persistServerState
                        ],
                        headers: (function() {
                            return contentRange ? {
                                Range : contentRange.bindRequest()
                            } : {}
                        })()
                    }
                }
            }

            rpcAction = {
                callProcedure : {
                    method: 'POST',
                    params : {
                        pid : 'rpc'
                    }
                }
            };

            function copyState( data ) {


                data.$serverState = {};


                for (var p in data) {

                    if (data.hasOwnProperty(p)) {

                        data.$serverState[p] = _.clone(data[p]);
                    }
                }

                return data;
            }

            defaultSettings = {

                paramDefaults : { pid : '@id' },
                hasRpc : false,
                rpcConfig : {},
                url : null,
                actions : {}
            };

            function decorateWithNotifications( resourceName ) {

                var decorated = Object.assign({},defaultActions);


                function generateMessageId( action, status ) {

                    return 'resource:'+resourceName+':'+action+':'+status;
                }

                decorated.save = Object.assign( {}, defaultActions.save );
                decorated.patch = Object.assign( {}, defaultActions.patch );

                function createInterceptor( method ) {

                    return {
                        response: function (httpResponse) {

                            var msgId = generateMessageId(method, 'success');
                            var msg = message.getMessage(msgId, httpResponse.data);

                            notifier.notify('success', msg ) ;

                            return httpResponse;
                        },
                        responseError: function (httpResponse) {
                            
                            var msg = null;
                            if (
                                httpResponse.data.error.userMessage === undefined ||
                                httpResponse.data.error.userMessage === null
                            ) {
                                var msgId = generateMessageId( method, 'error');
                                msg = message.getMessage( msgId, httpResponse.config.data);
                            } else {
                                msg = httpResponse.data.error.userMessage;
                            }

                            notifier.notify('error', msg);

                            return httpResponse;
                        }
                    }
                }

                decorated.save.interceptor = createInterceptor('create');
                decorated.patch.interceptor = createInterceptor('update');

                return decorated;
            }


            return function resourceFactory( resourcesName, settings, contentRange ) {

                var currentSettings,
                    resourcesUrl,
                    paramDefaults,
                    currentActions,
                    decoratedWithNotifier,
                    rpcConf,
                    currentQuery,
                    newResource;

                decoratedWithNotifier = decorateWithNotifications( resourcesName );

                currentSettings = angular.extend( {}, defaultSettings, settings || {} );

                resourcesUrl = currentSettings.url || resourceUrlBuilder( resourcesName );
                paramDefaults = currentSettings.paramDefaults;

                rpcConf = currentSettings.hasRpc ? rpcAction : {};
                currentQuery = queryActionFactory( contentRange );



                currentActions = angular.extend( {}, decoratedWithNotifier, currentSettings.actions, currentQuery, rpcConf )

                if ( currentSettings.cached ) {

                    newResource = $cachedResource( resourcesName, resourcesUrl, paramDefaults, currentActions )

                } else {

                    newResource =  $resource( resourcesUrl, paramDefaults, currentActions );
                }

                newResource.$$resourceName = resourcesName;

                return newResource;
            }
        });

})(angular);
/**
 * Created by jacek on 10.02.16.
 */

(function ( angular ) {



    angular
        .module('npb')
        .factory('rpcClient', function( $injector, notifier, message ) {

            function generateMessageId( resourceName, procedureName, status) {

                return stringFormat('rpc:{resourceName}:{procedureName}:{status}',{
                    resourceName : resourceName,
                    procedureName : procedureName,
                    status : status
                })
            }

            return function( resourceName ) {

                var resource;

                if (!$injector.has( resourceName ) ) {

                    throw new Error('RPC Client! Cannot find '+resourceName+' end point');
                }

                resource = $injector.get( resourceName );

                return function( procedure ) {

                    return function( payload ) {

                        // var startMsgId = generateMessageId( resourceName, procedure, 'start');
                        // var startMsg = message.getMessage( startMsgId, payload );

                        // var rpcTask = notifier.task( startMsg );

                        var procedureResponse = resource.callProcedure({}, {

                            procedure : procedure,
                            payload : payload
                        });

                        procedureResponse
                            .$promise
                            .then(

                                function( ) {

                                    var msgId = generateMessageId( resourceName, procedure, 'success');
                                    var msg = message.getMessage( msgId, payload );

                                    notifier.notify( 'success', msg );
                                }
                            )
                            .catch(

                                function( reason ) {

                                    var msgId = generateMessageId( resourceName, procedure, 'error');
                                    var msg = message.getMessage( msgId, payload, reason.data.exception );

                                    notifier.notify( 'error', msg );
                                }
                            );

                        return procedureResponse;
                    }
                }
            }
        });

})( angular );
/**
 * Created by jacek on 11.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .factory('TableColumnDefinition', function() {

            function TableColumnDefinition( config ) {

                this.id = null;
                this.header = null;
                this.sortable = false;
                this.hideable = true;
                this.property = null;
                this.visible = true;

                angular.extend(this, config);
            }

            return TableColumnDefinition;
        })
        .factory('TableColumnSet', function( TableColumnDefinition, columns ) {

            function TableColumnSet( config ) {
                var self = this;
                this.columns = [];

                angular.forEach( config, function( requestedColumn ) {

                    var id, override;

                    override =  angular.isArray( requestedColumn ) && requestedColumn[1] || {};
                    id = angular.isArray( requestedColumn ) && requestedColumn[0] || requestedColumn;

                    self.columns.push( columns.get(id,override));
                });

                this.serialize = function() {

                    return _.map( this.columns, function(col) {

                        return {
                            id : col.id,
                            v : col.visible
                        };
                    })
                };

                this.restore = function( serialized ) {

                    _.each( serialized, function( item ) {

                        var c = _.find(this.columns, function(column) {
                            return column.id === item.id;

                        });

                        if (c) {
                            c.visible = item.v;
                        }


                    }.bind(this));
                };
            }

            return TableColumnSet;
        })
        .factory('tableState', function( $localStorage ) {

            function TableState() {

                var defaultColumnSet;

                this.currentId = null;
                this.columnSet = null;
                this.loader = null;
                this.highlighter = angular.noop;
                this.contextMenu = null;

                function getColumnsStoragePath( stateId ) {

                    return stateId + ':columns';
                }

                this.restore = function( id, columnSet, loader, highlighter, contextMenuName ) {

                    this.currentId = id;

                    var columnsPath = getColumnsStoragePath( this.currentId );
                    defaultColumnSet = columnSet.serialize();

                    columnSet.restore( $localStorage.getItem( columnsPath, defaultColumnSet ) );

                    this.columnSet = columnSet;
                    this.loader = loader;
                    this.highlighter = highlighter;
                    this.contextMenu = contextMenuName;
                };

                this.persistColumnSet = function( ) {

                    var columnsPath = getColumnsStoragePath( this.currentId );
                    $localStorage.setItem( columnsPath, this.columnSet.serialize());
                };

                this.restoreColumnSet = function() {

                    var columnsPath = getColumnsStoragePath( this.currentId );
                    $localStorage.setItem( columnsPath, defaultColumnSet);
                    this.columnSet.restore( defaultColumnSet );
                }
            }

            return new TableState();
        });

})(angular);
angular.module('npb').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('partials/elements/inputs_container.html',
    "<div class=\"editor-module\">\n" +
    "    <div class=\"header\">\n" +
    "        <div class=\"title\">{{ title }}</div>\n" +
    "        <div class=\"actions-container\"></div>\n" +
    "    </div>\n" +
    "    <form class=\"body inputs-container\">\n" +
    "\n" +
    "    </form>\n" +
    "</div>"
  );


  $templateCache.put('partials/ui/filter/boolean.html',
    "<div class=\"filter\">\n" +
    "    <div class=\"label\">{{ filter.label }}</div>\n" +
    "    <div class=\"input\">{{ displayValue }}</div>\n" +
    "</div>"
  );


  $templateCache.put('partials/ui/filter/filter.html',
    "<div class=\"filter\">\n" +
    "    <div class=\"label\">{{ filter.label }}</div>\n" +
    "    <div ng-if=\"!filter.kbDriven\" class=\"input\">{{ fbc.displayValue }}</div>\n" +
    "    <input ng-if=\"filter.kbDriven\" class=\"input\" ng-model=\"$parent.filterValue\" />\n" +
    "</div>"
  );


  $templateCache.put('partials/ui/filter/like.html',
    "<div class=\"filter\">\n" +
    "    <div class=\"label\">{{ filter.label }}</div>\n" +
    "    <input class=\"input\" ng-model=\"filterValue\" />\n" +
    "</div>"
  );


  $templateCache.put('partials/ui/filter/select.html',
    "<div class=\"filter\">\n" +
    "    <div class=\"label\">{{ filter.label }}</div>\n" +
    "    <div class=\"input\">{{ fbc.displayValue }}</div>\n" +
    "</div>"
  );

}]);
