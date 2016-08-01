/**
 * @license AngularJS v1.5.5
 * (c) 2010-2016 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

var $resourceMinErr = angular.$$minErr('$resource');

// Helper functions and regex to lookup a dotted path on an object
// stopping at undefined/null.  The path must be composed of ASCII
// identifiers (just like $parse)
var MEMBER_NAME_REGEX = /^(\.[a-zA-Z_$@][0-9a-zA-Z_$@]*)+$/;

function isValidDottedPath(path) {
  return (path != null && path !== '' && path !== 'hasOwnProperty' &&
      MEMBER_NAME_REGEX.test('.' + path));
}

function lookupDottedPath(obj, path) {
  if (!isValidDottedPath(path)) {
    throw $resourceMinErr('badmember', 'Dotted member path "@{0}" is invalid.', path);
  }
  var keys = path.split('.');
  for (var i = 0, ii = keys.length; i < ii && angular.isDefined(obj); i++) {
    var key = keys[i];
    obj = (obj !== null) ? obj[key] : undefined;
  }
  return obj;
}

/**
 * Create a shallow copy of an object and clear other fields from the destination
 */
function shallowClearAndCopy(src, dst) {
  dst = dst || {};

  angular.forEach(dst, function(value, key) {
    delete dst[key];
  });

  for (var key in src) {
    if (src.hasOwnProperty(key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
      dst[key] = src[key];
    }
  }

  return dst;
}

/**
 * @ngdoc module
 * @name ngResource
 * @description
 *
 * # ngResource
 *
 * The `ngResource` module provides interaction support with RESTful services
 * via the $resource service.
 *
 *
 * <div doc-module-components="ngResource"></div>
 *
 * See {@link ngResource.$resource `$resource`} for usage.
 */

/**
 * @ngdoc service
 * @name $resource
 * @requires $http
 * @requires ng.$log
 * @requires $q
 * @requires ng.$timeout
 *
 * @description
 * A factory which creates a resource object that lets you interact with
 * [RESTful](http://en.wikipedia.org/wiki/Representational_State_Transfer) server-side data sources.
 *
 * The returned resource object has action methods which provide high-level behaviors without
 * the need to interact with the low level {@link ng.$http $http} service.
 *
 * Requires the {@link ngResource `ngResource`} module to be installed.
 *
 * By default, trailing slashes will be stripped from the calculated URLs,
 * which can pose problems with server backends that do not expect that
 * behavior.  This can be disabled by configuring the `$resourceProvider` like
 * this:
 *
 * ```js
     app.config(['$resourceProvider', function($resourceProvider) {
       // Don't strip trailing slashes from calculated URLs
       $resourceProvider.defaults.stripTrailingSlashes = false;
     }]);
 * ```
 *
 * @param {string} url A parameterized URL template with parameters prefixed by `:` as in
 *   `/user/:username`. If you are using a URL with a port number (e.g.
 *   `http://example.com:8080/api`), it will be respected.
 *
 *   If you are using a url with a suffix, just add the suffix, like this:
 *   `$resource('http://example.com/resource.json')` or `$resource('http://example.com/:id.json')`
 *   or even `$resource('http://example.com/resource/:resource_id.:format')`
 *   If the parameter before the suffix is empty, :resource_id in this case, then the `/.` will be
 *   collapsed down to a single `.`.  If you need this sequence to appear and not collapse then you
 *   can escape it with `/\.`.
 *
 * @param {Object=} paramDefaults Default values for `url` parameters. These can be overridden in
 *   `actions` methods. If a parameter value is a function, it will be executed every time
 *   when a param value needs to be obtained for a request (unless the param was overridden).
 *
 *   Each key value in the parameter object is first bound to url template if present and then any
 *   excess keys are appended to the url search query after the `?`.
 *
 *   Given a template `/path/:verb` and parameter `{verb:'greet', salutation:'Hello'}` results in
 *   URL `/path/greet?salutation=Hello`.
 *
 *   If the parameter value is prefixed with `@` then the value for that parameter will be extracted
 *   from the corresponding property on the `data` object (provided when calling an action method).
 *   For example, if the `defaultParam` object is `{someParam: '@someProp'}` then the value of
 *   `someParam` will be `data.someProp`.
 *
 * @param {Object.<Object>=} actions Hash with declaration of custom actions that should extend
 *   the default set of resource actions. The declaration should be created in the format of {@link
 *   ng.$http#usage $http.config}:
 *
 *       {action1: {method:?, params:?, isArray:?, headers:?, ...},
 *        action2: {method:?, params:?, isArray:?, headers:?, ...},
 *        ...}
 *
 *   Where:
 *
 *   - **`action`** – {string} – The name of action. This name becomes the name of the method on
 *     your resource object.
 *   - **`method`** – {string} – Case insensitive HTTP method (e.g. `GET`, `POST`, `PUT`,
 *     `DELETE`, `JSONP`, etc).
 *   - **`params`** – {Object=} – Optional set of pre-bound parameters for this action. If any of
 *     the parameter value is a function, it will be executed every time when a param value needs to
 *     be obtained for a request (unless the param was overridden).
 *   - **`url`** – {string} – action specific `url` override. The url templating is supported just
 *     like for the resource-level urls.
 *   - **`isArray`** – {boolean=} – If true then the returned object for this action is an array,
 *     see `returns` section.
 *   - **`transformRequest`** –
 *     `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` –
 *     transform function or an array of such functions. The transform function takes the http
 *     request body and headers and returns its transformed (typically serialized) version.
 *     By default, transformRequest will contain one function that checks if the request data is
 *     an object and serializes to using `angular.toJson`. To prevent this behavior, set
 *     `transformRequest` to an empty array: `transformRequest: []`
 *   - **`transformResponse`** –
 *     `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` –
 *     transform function or an array of such functions. The transform function takes the http
 *     response body and headers and returns its transformed (typically deserialized) version.
 *     By default, transformResponse will contain one function that checks if the response looks
 *     like a JSON string and deserializes it using `angular.fromJson`. To prevent this behavior,
 *     set `transformResponse` to an empty array: `transformResponse: []`
 *   - **`cache`** – `{boolean|Cache}` – If true, a default $http cache will be used to cache the
 *     GET request, otherwise if a cache instance built with
 *     {@link ng.$cacheFactory $cacheFactory}, this cache will be used for
 *     caching.
 *   - **`timeout`** – `{number}` – timeout in milliseconds.<br />
 *     **Note:** In contrast to {@link ng.$http#usage $http.config}, {@link ng.$q promises} are
 *     **not** supported in $resource, because the same value would be used for multiple requests.
 *     If you are looking for a way to cancel requests, you should use the `cancellable` option.
 *   - **`cancellable`** – `{boolean}` – if set to true, the request made by a "non-instance" call
 *     will be cancelled (if not already completed) by calling `$cancelRequest()` on the call's
 *     return value. Calling `$cancelRequest()` for a non-cancellable or an already
 *     completed/cancelled request will have no effect.<br />
 *   - **`withCredentials`** - `{boolean}` - whether to set the `withCredentials` flag on the
 *     XHR object. See
 *     [requests with credentials](https://developer.mozilla.org/en/http_access_control#section_5)
 *     for more information.
 *   - **`responseType`** - `{string}` - see
 *     [requestType](https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#responseType).
 *   - **`interceptor`** - `{Object=}` - The interceptor object has two optional methods -
 *     `response` and `responseError`. Both `response` and `responseError` interceptors get called
 *     with `http response` object. See {@link ng.$http $http interceptors}.
 *
 * @param {Object} options Hash with custom settings that should extend the
 *   default `$resourceProvider` behavior.  The supported options are:
 *
 *   - **`stripTrailingSlashes`** – {boolean} – If true then the trailing
 *   slashes from any calculated URL will be stripped. (Defaults to true.)
 *   - **`cancellable`** – {boolean} – If true, the request made by a "non-instance" call will be
 *   cancelled (if not already completed) by calling `$cancelRequest()` on the call's return value.
 *   This can be overwritten per action. (Defaults to false.)
 *
 * @returns {Object} A resource "class" object with methods for the default set of resource actions
 *   optionally extended with custom `actions`. The default set contains these actions:
 *   ```js
 *   { 'get':    {method:'GET'},
 *     'save':   {method:'POST'},
 *     'query':  {method:'GET', isArray:true},
 *     'remove': {method:'DELETE'},
 *     'delete': {method:'DELETE'} };
 *   ```
 *
 *   Calling these methods invoke an {@link ng.$http} with the specified http method,
 *   destination and parameters. When the data is returned from the server then the object is an
 *   instance of the resource class. The actions `save`, `remove` and `delete` are available on it
 *   as  methods with the `$` prefix. This allows you to easily perform CRUD operations (create,
 *   read, update, delete) on server-side data like this:
 *   ```js
 *   var User = $resource('/user/:userId', {userId:'@id'});
 *   var user = User.get({userId:123}, function() {
 *     user.abc = true;
 *     user.$save();
 *   });
 *   ```
 *
 *   It is important to realize that invoking a $resource object method immediately returns an
 *   empty reference (object or array depending on `isArray`). Once the data is returned from the
 *   server the existing reference is populated with the actual data. This is a useful trick since
 *   usually the resource is assigned to a model which is then rendered by the view. Having an empty
 *   object results in no rendering, once the data arrives from the server then the object is
 *   populated with the data and the view automatically re-renders itself showing the new data. This
 *   means that in most cases one never has to write a callback function for the action methods.
 *
 *   The action methods on the class object or instance object can be invoked with the following
 *   parameters:
 *
 *   - HTTP GET "class" actions: `Resource.action([parameters], [success], [error])`
 *   - non-GET "class" actions: `Resource.action([parameters], postData, [success], [error])`
 *   - non-GET instance actions:  `instance.$action([parameters], [success], [error])`
 *
 *
 *   Success callback is called with (value, responseHeaders) arguments, where the value is
 *   the populated resource instance or collection object. The error callback is called
 *   with (httpResponse) argument.
 *
 *   Class actions return empty instance (with additional properties below).
 *   Instance actions return promise of the action.
 *
 *   The Resource instances and collections have these additional properties:
 *
 *   - `$promise`: the {@link ng.$q promise} of the original server interaction that created this
 *     instance or collection.
 *
 *     On success, the promise is resolved with the same resource instance or collection object,
 *     updated with data from server. This makes it easy to use in
 *     {@link ngRoute.$routeProvider resolve section of $routeProvider.when()} to defer view
 *     rendering until the resource(s) are loaded.
 *
 *     On failure, the promise is rejected with the {@link ng.$http http response} object, without
 *     the `resource` property.
 *
 *     If an interceptor object was provided, the promise will instead be resolved with the value
 *     returned by the interceptor.
 *
 *   - `$resolved`: `true` after first server interaction is completed (either with success or
 *      rejection), `false` before that. Knowing if the Resource has been resolved is useful in
 *      data-binding.
 *
 *   The Resource instances and collections have these additional methods:
 *
 *   - `$cancelRequest`: If there is a cancellable, pending request related to the instance or
 *      collection, calling this method will abort the request.
 *
 * @example
 *
 * # Credit card resource
 *
 * ```js
     // Define CreditCard class
     var CreditCard = $resource('/user/:userId/card/:cardId',
      {userId:123, cardId:'@id'}, {
       charge: {method:'POST', params:{charge:true}}
      });

     // We can retrieve a collection from the server
     var cards = CreditCard.query(function() {
       // GET: /user/123/card
       // server returns: [ {id:456, number:'1234', name:'Smith'} ];

       var card = cards[0];
       // each item is an instance of CreditCard
       expect(card instanceof CreditCard).toEqual(true);
       card.name = "J. Smith";
       // non GET methods are mapped onto the instances
       card.$save();
       // POST: /user/123/card/456 {id:456, number:'1234', name:'J. Smith'}
       // server returns: {id:456, number:'1234', name: 'J. Smith'};

       // our custom method is mapped as well.
       card.$charge({amount:9.99});
       // POST: /user/123/card/456?amount=9.99&charge=true {id:456, number:'1234', name:'J. Smith'}
     });

     // we can create an instance as well
     var newCard = new CreditCard({number:'0123'});
     newCard.name = "Mike Smith";
     newCard.$save();
     // POST: /user/123/card {number:'0123', name:'Mike Smith'}
     // server returns: {id:789, number:'0123', name: 'Mike Smith'};
     expect(newCard.id).toEqual(789);
 * ```
 *
 * The object returned from this function execution is a resource "class" which has "static" method
 * for each action in the definition.
 *
 * Calling these methods invoke `$http` on the `url` template with the given `method`, `params` and
 * `headers`.
 *
 * @example
 *
 * # User resource
 *
 * When the data is returned from the server then the object is an instance of the resource type and
 * all of the non-GET methods are available with `$` prefix. This allows you to easily support CRUD
 * operations (create, read, update, delete) on server-side data.

   ```js
     var User = $resource('/user/:userId', {userId:'@id'});
     User.get({userId:123}, function(user) {
       user.abc = true;
       user.$save();
     });
   ```
 *
 * It's worth noting that the success callback for `get`, `query` and other methods gets passed
 * in the response that came from the server as well as $http header getter function, so one
 * could rewrite the above example and get access to http headers as:
 *
   ```js
     var User = $resource('/user/:userId', {userId:'@id'});
     User.get({userId:123}, function(user, getResponseHeaders){
       user.abc = true;
       user.$save(function(user, putResponseHeaders) {
         //user => saved user object
         //putResponseHeaders => $http header getter
       });
     });
   ```
 *
 * You can also access the raw `$http` promise via the `$promise` property on the object returned
 *
   ```
     var User = $resource('/user/:userId', {userId:'@id'});
     User.get({userId:123})
         .$promise.then(function(user) {
           $scope.user = user;
         });
   ```
 *
 * @example
 *
 * # Creating a custom 'PUT' request
 *
 * In this example we create a custom method on our resource to make a PUT request
 * ```js
 *    var app = angular.module('app', ['ngResource', 'ngRoute']);
 *
 *    // Some APIs expect a PUT request in the format URL/object/ID
 *    // Here we are creating an 'update' method
 *    app.factory('Notes', ['$resource', function($resource) {
 *    return $resource('/notes/:id', null,
 *        {
 *            'update': { method:'PUT' }
 *        });
 *    }]);
 *
 *    // In our controller we get the ID from the URL using ngRoute and $routeParams
 *    // We pass in $routeParams and our Notes factory along with $scope
 *    app.controller('NotesCtrl', ['$scope', '$routeParams', 'Notes',
                                      function($scope, $routeParams, Notes) {
 *    // First get a note object from the factory
 *    var note = Notes.get({ id:$routeParams.id });
 *    $id = note.id;
 *
 *    // Now call update passing in the ID first then the object you are updating
 *    Notes.update({ id:$id }, note);
 *
 *    // This will PUT /notes/ID with the note object in the request payload
 *    }]);
 * ```
 *
 * @example
 *
 * # Cancelling requests
 *
 * If an action's configuration specifies that it is cancellable, you can cancel the request related
 * to an instance or collection (as long as it is a result of a "non-instance" call):
 *
   ```js
     // ...defining the `Hotel` resource...
     var Hotel = $resource('/api/hotel/:id', {id: '@id'}, {
       // Let's make the `query()` method cancellable
       query: {method: 'get', isArray: true, cancellable: true}
     });

     // ...somewhere in the PlanVacationController...
     ...
     this.onDestinationChanged = function onDestinationChanged(destination) {
       // We don't care about any pending request for hotels
       // in a different destination any more
       this.availableHotels.$cancelRequest();

       // Let's query for hotels in '<destination>'
       // (calls: /api/hotel?location=<destination>)
       this.availableHotels = Hotel.query({location: destination});
     };
   ```
 *
 */
angular.module('ngResource', ['ng']).
  provider('$resource', function() {
    var PROTOCOL_AND_DOMAIN_REGEX = /^https?:\/\/[^\/]*/;
    var provider = this;

    this.defaults = {
      // Strip slashes by default
      stripTrailingSlashes: true,

      // Default actions configuration
      actions: {
        'get': {method: 'GET'},
        'save': {method: 'POST'},
        'query': {method: 'GET', isArray: true},
        'remove': {method: 'DELETE'},
        'delete': {method: 'DELETE'}
      }
    };

    this.$get = ['$http', '$log', '$q', '$timeout', function($http, $log, $q, $timeout) {

      var noop = angular.noop,
        forEach = angular.forEach,
        extend = angular.extend,
        copy = angular.copy,
        isFunction = angular.isFunction;

      /**
       * We need our custom method because encodeURIComponent is too aggressive and doesn't follow
       * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set
       * (pchar) allowed in path segments:
       *    segment       = *pchar
       *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
       *    pct-encoded   = "%" HEXDIG HEXDIG
       *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
       *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
       *                     / "*" / "+" / "," / ";" / "="
       */
      function encodeUriSegment(val) {
        return encodeUriQuery(val, true).
          replace(/%26/gi, '&').
          replace(/%3D/gi, '=').
          replace(/%2B/gi, '+');
      }


      /**
       * This method is intended for encoding *key* or *value* parts of query component. We need a
       * custom method because encodeURIComponent is too aggressive and encodes stuff that doesn't
       * have to be encoded per http://tools.ietf.org/html/rfc3986:
       *    query       = *( pchar / "/" / "?" )
       *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
       *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
       *    pct-encoded   = "%" HEXDIG HEXDIG
       *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
       *                     / "*" / "+" / "," / ";" / "="
       */
      function encodeUriQuery(val, pctEncodeSpaces) {
        return encodeURIComponent(val).
          replace(/%40/gi, '@').
          replace(/%3A/gi, ':').
          replace(/%24/g, '$').
          replace(/%2C/gi, ',').
          replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
      }

      function Route(template, defaults) {
        this.template = template;
        this.defaults = extend({}, provider.defaults, defaults);
        this.urlParams = {};
      }

      Route.prototype = {
        setUrlParams: function(config, params, actionUrl) {
          var self = this,
            url = actionUrl || self.template,
            val,
            encodedVal,
            protocolAndDomain = '';

          var urlParams = self.urlParams = {};
          forEach(url.split(/\W/), function(param) {
            if (param === 'hasOwnProperty') {
              throw $resourceMinErr('badname', "hasOwnProperty is not a valid parameter name.");
            }
            if (!(new RegExp("^\\d+$").test(param)) && param &&
              (new RegExp("(^|[^\\\\]):" + param + "(\\W|$)").test(url))) {
              urlParams[param] = {
                isQueryParamValue: (new RegExp("\\?.*=:" + param + "(?:\\W|$)")).test(url)
              };
            }
          });
          url = url.replace(/\\:/g, ':');
          url = url.replace(PROTOCOL_AND_DOMAIN_REGEX, function(match) {
            protocolAndDomain = match;
            return '';
          });

          params = params || {};
          forEach(self.urlParams, function(paramInfo, urlParam) {
            val = params.hasOwnProperty(urlParam) ? params[urlParam] : self.defaults[urlParam];
            if (angular.isDefined(val) && val !== null) {
              if (paramInfo.isQueryParamValue) {
                encodedVal = encodeUriQuery(val, true);
              } else {
                encodedVal = encodeUriSegment(val);
              }
              url = url.replace(new RegExp(":" + urlParam + "(\\W|$)", "g"), function(match, p1) {
                return encodedVal + p1;
              });
            } else {
              url = url.replace(new RegExp("(\/?):" + urlParam + "(\\W|$)", "g"), function(match,
                  leadingSlashes, tail) {
                if (tail.charAt(0) == '/') {
                  return tail;
                } else {
                  return leadingSlashes + tail;
                }
              });
            }
          });

          // strip trailing slashes and set the url (unless this behavior is specifically disabled)
          if (self.defaults.stripTrailingSlashes) {
            url = url.replace(/\/+$/, '') || '/';
          }

          // then replace collapse `/.` if found in the last URL path segment before the query
          // E.g. `http://url.com/id./format?q=x` becomes `http://url.com/id.format?q=x`
          url = url.replace(/\/\.(?=\w+($|\?))/, '.');
          // replace escaped `/\.` with `/.`
          config.url = protocolAndDomain + url.replace(/\/\\\./, '/.');


          // set params - delegate param encoding to $http
          forEach(params, function(value, key) {
            if (!self.urlParams[key]) {
              config.params = config.params || {};
              config.params[key] = value;
            }
          });
        }
      };


      function resourceFactory(url, paramDefaults, actions, options) {
        var route = new Route(url, options);

        actions = extend({}, provider.defaults.actions, actions);

        function extractParams(data, actionParams) {
          var ids = {};
          actionParams = extend({}, paramDefaults, actionParams);
          forEach(actionParams, function(value, key) {
            if (isFunction(value)) { value = value(); }
            ids[key] = value && value.charAt && value.charAt(0) == '@' ?
              lookupDottedPath(data, value.substr(1)) : value;
          });
          return ids;
        }

        function defaultResponseInterceptor(response) {
          return response.resource;
        }

        function Resource(value) {
          shallowClearAndCopy(value || {}, this);
        }

        Resource.prototype.toJSON = function() {
          var data = extend({}, this);
          delete data.$promise;
          delete data.$resolved;
          return data;
        };

        forEach(actions, function(action, name) {
          var hasBody = /^(POST|PUT|PATCH)$/i.test(action.method);
          var numericTimeout = action.timeout;
          var cancellable = angular.isDefined(action.cancellable) ? action.cancellable :
              (options && angular.isDefined(options.cancellable)) ? options.cancellable :
              provider.defaults.cancellable;

          if (numericTimeout && !angular.isNumber(numericTimeout)) {
            $log.debug('ngResource:\n' +
                       '  Only numeric values are allowed as `timeout`.\n' +
                       '  Promises are not supported in $resource, because the same value would ' +
                       'be used for multiple requests. If you are looking for a way to cancel ' +
                       'requests, you should use the `cancellable` option.');
            delete action.timeout;
            numericTimeout = null;
          }

          Resource[name] = function(a1, a2, a3, a4) {
            var params = {}, data, success, error;

            /* jshint -W086 */ /* (purposefully fall through case statements) */
            switch (arguments.length) {
              case 4:
                error = a4;
                success = a3;
              //fallthrough
              case 3:
              case 2:
                if (isFunction(a2)) {
                  if (isFunction(a1)) {
                    success = a1;
                    error = a2;
                    break;
                  }

                  success = a2;
                  error = a3;
                  //fallthrough
                } else {
                  params = a1;
                  data = a2;
                  success = a3;
                  break;
                }
              case 1:
                if (isFunction(a1)) success = a1;
                else if (hasBody) data = a1;
                else params = a1;
                break;
              case 0: break;
              default:
                throw $resourceMinErr('badargs',
                  "Expected up to 4 arguments [params, data, success, error], got {0} arguments",
                  arguments.length);
            }
            /* jshint +W086 */ /* (purposefully fall through case statements) */

            var isInstanceCall = this instanceof Resource;
            var value = isInstanceCall ? data : (action.isArray ? [] : new Resource(data));
            var httpConfig = {};
            var responseInterceptor = action.interceptor && action.interceptor.response ||
              defaultResponseInterceptor;
            var responseErrorInterceptor = action.interceptor && action.interceptor.responseError ||
              undefined;
            var timeoutDeferred;
            var numericTimeoutPromise;

            forEach(action, function(value, key) {
              switch (key) {
                default:
                  httpConfig[key] = copy(value);
                  break;
                case 'params':
                case 'isArray':
                case 'interceptor':
                case 'cancellable':
                  break;
              }
            });

            if (!isInstanceCall && cancellable) {
              timeoutDeferred = $q.defer();
              httpConfig.timeout = timeoutDeferred.promise;

              if (numericTimeout) {
                numericTimeoutPromise = $timeout(timeoutDeferred.resolve, numericTimeout);
              }
            }

            if (hasBody) httpConfig.data = data;
            route.setUrlParams(httpConfig,
              extend({}, extractParams(data, action.params || {}), params),
              action.url);

            var promise = $http(httpConfig).then(function(response) {
              var data = response.data;

              if (data) {
                // Need to convert action.isArray to boolean in case it is undefined
                // jshint -W018
                if (angular.isArray(data) !== (!!action.isArray)) {
                  throw $resourceMinErr('badcfg',
                      'Error in resource configuration for action `{0}`. Expected response to ' +
                      'contain an {1} but got an {2} (Request: {3} {4})', name, action.isArray ? 'array' : 'object',
                    angular.isArray(data) ? 'array' : 'object', httpConfig.method, httpConfig.url);
                }
                // jshint +W018
                if (action.isArray) {
                  value.length = 0;
                  forEach(data, function(item) {
                    if (typeof item === "object") {
                      value.push(new Resource(item));
                    } else {
                      // Valid JSON values may be string literals, and these should not be converted
                      // into objects. These items will not have access to the Resource prototype
                      // methods, but unfortunately there
                      value.push(item);
                    }
                  });
                } else {
                  var promise = value.$promise;     // Save the promise
                  shallowClearAndCopy(data, value);
                  value.$promise = promise;         // Restore the promise
                }
              }
              response.resource = value;

              return response;
            }, function(response) {
              (error || noop)(response);
              return $q.reject(response);
            });

            promise['finally'](function() {
              value.$resolved = true;
              if (!isInstanceCall && cancellable) {
                value.$cancelRequest = angular.noop;
                $timeout.cancel(numericTimeoutPromise);
                timeoutDeferred = numericTimeoutPromise = httpConfig.timeout = null;
              }
            });

            promise = promise.then(
              function(response) {
                var value = responseInterceptor(response);
                (success || noop)(value, response.headers);
                return value;
              },
              responseErrorInterceptor);

            if (!isInstanceCall) {
              // we are creating instance / collection
              // - set the initial promise
              // - return the instance / collection
              value.$promise = promise;
              value.$resolved = false;
              if (cancellable) value.$cancelRequest = timeoutDeferred.resolve;

              return value;
            }

            // instance call
            return promise;
          };


          Resource.prototype['$' + name] = function(params, success, error) {
            if (isFunction(params)) {
              error = success; success = params; params = {};
            }
            var result = Resource[name].call(this, params, this, success, error);
            return result.$promise || result;
          };
        });

        Resource.bind = function(additionalParamDefaults) {
          return resourceFactory(url, extend({}, paramDefaults, additionalParamDefaults), actions);
        };

        return Resource;
      }

      return resourceFactory;
    }];
  });


})(window, window.angular);

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var DEFAULT_ACTIONS, buildCachedResourceClass, readArrayCache, readCache, writeCache;

