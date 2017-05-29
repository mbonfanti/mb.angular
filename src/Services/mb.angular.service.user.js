angular.module("mb.angular").factory("userSvc", ['baseSvc', '$q', '$http', 'commonSvc', function (baseSvc, $q, $http, commonSvc) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.isAdmin = false;

    factory.getCurrentUser = function (w) {
        return $http({
            url: w + "/_api/web/getuserbyid(" + _spPageContextInfo.userId + ")",
            method: "GET",
            headers: factory.headers
        });

    }
    factory.getUserByID = function (w, i) {
        return $http({
            url: w + "/_api/web/getuserbyid(" + i + ")",
            method: "GET",
            headers: factory.headers
        });
    }

    // Torna il profilo utente preso dall'UPS - torna errore se l'ups non è attivo
    factory.getUserProfile = function (w, accountName) {
        var deferred = $q.defer();
        $http({
            url: w + "/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='" + encodeURIComponent(accountName) + "'",
            method: "GET",
            headers: factory.headers
        })
            .then(function (data) {
                var tempUser = data.data.d;
                tempUser.uniqueID = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                if (tempUser.UserProfileProperties != undefined) {
                    angular.merge(tempUser, commonSvc.resultsToObject(tempUser.UserProfileProperties.results, 'Key', 'Value'));
                }
                deferred.resolve(tempUser)
            },
            function (error) {
                deferred.reject(error)
            })

        return deferred.promise;
    }

    // Torna l'utente completo, passando il solo ID utente, controlla se ups è attivo e funzionante, nel caso
    // la proprietaa isUps ci dice se il profilo è completo dall'ups

    factory.getCompleteUserProfile = function (w, id) {
        var utenteCompleto = {}
        utenteCompleto.isUps = false;
        var deferred = $q.defer();
        factory.getUserByID(w, id).then(
            function (data) {
                utenteCompleto = data.data.d;
                utenteCompleto.isUps = false;
                utenteCompleto.isUpsAlert = false;
                console.log(data)
                factory.getUserProfile(w, data.data.d.LoginName)
                    .then(function (data) {
                        utenteCompleto.isUps = true
                        angular.merge(utenteCompleto, data)
                        return deferred.resolve(utenteCompleto)
                    }, function (err) {
                        utenteCompleto.isUpsAlert = true;
                        return deferred.resolve(utenteCompleto)
                    })
            }, function (err) {

                return deferred.reject(err)
            })

        return deferred.promise;
    }



    factory.userInGroupsSP = function (url, userId, groups) {
        var deferred = jQuery.Deferred();
        var t = false;
        var arrGroups = groups.split(';');
        factory.getDigest(url).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue;
            baseSvc.getUserGroups(url, userId, digest)
                .done(function (r) {
                    for (i === 0; i < arrGroups; i++) {
                        t = commonSvc.arrayContiene(r.d.results, arrGroups[i])
                    }
                    deferred.resolve(t);
                }).fail(function (data, status) {
                    deferred.reject(data);
                })
        });

        return deferred.promise();
    }
    factory.userInGroups = function (url, userId, groups) {
        var deferred = jQuery.Deferred();
        var t = false;
        var arrGroups = groups.split(';');
        baseSvc.getListFilter(url, "Gruppi", "")
            .then(function (data) {

                for (var i = 0; i < arrGroups.length; i++) {
                    t = commonSvc.arrayContiene(data.data.d.results, arrGroups[i])
                }
                deferred.resolve(t);

            },function (data) {


                deferred.reject(data);

            })

        return deferred.promise();
    }

    factory.ensureUser = function (w, loginName) {
        var payload = { 'logonName': loginName };
        return $http({
            url: w + "/_api/web/ensureuser",
            method: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(payload),
            headers: {
                "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                "accept": "application/json;odata=verbose",
                "Content-Type": "application/json; odata=verbose"
            }
        });
    }

    factory.getUsersFromGroup = function (w, g) {
        var request = $http({
            url: w + "/_api/web/sitegroups/getByName('" + g + "')/Users",
            method: "GET",
            headers: factory.headers
        });
        return request;
    }


    factory.getUserGroups = function (w, i, d) {
        return $http({
            url: w + "/_api/web/GetUserById(" + i + ")/Groups",
            type: "GET",
            headers: { "Accept": "application/json; odata=verbose", "X-RequestDigest": d },
            dataType: "json"
        });

    }

    factory.addUserToGroup = function (w, g, u) {
        return baseSvc.getDigest(w).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue;

            return $http({
                url: w + "/_api/web/sitegroups/getByName('" + g + "')/users",
                method: "POST",
                data: JSON.stringify({ '__metadata': { 'type': 'SP.User' }, 'LoginName': u }),
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "Content-Type": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                }
            });
        });
    }

    factory.removeUserFromGroup = function (w, g, u) {
        return baseSvc.getDigest(w).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue;
            return $http({
                url: w + "/_api/web/sitegroups/getByName('" + g + "')/users/removebyid(" + u + ")",
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "Content-Type": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                }
            });
        });
    }

    factory.getUpsCurrentUser = function (w, filter) {
        return baseSvc.getRestFilter(w + "/_api/SP.UserProfiles.PeopleManager/GetMyProperties", filter)
    };
    factory.getUpsCurrentUserObj = function (w, filter) {
        var deferred = $q.defer();
        factory.getUpsCurrentUser(w, filter)
            .then(function (data) {
                var temp = data.data.d;
                $.each(temp.UserProfileProperties.results, function (index, result) {
                    temp[result.Key] = result.Value
                });

                deferred.resolve(temp);
            },
            function (error) {
                // Non esiste, creiamolo
                console.log(error)
                deferred.reject(error);
            });

        return deferred.promise;
    };

    return factory;
}])
angular.module("mb.angular").factory("adUserSvc", ['commonSvc', 'baseSvc', '$q', '$http', function (commonSvc, baseSvc, $q, $http) {

    var factory = {};
    factory.webApiOrgUrl = "http://itdgtosax000045fe.idg.audi.vwg:81/organization";
    factory.getADGroups = function (ut) {
        return baseSvc.getRest(factory.webApiOrgUrl + "/api/usersUtility/?id=" + ut)
    }
    factory.isUserMember = function (ut, gr) {
        var deferred = jQuery.Deferred();
        factory.getADGroups(ut).then(function (data) {
            var match = false;
            for (var i = 0; i < data.length; i++) {

                if (data[i] === gr) {
                    match = true;
                }

            }
            if (match) {
                deferred.resolve(data);
            } else {
                deferred.reject(err);
            }
        });
        return deferred.promise();
    }
    return factory;
}])