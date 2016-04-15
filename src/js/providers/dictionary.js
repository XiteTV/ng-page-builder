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