DEFAULT_ACTIONS = {
  get: {
    method: 'GET'
  },
  query: {
    method: 'GET',
    isArray: true
  },
  save: {
    method: 'POST'
  },
  remove: {
    method: 'DELETE'
  },
  "delete": {
    method: 'DELETE'
  }
};

readArrayCache = require('./read_array_cache');

readCache = require('./read_cache');

writeCache = require('./write_cache');

module.exports = buildCachedResourceClass = function($resource, $timeout, $q, providerParams, args) {
  var $key, $log, Cache, CachedResource, Resource, ResourceCacheArrayEntry, ResourceCacheEntry, ResourceWriteQueue, actionConfig, actionName, actions, arg, boundParams, handler, isPermissibleBoundValue, method, param, paramDefault, paramDefaults, url;
  $log = providerParams.$log;
  ResourceCacheEntry = require('./resource_cache_entry')(providerParams);
  ResourceCacheArrayEntry = require('./resource_cache_array_entry')(providerParams);
  ResourceWriteQueue = require('./resource_write_queue')(providerParams, $q);
  Cache = require('./cache')(providerParams);
  $key = args.shift();
  url = args.shift();
  while (args.length) {
    arg = args.pop();
    if (angular.isObject(arg[Object.keys(arg)[0]])) {
      actions = arg;
    } else {
      paramDefaults = arg;
    }
  }
  actions = angular.extend({}, DEFAULT_ACTIONS, actions);
  if (paramDefaults == null) {
    paramDefaults = {};
  }
  boundParams = {};
  for (param in paramDefaults) {
    paramDefault = paramDefaults[param];
    if (paramDefault[0] === '@') {
      boundParams[paramDefault.substr(1)] = param;
    }
  }
  Resource = $resource.call(null, url, paramDefaults, actions);
  isPermissibleBoundValue = function(value) {
    return angular.isDate(value) || angular.isNumber(value) || angular.isString(value);
  };
  CachedResource = (function() {
    CachedResource.prototype.$cache = true;

    function CachedResource(attrs) {
      angular.extend(this, attrs);
    }

    CachedResource.prototype.toJSON = function() {
      var data;
      data = angular.extend({}, this);
      delete data.$promise;
      delete data.$httpPromise;
      return data;
    };

    CachedResource.prototype.$params = function() {
      var attribute, params;
      params = {};
      for (attribute in boundParams) {
        param = boundParams[attribute];
        if (isPermissibleBoundValue(this[attribute])) {
          params[param] = this[attribute];
        }
      }
      return params;
    };

    CachedResource.prototype.$$addToCache = function(dirty) {
      var entry;
      if (dirty == null) {
        dirty = false;
      }
      entry = new ResourceCacheEntry($key, this.$params());
      entry.set(this, dirty);
      return this;
    };

    CachedResource.$clearCache = function(_arg) {
      var cacheArrayEntry, cacheKeys, clearChildren, clearPendingWrites, entries, exceptFor, isArray, key, params, queue, translateEntriesToCacheKeys, translateParamsArrayToCacheKeys, translateParamsArrayToEntries, where, _ref, _ref1;
      _ref = _arg != null ? _arg : {}, where = _ref.where, exceptFor = _ref.exceptFor, clearPendingWrites = _ref.clearPendingWrites, isArray = _ref.isArray, clearChildren = _ref.clearChildren;
      if (where == null) {
        where = null;
      }
      if (exceptFor == null) {
        exceptFor = null;
      }
      if (clearPendingWrites == null) {
        clearPendingWrites = false;
      }
      if (isArray == null) {
        isArray = false;
      }
      if (clearChildren == null) {
        clearChildren = false;
      }
      if (where && exceptFor) {
        return $log.error("Using where and exceptFor arguments at once in $clearCache() method is forbidden!");
      }
      cacheKeys = [];
      translateParamsArrayToEntries = function(entries) {
        entries || (entries = []);
        if (!angular.isArray(entries)) {
          entries = [entries];
        }
        return entries.map(function(entry) {
          return new CachedResource(entry).$params();
        });
      };
      translateEntriesToCacheKeys = function(params_objects) {
        return params_objects.map(function(params) {
          return new ResourceCacheEntry($key, params).fullCacheKey();
        });
      };
      translateParamsArrayToCacheKeys = function(entries) {
        return translateEntriesToCacheKeys(translateParamsArrayToEntries(entries));
      };
      if (exceptFor || where) {
        if (isArray) {
          cacheArrayEntry = new ResourceCacheArrayEntry($key, exceptFor || where).load();
          cacheKeys.push(cacheArrayEntry.fullCacheKey());
          if (cacheArrayEntry.value && ((exceptFor && !clearChildren) || (where && clearChildren))) {
            entries = (function() {
              var _i, _len, _ref1, _results;
              _ref1 = cacheArrayEntry.value;
              _results = [];
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                params = _ref1[_i];
                _results.push(params);
              }
              return _results;
            })();
            if (entries) {
              cacheKeys = cacheKeys.concat(translateEntriesToCacheKeys(entries));
            }
          }
        } else {
          cacheKeys = translateParamsArrayToCacheKeys(where || exceptFor);
        }
      }
      if (!clearPendingWrites && !where) {
        _ref1 = CachedResource.$writes, queue = _ref1.queue, key = _ref1.key;
        cacheKeys.push(key);
        entries = queue.map(function(resource) {
          return resource.resourceParams;
        });
        cacheKeys = cacheKeys.concat(translateEntriesToCacheKeys(entries));
      } else if (clearPendingWrites && where) {
        $log.debug("TODO if clearPendingWrites && where");
      }
      if (where) {
        return Cache.clear({
          key: $key,
          where: cacheKeys
        });
      } else {
        return Cache.clear({
          key: $key,
          exceptFor: cacheKeys
        });
      }
    };

    CachedResource.$addToCache = function(attrs, dirty) {
      return new CachedResource(attrs).$$addToCache(dirty);
    };

    CachedResource.$addArrayToCache = function(attrs, instances, dirty) {
      if (dirty == null) {
        dirty = false;
      }
      instances = instances.map(function(instance) {
        return new CachedResource(instance);
      });
      return new ResourceCacheArrayEntry($key, attrs).addInstances(instances, dirty);
    };

    CachedResource.$resource = Resource;

    CachedResource.$key = $key;

    return CachedResource;

  })();
  CachedResource.$writes = new ResourceWriteQueue(CachedResource, $timeout);
  for (actionName in actions) {
    actionConfig = actions[actionName];
    method = actionConfig.method.toUpperCase();
    if (actionConfig.cache !== false) {
      handler = method === 'GET' && actionConfig.isArray ? readArrayCache($q, providerParams, actionName, CachedResource, actionConfig) : method === 'GET' ? readCache($q, providerParams, actionName, CachedResource, actionConfig) : method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH' ? writeCache($q, providerParams, actionName, CachedResource, actionConfig) : void 0;
      CachedResource[actionName] = handler;
      if (method !== 'GET') {
        CachedResource.prototype["$" + actionName] = handler;
      }
    } else {
      CachedResource[actionName] = Resource[actionName];
      CachedResource.prototype["$" + actionName] = Resource.prototype["$" + actionName];
    }
  }
  return CachedResource;
};

},{"./cache":2,"./read_array_cache":7,"./read_cache":8,"./resource_cache_array_entry":9,"./resource_cache_entry":10,"./resource_write_queue":11,"./write_cache":12}],2:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Cache, localStorage;

