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