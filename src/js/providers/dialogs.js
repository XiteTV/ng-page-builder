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