localStorage = window.localStorage;

Cache = (function() {
  Cache.prototype.memoryCache = {};

  function Cache(_arg) {
    this.$log = _arg.$log, this.localStoragePrefix = _arg.localStoragePrefix;
  }

  Cache.prototype.getItem = function(key, fallbackValue) {
    var item, out;
    key = this._buildKey(key);
    item = this.memoryCache[key];
    if (item == null) {
      item = localStorage.getItem(key);
    }
    out = item != null ? angular.fromJson(item) : fallbackValue;
    this.$log.debug("CACHE GET: " + key, out);
    return out;
  };

  Cache.prototype.setItem = function(key, value) {
    var e, stringValue;
    key = this._buildKey(key);
    stringValue = angular.toJson(value);
    try {
      localStorage.setItem(key, stringValue);
      if (this.memoryCache[key] != null) {
        delete this.memoryCache[key];
      }
    } catch (_error) {
      e = _error;
      this.$log.error("Failed to write to localStorage.", {
        error: e,
        key: key,
        value: stringValue
      });
      this.memoryCache[key] = stringValue;
    }
    this.$log.debug("CACHE PUT: " + key, angular.fromJson(angular.toJson(value)));
    return value;
  };

  Cache.prototype.clear = function(_arg) {
    var cacheKey, cacheKeys, exceptFor, exception, i, key, skipKey, where, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _results, _results1;
    _ref = _arg != null ? _arg : {}, key = _ref.key, exceptFor = _ref.exceptFor, where = _ref.where;
    if (where && exceptFor) {
      return this.$log.error("Using where and exceptFor arguments at once in clear() method is forbidden!");
    }
    if (exceptFor) {
      if (exceptFor == null) {
        exceptFor = [];
      }
      cacheKeys = [];
      for (i = _i = 0, _ref1 = localStorage.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        cacheKey = localStorage.key(i);
        if (!this._cacheKeyHasPrefix(cacheKey, key)) {
          continue;
        }
        skipKey = false;
        for (_j = 0, _len = exceptFor.length; _j < _len; _j++) {
          exception = exceptFor[_j];
          if (!(this._cacheKeyHasPrefix(cacheKey, exception))) {
            continue;
          }
          skipKey = true;
          break;
        }
        if (skipKey) {
          continue;
        }
        cacheKeys.push(cacheKey);
      }
      _results = [];
      for (_k = 0, _len1 = cacheKeys.length; _k < _len1; _k++) {
        cacheKey = cacheKeys[_k];
        _results.push(localStorage.removeItem(cacheKey));
      }
      return _results;
    } else {
      _results1 = [];
      for (_l = 0, _len2 = where.length; _l < _len2; _l++) {
        cacheKey = where[_l];
        _results1.push(localStorage.removeItem(this._buildKey(cacheKey)));
      }
      return _results1;
    }
  };

  Cache.prototype._buildKey = function(key) {
    return "" + this.localStoragePrefix + key;
  };

  Cache.prototype._cacheKeyHasPrefix = function(cacheKey, prefix) {
    var index, nextChar;
    if (prefix == null) {
      return cacheKey.indexOf(this.localStoragePrefix) === 0;
    }
    prefix = this._buildKey(prefix);
    index = cacheKey.indexOf(prefix);
    nextChar = cacheKey[prefix.length];
    return index === 0 && ((nextChar == null) || (nextChar === '?' || nextChar === '/'));
  };

  return Cache;

})();

