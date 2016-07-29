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