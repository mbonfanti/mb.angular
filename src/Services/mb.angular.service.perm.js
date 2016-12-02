angular.module("mb.angular").factory("permSvc", ['baseSvc', '$q', '$http', function (baseSvc, $q, $http) {
    var factory = {};

    // Util Functions 
    factory.findPermission = function (r,p) {
        var temp = false;
        var roles = factory.parseBasePermissions(r);
        for (var i = 0; i < roles.length; i++) {
            if (roles[i] === p) {
                temp = true
            }
        }
        return temp
    }
    factory.parseBasePermissions = function (value) {
        var permissions = new SP.BasePermissions();
        permissions.initPropertiesFromJson(value);

        var permLevels = [];
        for (var permLevelName in SP.PermissionKind.prototype) {
            if (SP.PermissionKind.hasOwnProperty(permLevelName)) {
                var permLevel = SP.PermissionKind.parse(permLevelName);
                if (permissions.has(permLevel)) {
                    permLevels.push(permLevelName);
                }
            }
        }
        return permLevels;
    }

    // PERMISSION ITEM
    factory.getListUserEffectivePermissions = function (w, l, a) {

        var endpointUrl = w + "/_api/web/lists/getbytitle('" + l + "')/getusereffectivepermissions(@u)?@u='" + encodeURIComponent(a) + "'";

        return $http({
            url: endpointUrl,
            method: "GET",
            headers: baseSvc.headers
        });
    }
    factory.chekPermissionOnList = function (w, l, a, p) {
        /*
         * Controlla se la lista di destinazione contiene il permesso che passiamo come paramentro
         * chekPermissionOnList(webUrl,'Documents','i:0#.f|membership|jdoe@tenant.onmicrosoft.com','editListItems')
         */
        var deferred = $q.defer();
        factory.getListUserEffectivePermissions(w, l, a)
        .success(function (data) {
            deferred.resolve(factory.findPermission(data.d.GetUserEffectivePermissions,p));

        }).error(function (data) {
            deferred.reject(data);
        })
        return deferred.promise;
    }

    // Permission on web
    factory.getWebUserEffectivePermissions = function (w, a) {
        var endpointUrl = w + "/_api/web/getusereffectivepermissions(@u)?@u='" + encodeURIComponent(a) + "'";

        return $http({
            url: endpointUrl,
            method: "GET",
            headers: baseSvc.headers
        });
    }
    factory.chekPermissionOnWeb = function (w, a, p) {
        /*
         * Controlla se la lista di destinazione contiene il permesso che passiamo come paramentro
         * chekPermissionOnList(webUrl,'Documents','i:0#.f|membership|jdoe@tenant.onmicrosoft.com','editListItems')
         */
        var deferred = $q.defer();
        factory.getWebUserEffectivePermissions(w, a)
        .success(function (data) {
            deferred.resolve(factory.findPermission(data.d.GetUserEffectivePermissions, p));

        }).error(function (data) {
            deferred.reject(data);
        })
        return deferred.promise;
    }

    // Role Binding
    factory.getTargetRoleDefinitionId = function (u, t) {
        var deferred = jQuery.Deferred();
        $http({
            url: u + '/_api/web/roledefinitions/getbyname(\'' + t + '\')/id',
            type: 'GET',
            headers: { 'accept': 'application/json;odata=verbose' },
            success: function (responseData) {
                deferred.resolve(responseData.d.Id);
            },
            error: function (data) {
                deferred.reject(data);
            }
        });
        return deferred.promise();
    }
    factory.addRoleDefinitionBinding = function (w, list, iditem, level, user) {
        return factory.getDigest(w).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue
            return factory.getTargetRoleDefinitionId(w, level).then(function (id) {
                return $http({
                    url: w + '/_api/web/lists/getByTitle(\'' + list + '\')/Items(' + iditem + ')/roleassignments/addroleassignment(principalid=' + user + ',roledefid=' + id + ')',
                    type: 'POST',
                    headers: {
                        'X-RequestDigest': digest,
                        'accept': "application/json;odata=verbose",
                        'content-type': "application/json;odata=verbose"
                    }
                });
            });
        });
    }
    factory.removeRoleDefinitionBinding = function (w, list, iditem, user) {
        return factory.getDigest(w).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue

            return $http({
                url: w + '/_api/web/lists/getByTitle(\'' + list + '\')/Items(' + iditem + ')/roleassignments/getbyprincipalid(' + user + ')',
                type: 'POST',
                headers: {
                    'X-RequestDigest': digest,
                    'accept': "application/json;odata=verbose",
                    'content-type': "application/json;odata=verbose",
                    'X-HTTP-Method': 'DELETE'
                }
            });

        });
    }

    /*
     * Check access to site -> 
     * url: string dell'url da controllare
     * return:
     * 0. Accesso al sito
     * 1. Accesso negato
     * 2. sito non esistente
     */

    factory.checkSiteAccesss = function (url) {
        var deferred = jQuery.Deferred();
        if (url === undefined || url === '' || url === null) {
            deferred.resolve(2)
        } else {
            $http.get(url)
                       .success(function (jqXHR, textStatus, errorThrown) {
                           if (textStatus === 200) {
                               deferred.resolve(0);
                           }
                           if (textStatus === 202) {
                               deferred.resolve(1);
                           }
                       })
                       .error(function (jqXHR, textStatus, errorThrown) {
                           deferred.resolve(2);
                       })
        }

        return deferred.promise();
    }

    // Utility
    return factory;
}])