module.exports = function(providerParams) {
  return new Cache(providerParams);
};

},{}],3:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module.exports = function(providerParams) {
  var Cache, CachedResourceManager, buildCachedResourceClass;
  buildCachedResourceClass = require('./build_cached_resource_class');
  Cache = require('./cache')(providerParams);
  return CachedResourceManager = (function() {
    function CachedResourceManager($resource, $timeout, $q) {
      this.byKey = {};
      this.build = angular.bind(this, buildCachedResourceClass, $resource, $timeout, $q, providerParams);
    }

    CachedResourceManager.prototype.keys = function() {
      return Object.keys(this.byKey);
    };

    CachedResourceManager.prototype.add = function() {
      var CachedResource, args;
      args = Array.prototype.slice.call(arguments);
      CachedResource = this.build(args);
      this.byKey[CachedResource.$key] = CachedResource;
      CachedResource.$writes.flush();
      return CachedResource;
    };

    CachedResourceManager.prototype.flushQueues = function() {
      var CachedResource, key, _ref, _results;
      _ref = this.byKey;
      _results = [];
      for (key in _ref) {
        CachedResource = _ref[key];
        _results.push(CachedResource.$writes.flush());
      }
      return _results;
    };

    CachedResourceManager.prototype.clearCache = function(_arg) {
      var CachedResource, clearPendingWrites, exceptFor, key, _ref, _ref1, _results;
      _ref = _arg != null ? _arg : {}, exceptFor = _ref.exceptFor, clearPendingWrites = _ref.clearPendingWrites;
      if (exceptFor == null) {
        exceptFor = [];
      }
      _ref1 = this.byKey;
      _results = [];
      for (key in _ref1) {
        CachedResource = _ref1[key];
        if (__indexOf.call(exceptFor, key) < 0) {
          _results.push(CachedResource.$clearCache({
            clearPendingWrites: clearPendingWrites
          }));
        }
      }
      return _results;
    };

    CachedResourceManager.prototype.clearUndefined = function() {
      return Cache.clear({
        exceptFor: this.keys()
      });
    };

    return CachedResourceManager;

  })();
};

},{"./build_cached_resource_class":1,"./cache":2}],4:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var $cachedResourceFactory, $cachedResourceProvider, app, debugMode, localStoragePrefix, resourceManagerListener,
  __slice = [].slice;

