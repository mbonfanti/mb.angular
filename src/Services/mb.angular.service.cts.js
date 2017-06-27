﻿angular.module("mb.angular").factory("ctsSvc", ['$q', '$http', 'commonSvc', function ($q, $http, commonSvc) {

    var factory = {};

    factory.headers = {
        "accept": "application/json;odata=verbose"
    };



    // Work With list Items
    factory.getByGroup = function (w, g) {
        var restUrl = w + "/_api/web/AvailableContentTypes?" + g;
        return $http({
            type: "GET",
            url: restUrl,
            headers: factory.headers
        });
    }



    // Work With Folders
    factory.getByGroupObj = function (w, g) {
        var deferred = jQuery.Deferred();

        factory.getByGroup(tempUrl)
            .then(function (data) {
                var temp = commonSvc.resultsToObjectAll(data.data.d.results,'Title')
                    deferred.resolve(temp);
                },
                function (error) {

                    deferred.reject(error);


                });

        return deferred;

    }

    return factory;
}])