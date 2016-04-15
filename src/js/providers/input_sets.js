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