resourceManagerListener = null;

debugMode = false;

localStoragePrefix = null;

if (typeof module !== "undefined" && module !== null) {
  module.exports = app = angular.module('ngCachedResource', ['ngResource']);
}

app.provider('$cachedResource', $cachedResourceProvider = (function() {
  function $cachedResourceProvider() {
    this.$get = $cachedResourceFactory;
    localStoragePrefix = 'cachedResource://';
  }

  $cachedResourceProvider.prototype.setDebugMode = function(newSetting) {
    if (newSetting == null) {
      newSetting = true;
    }
    return debugMode = newSetting;
  };

  $cachedResourceProvider.prototype.setLocalStoragePrefix = function(prefix) {
    return localStoragePrefix = prefix;
  };

  return $cachedResourceProvider;

})());

$cachedResourceFactory = [
  '$resource', '$timeout', '$q', '$log', function($resource, $timeout, $q, $log) {
    var $cachedResource, CachedResourceManager, bindLogFunction, fn, providerParams, resourceManager, _i, _len, _ref;
    bindLogFunction = function(logFunction) {
      return function() {
        var message;
        message = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        message.unshift('ngCachedResource');
        return $log[logFunction].apply($log, message);
      };
    };
    providerParams = {
      localStoragePrefix: localStoragePrefix,
      $log: {
        debug: debugMode ? bindLogFunction('debug') : (function() {}),
        error: bindLogFunction('error')
      }
    };
    CachedResourceManager = require('./cached_resource_manager')(providerParams);
    resourceManager = new CachedResourceManager($resource, $timeout, $q);
    if (resourceManagerListener) {
      document.removeEventListener('online', resourceManagerListener);
    }
    resourceManagerListener = function(event) {
      return resourceManager.flushQueues();
    };
    document.addEventListener('online', resourceManagerListener);
    $cachedResource = function() {
      return resourceManager.add.apply(resourceManager, arguments);
    };
    _ref = ['clearCache', 'clearUndefined'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fn = _ref[_i];
      $cachedResource[fn] = angular.bind(resourceManager, resourceManager[fn]);
    }
    return $cachedResource;
  }
];

},{"./cached_resource_manager":3}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var modifyObjectInPlace;

