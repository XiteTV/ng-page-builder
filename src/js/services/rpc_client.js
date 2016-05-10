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

                        var startMsgId = generateMessageId( resourceName, procedure, 'start');
                        var startMsg = message.getMessage( startMsgId, payload );
                        var rpcTask = notifier.task( startMsg );

                        var procedureResponse = resource.callProcedure({}, {

                            procedure : procedure,
                            payload : payload
                        });

                        procedureResponse
                            .$promise
                            .then(
                                function() {
                                    var msgId = generateMessageId( resourceName, procedure, 'success');
                                    var msg = message.getMessage( msgId, payload );
                                    rpcTask.resolve('success', msg );
                                },
                                function( reason ) {

                                    var msgId = generateMessageId( resourceName, procedure, 'error');
                                    var msg = message.getMessage( msgId, payload );
                                    rpcTask.resolve('error', msg );
                                }
                            );

                        return procedureResponse;
                    }
                }
            }
        });

})( angular );