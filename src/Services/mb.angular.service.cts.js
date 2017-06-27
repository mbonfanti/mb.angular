angular.module("mb.angular").factory("ctsSvc", ['$q', '$http', 'commonSvc', function ($q, $http, commonSvc) {

    var factory = {};

    factory.headers = {
        "accept": "application/json;odata=verbose"
    };


    factory.getByGroup = function (w, g) {
        var restUrl = w + "/_api/web/AvailableContentTypes?$filter=Group eq '" + g + "'";
        return $http({
            type: "GET",
            url: restUrl,
            headers: factory.headers
        });
    }


    factory.getByGroupObj = function (w, g) {
        var deferred = jQuery.Deferred();

        factory.getByGroup(w, g)
            .then(function (data) {
                var temp = commonSvc.resultsToObjectAll(data.data.d.results,'Name')
                    deferred.resolve(temp);
                },
                function (error) {

                    deferred.reject(error);


                });

        return deferred;

    }

    return factory;
}])