module.exports = modifyObjectInPlace = function(oldObject, newObject, cachedObject) {
  var key, localChange, localChanges, _i, _j, _len, _len1, _ref, _ref1;
  _ref = Object.keys(oldObject);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    if (!(key[0] !== '$')) {
      continue;
    }
    localChange = cachedObject && (cachedObject[key] == null);
    if (!((newObject[key] != null) || localChange)) {
      delete oldObject[key];
    }
  }
  _ref1 = Object.keys(newObject);
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    key = _ref1[_j];
    if (key[0] !== '$') {
      if (angular.isObject(oldObject[key]) && angular.isObject(newObject[key])) {
        modifyObjectInPlace(oldObject[key], newObject[key], cachedObject != null ? cachedObject[key] : void 0);
      } else {
        localChanges = cachedObject && !angular.equals(oldObject[key], cachedObject[key]);
        if (!(angular.equals(oldObject[key], newObject[key]) || localChanges)) {
          oldObject[key] = newObject[key];
        }
      }
    }
  }
  if (newObject.length != null) {
    return oldObject.length = newObject.length;
  }
};

},{}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var processReadArgs;

module.exports = processReadArgs = function($q, args) {
  var deferred, error, params, success;
  args = Array.prototype.slice.call(args);
  params = angular.isObject(args[0]) ? args.shift() : {};
  success = args[0], error = args[1];
  deferred = $q.defer();
  if (angular.isFunction(success)) {
    deferred.promise.then(success);
  }
  if (angular.isFunction(error)) {
    deferred.promise["catch"](error);
  }
  return {
    params: params,
    deferred: deferred
  };
};

},{}],7:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var modifyObjectInPlace, processReadArgs, readArrayCache,
  __slice = [].slice;

processReadArgs = require('./process_read_args');

modifyObjectInPlace = require('./modify_object_in_place');

module.exports = readArrayCache = function($q, providerParams, name, CachedResource, actionConfig) {
  var ResourceCacheArrayEntry, ResourceCacheEntry, first;
  ResourceCacheEntry = require('./resource_cache_entry')(providerParams);
  ResourceCacheArrayEntry = require('./resource_cache_array_entry')(providerParams);
  first = function(array, params) {
    var found, item, itemParams, _i, _len;
    found = null;
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      itemParams = item.$params();
      if (Object.keys(params).every(function(key) {
        return itemParams[key] === params[key];
      })) {
        found = item;
        break;
      }
    }
    return found;
  };
  return function() {
    var arrayInstance, cacheArrayEntry, cacheDeferred, cacheInstanceEntry, cacheInstanceParams, httpDeferred, params, readHttp, _i, _len, _ref, _ref1;
    _ref = processReadArgs($q, arguments), params = _ref.params, cacheDeferred = _ref.deferred;
    httpDeferred = $q.defer();
    arrayInstance = new Array();
    arrayInstance.$promise = cacheDeferred.promise;
    arrayInstance.$httpPromise = httpDeferred.promise;
    cacheArrayEntry = new ResourceCacheArrayEntry(CachedResource.$key, params).load();
    arrayInstance.$push = function(resourceInstance) {
      arrayInstance.push(resourceInstance);
      return cacheArrayEntry.addInstances([resourceInstance], false, {
        append: true
      });
    };
    arrayInstance.$httpPromise.then(function(instances) {
      return cacheArrayEntry.addInstances(instances, false);
    });
    readHttp = function() {
      var resource;
      resource = CachedResource.$resource[name](params);
      resource.$promise.then(function(response) {
        var newArrayInstance;
        newArrayInstance = new Array();
        response.map(function(resourceInstance) {
          var existingInstance;
          resourceInstance = new CachedResource(resourceInstance);
          existingInstance = first(arrayInstance, resourceInstance.$params());
          if (existingInstance) {
            modifyObjectInPlace(existingInstance, resourceInstance);
            return newArrayInstance.push(existingInstance);
          } else {
            return newArrayInstance.push(resourceInstance);
          }
        });
        arrayInstance.splice.apply(arrayInstance, [0, arrayInstance.length].concat(__slice.call(newArrayInstance)));
        if (!cacheArrayEntry.value) {
          cacheDeferred.resolve(arrayInstance);
        }
        return httpDeferred.resolve(arrayInstance);
      });
      return resource.$promise["catch"](function(error) {
        if (!cacheArrayEntry.value) {
          cacheDeferred.reject(error);
        }
        return httpDeferred.reject(error);
      });
    };
    if (!actionConfig.cacheOnly) {
      CachedResource.$writes.flush(readHttp);
    }
    if (cacheArrayEntry.value) {
      _ref1 = cacheArrayEntry.value;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        cacheInstanceParams = _ref1[_i];
        cacheInstanceEntry = new ResourceCacheEntry(CachedResource.$key, cacheInstanceParams).load();
        arrayInstance.push(new CachedResource(cacheInstanceEntry.value));
      }
      cacheDeferred.resolve(arrayInstance);
    } else if (actionConfig.cacheOnly) {
      cacheDeferred.reject(new Error("Cache value does not exist for params", params));
    }
    return arrayInstance;
  };
};

},{"./modify_object_in_place":5,"./process_read_args":6,"./resource_cache_array_entry":9,"./resource_cache_entry":10}],8:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var modifyObjectInPlace, processReadArgs, readCache;

processReadArgs = require('./process_read_args');

modifyObjectInPlace = require('./modify_object_in_place');

