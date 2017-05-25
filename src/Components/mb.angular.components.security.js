angular.module("mb.angular.components", ['mb.angular', 'mb.angular.templates'])

angular.module("mb.angular.components").directive('showOnHover', function () {
    return {
        restrict: 'AE',
        link: function (scope, element, attrs) {
            var elemento = attrs.elemento;
            if (!elemento) { elemento = 'div' }
            element.hide();
            element.closest(elemento).bind('mouseenter', function () {
                element.show();
            });
            element.closest(elemento).bind('mouseleave', function () {
                element.hide();
            });
        }
    };
})
angular.module("mb.angular.components").directive('showOnRowHover', function () {
    return {
        restrict: 'AE',
        link: function (scope, element, attrs) {

            element.closest('tr').bind('mouseenter', function () {
                element.show();
            });
            element.closest('tr').bind('mouseleave', function () {
                element.hide();
            });
        }
    };
})
//angular.module("mb.angular.components").directive('editPanelWeb', function () {
//    return {
//        restrict: 'AE',
//        template: '<span ng-transclude ng-if="$ctrl.permission"></span><div ng-if="$ctrl.error">{{ $ctrl.errorMessage }}</div>',
//        transclude: true,
//        controllerAs: '$ctrl',
//        scope: {
//            perm: '@',
//            user: '@'
//        },
//        controller: function (permSvc, logSvc) {
//            var ctrl = this;
//            debugger
//            ctrl.permission = false;
//            ctrl.$onInit = function (changesObj) {
//                permSvc.chekPermissionOnWeb(_spPageContextInfo.webAbsoluteUrl, mb.sp.user.LoginName, ctrl.perm)
//                    .then(function (value) {
//                        ctrl.permission = value
//                    }, function (err) {
//                        logSvc.logError(_spPageContextInfo.webAbsoluteUrl, 'Component - EditPanel', err, '', true, false)
//                    })
//            }
//        }
//    };
//})
//angular.module("space.app").component('editPanel', {
//    // Use: <edit-panel obj="mod.item" list="Announcements" perm="editListItems"></edit-panel>
//    template: '<span ng-transclude ng-if="$ctrl.permission"></span><div ng-if="$ctrl.error">{{ $ctrl.errorMessage }}</div>',
//    transclude: true,
//    bindings: {
//        obj: '<',
//        list: '@',
//        perm: '@'
//    },
//    controller: function (permSvc, logSvc) {
//        var ctrl = this;
//        ctrl.permission = false;
//        ctrl.$onChanges = function (changesObj) {
//            if (changesObj.obj.currentValue !== undefined) {

//                permSvc.chekPermissionOnList(_spPageContextInfo.webAbsoluteUrl, ctrl.list, mb.sp.user.LoginName, ctrl.perm)
//                    .then(function (value) {
//                        ctrl.permission = value
//                    }, function (err) {
//                        logSvc.logError(_spPageContextInfo.webAbsoluteUrl, 'Component - EditPanel', err, '', true, false)
//                    })
//            }
//        }
//    }

//});