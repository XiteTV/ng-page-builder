/**
 * Created by jacek on 07.01.16.
 */

(function (angular) {

    angular
        .module('npb')
        .factory('$dataResource', function( $resource, $q, $cachedResource, resourceUrlBuilder, resourceHandler, notifier, message ) {

            var defaultResponseTransform, defaultActions, rpcAction, defaultSettings;

            defaultResponseTransform = [angular.fromJson, resourceHandler.copyState ];

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

                                        data[p] = resourceHandler.copyState(data[p]);
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

                                data[p] = resourceHandler.copyState(data[p]);
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
                                msg = message.getMessage( msgId, httpResponse.config.data );
                            } 
                            else {
                                msg = httpResponse.data.error.userMessage;
                            }

                            notifier.notify( 'error', msg );

                            return $q.reject( httpResponse );
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
                    newResource,
                    extraActions;

                decoratedWithNotifier = decorateWithNotifications( resourcesName );

                currentSettings = angular.extend( {}, defaultSettings, settings || {} );

                resourcesUrl = currentSettings.url || resourceUrlBuilder( resourcesName );
                paramDefaults = currentSettings.paramDefaults;

                rpcConf = currentSettings.hasRpc ? rpcAction : {};
                currentQuery = queryActionFactory( contentRange );

                if ( currentSettings.extraActions ) {
                    extraActions = currentSettings.extraActions;
                } else {
                    extraActions = {};
                }

                currentActions = angular.extend( {}, decoratedWithNotifier, currentSettings.actions, currentQuery, rpcConf, extraActions );

                if ( currentSettings.cached ) {

                    newResource = $cachedResource( resourcesName, resourcesUrl, paramDefaults, currentActions )

                } else {

                    newResource =  $resource( resourcesUrl, paramDefaults, currentActions );
                }

                newResource.$$resourceName = resourcesName;

                return newResource;
            }
        });

})( angular );