module.exports = readCache = function($q, providerParams, name, CachedResource, actionConfig) {
  var ResourceCacheEntry;
  ResourceCacheEntry = require('./resource_cache_entry')(providerParams);
  return function() {
    var cacheDeferred, cacheEntry, httpDeferred, instance, params, readHttp, _ref;
    _ref = processReadArgs($q, arguments), params = _ref.params, cacheDeferred = _ref.deferred;
    httpDeferred = $q.defer();
    instance = new CachedResource({
      $promise: cacheDeferred.promise,
      $httpPromise: httpDeferred.promise
    });
    cacheEntry = new ResourceCacheEntry(CachedResource.$key, params).load();
    readHttp = function() {
      var resource;
      resource = CachedResource.$resource[name].call(CachedResource.$resource, params);
      resource.$promise.then(function(httpResponse) {
        modifyObjectInPlace(instance, httpResponse);
        if (!cacheEntry.value) {
          cacheDeferred.resolve(instance);
        }
        httpDeferred.resolve(instance);
        if (cacheEntry.dirty) {
          providerParams.$log.error("unexpectedly setting a clean entry (load) over a dirty entry (pending write)");
        }
        return cacheEntry.set(httpResponse, false);
      });
      return resource.$promise["catch"](function(error) {
        if (!cacheEntry.value) {
          cacheDeferred.reject(error);
        }
        return httpDeferred.reject(error);
      });
    };
    if (cacheEntry.dirty) {
      CachedResource.$writes.processResource(params, readHttp);
    } else if (!actionConfig.cacheOnly) {
      readHttp();
    }
    if (cacheEntry.value) {
      angular.extend(instance, cacheEntry.value);
      cacheDeferred.resolve(instance);
    } else if (actionConfig.cacheOnly) {
      cacheDeferred.reject(new Error("Cache value does not exist for params", params));
    }
    return instance;
  };
};

},{"./modify_object_in_place":5,"./process_read_args":6,"./resource_cache_entry":10}],9:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(providerParams) {
  var $log, ResourceCacheArrayEntry, ResourceCacheEntry;
  $log = providerParams.$log;
  ResourceCacheEntry = require('./resource_cache_entry')(providerParams);
  return ResourceCacheArrayEntry = (function(_super) {
    __extends(ResourceCacheArrayEntry, _super);

    function ResourceCacheArrayEntry() {
      return ResourceCacheArrayEntry.__super__.constructor.apply(this, arguments);
    }

    ResourceCacheArrayEntry.prototype.defaultValue = [];

    ResourceCacheArrayEntry.prototype.cacheKeyPrefix = function() {
      return "" + this.key + "/array";
    };

    ResourceCacheArrayEntry.prototype.addInstances = function(instances, dirty, options) {
      var cacheArrayReferences, cacheInstanceEntry, cacheInstanceParams, instance, _i, _len;
      if (options == null) {
        options = {
          append: false
        };
      }
      cacheArrayReferences = options.append ? this.value : [];
      if (cacheArrayReferences == null) {
        cacheArrayReferences = [];
      }
      for (_i = 0, _len = instances.length; _i < _len; _i++) {
        instance = instances[_i];
        cacheInstanceParams = instance.$params();
        if (Object.keys(cacheInstanceParams).length === 0) {
          $log.error("'" + this.key + "' instance doesn't have any boundParams. Please, make sure you specified them in your resource's initialization, f.e. `{id: \"@id\"}`, or it won't be cached.");
        } else {
          cacheArrayReferences.push(cacheInstanceParams);
          cacheInstanceEntry = new ResourceCacheEntry(this.key, cacheInstanceParams).load();
          if (!(options.append && (cacheInstanceEntry.value != null))) {
            cacheInstanceEntry.set(instance, dirty);
          }
        }
      }
      return this.set(cacheArrayReferences, dirty);
    };

    return ResourceCacheArrayEntry;

  })(ResourceCacheEntry);
};

},{"./resource_cache_entry":10}],10:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
module.exports = function(providerParams) {
  var $log, Cache, ResourceCacheEntry;
  $log = providerParams.$log;
  Cache = require('./cache')(providerParams);
  return ResourceCacheEntry = (function() {
    ResourceCacheEntry.prototype.defaultValue = {};

    ResourceCacheEntry.prototype.cacheKeyPrefix = function() {
      return this.key;
    };

    ResourceCacheEntry.prototype.fullCacheKey = function() {
      return this.cacheKeyPrefix() + this.cacheKeyParams;
    };

    function ResourceCacheEntry(key, params) {
      var param, paramKeys;
      this.key = key;
      paramKeys = angular.isObject(params) ? Object.keys(params).sort() : [];
      if (paramKeys.length) {
        this.cacheKeyParams = '?' + ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = paramKeys.length; _i < _len; _i++) {
            param = paramKeys[_i];
            _results.push("" + param + "=" + params[param]);
          }
          return _results;
        })()).join('&');
      } else {
        this.cacheKeyParams = '';
      }
    }

    ResourceCacheEntry.prototype.load = function() {
      var _ref;
      _ref = Cache.getItem(this.fullCacheKey(), this.defaultValue), this.value = _ref.value, this.dirty = _ref.dirty;
      return this;
    };

    ResourceCacheEntry.prototype.set = function(value, dirty) {
      this.value = value;
      this.dirty = dirty;
      return this._update();
    };

    ResourceCacheEntry.prototype._update = function() {
      return Cache.setItem(this.fullCacheKey(), {
        value: this.value,
        dirty: this.dirty
      });
    };

    return ResourceCacheEntry;

  })();
};

},{"./cache":2}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var CACHE_RETRY_TIMEOUT;

CACHE_RETRY_TIMEOUT = 60000;

module.exports = function(providerParams, $q) {
  var $log, Cache, ResourceCacheEntry, ResourceWriteQueue, flushQueueDeferreds, resetDeferred, resolveDeferred;
  $log = providerParams.$log;
  ResourceCacheEntry = require('./resource_cache_entry')(providerParams);
  Cache = require('./cache')(providerParams);
  flushQueueDeferreds = {};
  resetDeferred = function(queue) {
    var deferred;
    deferred = $q.defer();
    flushQueueDeferreds[queue.key] = deferred;
    queue.promise = deferred.promise;
    return deferred;
  };
  resolveDeferred = function(queue) {
    return flushQueueDeferreds[queue.key].resolve();
  };
  return ResourceWriteQueue = (function() {
    ResourceWriteQueue.prototype.logStatusOfRequest = function(status, action, params, data) {
      return $log.debug("" + action + " for " + this.key + " " + (angular.toJson(params)) + " " + status + " (queue length: " + this.queue.length + ")", data);
    };

    function ResourceWriteQueue(CachedResource, $timeout) {
      var write, _i, _len, _ref;
      this.CachedResource = CachedResource;
      this.$timeout = $timeout;
      this.key = "" + this.CachedResource.$key + "/write";
      this.queue = Cache.getItem(this.key, []);
      _ref = this.queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        write.busy = false;
      }
      resetDeferred(this);
      if (this.queue.length === 0) {
        resolveDeferred(this);
      }
    }

    ResourceWriteQueue.prototype.enqueue = function(params, resourceData, action, deferred) {
      var resourceParams, write, _ref, _ref1;
      if (this.queue.length === 0) {
        resetDeferred(this);
      }
      resourceParams = angular.isArray(resourceData) ? resourceData.map(function(resource) {
        return resource.$params();
      }) : resourceData.$params();
      write = this.findWrite({
        params: params,
        action: action
      });
      if (write == null) {
        this.queue.push({
          params: params,
          resourceParams: resourceParams,
          action: action,
          deferred: deferred
        });
        this._update();
      } else {
        if ((_ref = write.deferred) != null) {
          _ref.promise.then(function(response) {
            return deferred.resolve(response);
          });
        }
        if ((_ref1 = write.deferred) != null) {
          _ref1.promise["catch"](function(error) {
            return deferred.reject(error);
          });
        }
      }
      return this.logStatusOfRequest('enqueued', action, params, resourceData);
    };

    ResourceWriteQueue.prototype.findWrite = function(_arg) {
      var action, params, write, _i, _len, _ref;
      action = _arg.action, params = _arg.params;
      _ref = this.queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        if (action === write.action && angular.equals(params, write.params)) {
          return write;
        }
      }
    };

    ResourceWriteQueue.prototype.removeWrite = function(_arg) {
      var action, entry, newQueue, params, _i, _len, _ref;
      action = _arg.action, params = _arg.params;
      newQueue = [];
      _ref = this.queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entry = _ref[_i];
        if (!(action === entry.action && angular.equals(params, entry.params))) {
          newQueue.push(entry);
        }
      }
      this.queue = newQueue;
      if (this.queue.length === 0 && this.timeoutPromise) {
        this.$timeout.cancel(this.timeoutPromise);
        delete this.timeoutPromise;
      }
      this._update();
      if (this.queue.length === 0) {
        return resolveDeferred(this);
      }
    };

    ResourceWriteQueue.prototype.flush = function(done) {
      var write, _i, _len, _ref, _results;
      if (angular.isFunction(done)) {
        this.promise.then(done);
      }
      this._setFlushTimeout();
      _ref = this.queue;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        _results.push(this._processWrite(write));
      }
      return _results;
    };

    ResourceWriteQueue.prototype.processResource = function(params, done) {
      var notDone, write, _i, _len, _ref, _results;
      notDone = true;
      _ref = this._writesForResource(params);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        _results.push(this._processWrite(write, (function(_this) {
          return function() {
            if (notDone && _this._writesForResource(params).length === 0) {
              notDone = false;
              return done();
            }
          };
        })(this)));
      }
      return _results;
    };

    ResourceWriteQueue.prototype._writesForResource = function(params) {
      var write, _i, _len, _ref, _results;
      _ref = this.queue;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        write = _ref[_i];
        if (angular.equals(params, write.params)) {
          _results.push(write);
        }
      }
      return _results;
    };

    ResourceWriteQueue.prototype._processWrite = function(write, done) {
      var cacheEntries, onFailure, onSuccess, writeData;
      if (write.busy) {
        return;
      }
      write.busy = true;
      if (angular.isArray(write.resourceParams)) {
        cacheEntries = write.resourceParams.map((function(_this) {
          return function(resourceParams) {
            return new ResourceCacheEntry(_this.CachedResource.$key, resourceParams).load();
          };
        })(this));
        writeData = cacheEntries.map(function(cacheEntry) {
          return cacheEntry.value;
        });
      } else {
        cacheEntries = [new ResourceCacheEntry(this.CachedResource.$key, write.resourceParams).load()];
        writeData = cacheEntries[0].value;
      }
      onSuccess = (function(_this) {
        return function(value) {
          var _ref;
          _this.removeWrite(write);
          if ((_ref = write.deferred) != null) {
            _ref.resolve(value);
          }
          _this.logStatusOfRequest('succeeded', write.action, write.resourceParams, writeData);
          if (angular.isFunction(done)) {
            return done();
          }
        };
      })(this);
      onFailure = (function(_this) {
        return function(error) {
          var _ref;
          if (error && error.status >= 400 && error.status < 500) {
            _this.removeWrite(write);
            $log.error("" + write.action + " to " + _this.CachedResource.$key + " failed with error " + error.status, {
              method: error.config.method,
              url: error.config.url,
              writeData: writeData
            });
          } else {
            write.busy = false;
            _this.logStatusOfRequest("failed with error " + (angular.toJson(error)) + "; still in queue", write.action, write.resourceParams, writeData);
          }
          return (_ref = write.deferred) != null ? _ref.reject(error) : void 0;
        };
      })(this);
      this.CachedResource.$resource[write.action](write.params, writeData, onSuccess, onFailure).$promise.then((function(_this) {
        return function(savedResources) {
          var cacheEntry, resource, resourceInstance, _i, _len, _results;
          savedResources = angular.isArray(savedResources) ? savedResources : [savedResources];
          _results = [];
          for (_i = 0, _len = savedResources.length; _i < _len; _i++) {
            resource = savedResources[_i];
            resourceInstance = new _this.CachedResource(resource);
            cacheEntry = new ResourceCacheEntry(_this.CachedResource.$key, resourceInstance.$params()).load();
            _results.push(cacheEntry.set(resource, false));
          }
          return _results;
        };
      })(this));
      return this.logStatusOfRequest('processed', write.action, write.resourceParams, writeData);
    };

    ResourceWriteQueue.prototype._setFlushTimeout = function() {
      if (this.queue.length > 0 && !this.timeoutPromise) {
        this.timeoutPromise = this.$timeout(angular.bind(this, this.flush), CACHE_RETRY_TIMEOUT);
        return this.timeoutPromise.then((function(_this) {
          return function() {
            delete _this.timeoutPromise;
            return _this._setFlushTimeout();
          };
        })(this));
      }
    };

    ResourceWriteQueue.prototype._update = function() {
      var savableQueue;
      savableQueue = this.queue.map(function(write) {
        return {
          params: write.params,
          resourceParams: write.resourceParams,
          action: write.action
        };
      });
      return Cache.setItem(this.key, savableQueue);
    };

    return ResourceWriteQueue;

  })();
};

},{"./cache":2,"./resource_cache_entry":10}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var modifyObjectInPlace, writeCache;

