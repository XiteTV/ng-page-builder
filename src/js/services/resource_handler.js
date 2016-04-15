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