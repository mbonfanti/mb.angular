angular.module("mb.angular").factory("configSvc", ['$q', '$http', "baseSvc", "commonSvc", function ($q, $http, baseSvc, commonSvc) {
    var factory = {};

    factory.headers = { "accept": "application/json;odata=verbose" };
    // CONSTRUCT CONFIG
    factory.config = "";
    factory.getConfig = function (u) {
        var deferred = $q.defer();

        if (factory.config === "") {
            baseSvc.getListFilter(u, 'Config', '')
            .then(
                function (data) {
                    var ris = data.data.d.results;

                    var conf = {}
                   
                    factory.config = commonSvc.resultsToObject(ris, 'Title', 'Value');
                    deferred.resolve(factory.config);
                },
                 function (err) {
                     deferred.reject()
                 })

        } else {
            deferred.resolve(factory.config);
        }

        return deferred.promise;
    }
    factory.getConfigFilter = function (u, t) {
        var deferred = $q.defer();
        factory.getConfig(u).then(
            function (values) {
                 var temp = factory.getConfigTerm(factory.config, t)
                 if (temp == "") {
                     deferred.reject('Non trovato');
                 } else {
                     deferred.resolve(temp);
                 }
             },
             function (err) {
                 deferred.reject()
             })
        
        return deferred.promise;
    }
    factory.getConfigTerm = function (c, t) {
        var result = c[t] === undefined;
        if (!result) {
            return c[t]
        } else {
            return "";
        }
    }

    return factory;
}])