modifyObjectInPlace = require('./modify_object_in_place');

module.exports = writeCache = function($q, providerParams, action, CachedResource, actionConfig) {
  var ResourceCacheEntry;
  ResourceCacheEntry = require('./resource_cache_entry')(providerParams);
  return function() {
    var args, cacheEntry, data, deferred, error, instanceMethod, isArray, isDirty, param, params, queueDeferred, resource, success, value, wrapInCachedResource, _i, _len, _ref;
    instanceMethod = this instanceof CachedResource;
    args = Array.prototype.slice.call(arguments);
    params = !instanceMethod && angular.isObject(args[1]) ? args.shift() : instanceMethod && angular.isObject(args[0]) ? args.shift() : {};
    data = instanceMethod ? this : args.shift();
    success = args[0], error = args[1];
    isArray = angular.isArray(data);
    isDirty = !actionConfig.cacheOnly;
    wrapInCachedResource = function(object) {
      if (object instanceof CachedResource) {
        return object;
      } else {
        return new CachedResource(object);
      }
    };
    if (isArray) {
      data = data.map(function(o) {
        return wrapInCachedResource(o);
      });
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        resource = data[_i];
        cacheEntry = new ResourceCacheEntry(CachedResource.$key, resource.$params()).load();
        if (!angular.equals(cacheEntry.data, resource)) {
          cacheEntry.set(resource, isDirty);
        }
      }
    } else {
      data = wrapInCachedResource(data);
      _ref = data.$params();
      for (param in _ref) {
        value = _ref[param];
        params[param] = value;
      }
      cacheEntry = new ResourceCacheEntry(CachedResource.$key, data.$params()).load();
      if (!angular.equals(cacheEntry.data, data)) {
        cacheEntry.set(data, isDirty);
      }
    }
    data.$resolved = false;
    deferred = $q.defer();
    data.$promise = deferred.promise;
    if (angular.isFunction(success)) {
      deferred.promise.then(success);
    }
    if (angular.isFunction(error)) {
      deferred.promise["catch"](error);
    }
    if (actionConfig.cacheOnly) {
      data.$resolved = true;
      deferred.resolve(data);
    } else {
      queueDeferred = $q.defer();
      queueDeferred.promise.then(function(httpResource) {
        cacheEntry.load();
        modifyObjectInPlace(data, httpResource, cacheEntry.value);
        data.$resolved = true;
        return deferred.resolve(data);
      });
      queueDeferred.promise["catch"](deferred.reject);
      CachedResource.$writes.enqueue(params, data, action, queueDeferred);
      CachedResource.$writes.flush();
    }
    return data;
  };
};

},{"./modify_object_in_place":5,"./resource_cache_entry":10}]},{},[4]);

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

                    var model, multi, prop, dataSrc, readonly, type, mode, switchMode, validators, settings, required, watchMethod;

                    model = scope.configuration.model;
                    multi = scope.configuration.multi;

                    dataSrc = scope.configuration.data;

                    prop = scope.configuration.displayProperty;
                    readonly = scope.configuration.readonly;
                    type = scope.configuration.type;
                    mode = scope.configuration.selectionMode;
                    switchMode = scope.configuration.switchMode;
                    watchMethod = multi ? '$watchCollection' : '$watch';

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



                    scope[watchMethod]('$parent.editor.data.'+ model, function( n ) {

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

                                scope.$parent.editor.data[ model ] = handleValue( val );
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
                },
                copyState : function copyState( data ) {


                    data.$serverState = {};


                    for (var p in data) {

                        if (data.hasOwnProperty(p)) {

                            data.$serverState[p] = _.clone(data[p]);
                        }
                    }

                    return data;
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
    function resourceLoaderFactory( $dataResource ) {

        return function ResourceLoader( resourceName, settings ) {

            this.data = [];
            var filters = {};
            var sorting = new Sorting();
            var self = this;
            var contentRange = new ContentRange(resourceName);


            var resource = $dataResource( resourceName, null, contentRange);

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

            return function( data, headers ) {

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

                normalizedName = resourceName.replace(/\_/g,'-');

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

            // function copyState( data ) {
            //
            //
            //     data.$serverState = {};
            //
            //
            //     for (var p in data) {
            //
            //         if (data.hasOwnProperty(p)) {
            //
            //             data.$serverState[p] = _.clone(data[p]);
            //         }
            //     }
            //
            //     return data;
            // }

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

                }

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

})( angular );
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
