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