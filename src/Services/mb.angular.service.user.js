angular.module("mb.angular").factory("userSvc", ['baseSvc', '$q', '$http', 'commonSvc', function (baseSvc, $q, $http, commonSvc) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.isAdmin = false;
    factory.getUserProfile = function (w, accountName) {
        var temp = accountName.split('|')[1]
        return $http({
            url: w + "/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='" + temp + "'",
            method: "GET",
            headers: factory.headers
        });

    }

    factory.getCompleteUserProfile = function (w, user) {

        var deferred = $q.defer();
        factory.getUserProfile(w, user.Name)
           .then(
               function (data) {
                   var tempUser = {}
                   angular.merge(tempUser, user, data.data.d)
                   angular.merge(tempUser, tempUser, commonSvc.resultsToObject(data.data.d.UserProfileProperties.results, 'Key', 'Value'))


                   if (!tempUser.PictureUrl) {
                       tempUser.PictureUrl = w + '/_layouts/15/Images/Space/avatar.png'
                       //ctrl.simple = true;
                   }
                   if (tempUser["SPS-SipAddress"]) {
                       tempUser.sip = tempUser["SPS-SipAddress"];
                   } else {
                       tempUser.sip = tempUser.Email;
                   }

                   tempUser.uniqueID = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);

                   return deferred.resolve(tempUser)
               })

        return deferred.promise;
    }


    factory.getUserByID = function (w, i) {
        var deferred = $q.defer();
        var request = $http({
            url: w + "/_api/web/getuserbyid(" + i + ")",
            method: "GET",
            headers: factory.headers,
            success: function (data) {
                var t = data.d;
                t.UserName = commonSvc.DecodeClaim(t.LoginName);
                deferred.resolve(t);
            },
            error: function (err) {
                deferred.reject(err);
            }
        });


        return deferred.promise;
    }
    factory.userInGroupsSP = function (url, userId, groups) {
        var deferred = jQuery.Deferred();
        var t = false;
        var arrGroups = groups.split(';');
        factory.getDigest(url).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue;
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
        .success(function (data) {

            for (var i = 0; i < arrGroups.length; i++) {
                t = commonSvc.arrayContiene(data.d.results, arrGroups[i])
            }
            deferred.resolve(t);

        }).error(function (data) {


            deferred.reject(data);

        })

        return deferred.promise();
    }

    factory.ensureUser = function (w, loginName) {
        var payload = { 'logonName': loginName };
        return $http({
            url: w + "/_api/web/ensureuser",
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(payload),
            headers: {
                "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                "accept": "application/json;odata=verbose"
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
    factory.getCurrentUser = function (w, i) {
        return $http({
            url: w + "/_api/web/getuserbyid(" + i + ")",
            method: "GET",
            headers: factory.headers
        });

    }

    factory.getUserGroups = function (w, i, d) {
        return $http({
            url: w + "/_api/web/GetUserById(" + i + ")/Groups",
            type: "GET",
            headers: { "Accept": "application/json; odata=verbose", "X-RequestDigest": d },
            dataType: "json"
        });

    }
    factory.addUserToGroup = function (w, g, u, d) {
        return $http({
            url: w + "/_api/web/sitegroups(" + g + ")/users",
            method: "POST",
            data: JSON.stringify({ '__metadata': { 'type': 'SP.User' }, 'LoginName': u }),
            headers: {
                "Accept": "application/json; odata=verbose",
                "Content-Type": "application/json; odata=verbose",
                "X-RequestDigest": d
            }
        });
    }
    factory.removeUserFromGroup = function (w, g, u, d) {
        return $http({
            url: w + "/_api/web/sitegroups(" + g + ")/users/removebyid(" + u + ")",
            method: "POST",
            headers: {
                "Accept": "application/json; odata=verbose",
                "Content-Type": "application/json; odata=verbose",
                "X-RequestDigest": d
            }
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