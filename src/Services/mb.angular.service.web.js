angular.module("mb.angular").factory("webSvc", ['baseSvc', '$q', '$http', 'commonSvc', function (baseSvc, $q, $http, commonSvc) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };

    factory.getWebProperty = function (w, p) {
        return $http({
            url: w + "/_api/web/AllProperties?select='" + p + "'",
            method: "GET",
            headers: {
                "Accept": "application/json; odata=verbose",
            }
        });
    }
    factory.setWebPropertyRest = function (web, property, value) {
        return baseSvc.getDigest(web).then(function (data) {
            return $.ajax({
                url: web + "/_api/web",
                type: "POST",
                data: '{ "__metadata": { "type": "SP.Web" }, "' + property + '": "' + value + '" }',
                headers: {
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue,
                    "accept": "application/json;odata=verbose",
                    "content-type": "application/json;odata=verbose",
                    "X-HTTP-Method": "MERGE"
                }
            });
        });
    };

    factory.setWebProperty = function (w, p, v) {
        var deferred = $q.defer();

        var ctx = new SP.ClientContext.get_current();
        var web = ctx.get_site().get_rootWeb();
        this.props = web.get_allProperties();
        this.props.set_item(p, v);
        ctx.load(web);
        ctx.executeQueryAsync(
            Function.createDelegate(this, gotProperty),
            Function.createDelegate(this, failedGettingProperty)
        )

        function gotProperty() {

            deferred.resolve(this.props.get_item(p));
        }
        function failedGettingProperty() {
            deferred.reject(data);
        }
        return deferred.promise;
    }


    // Work With Folders
    factory.existFolder = function (w, l, u, f) {
        var deferred = jQuery.Deferred();
        var tempUrl = _spPageContextInfo.webAbsoluteUrl + "/_api/web/GetFolderByServerRelativeUrl('" + u + "')?$expand=Files"
        factory.getRest(tempUrl)
            .then(function (data) {
                deferred.resolve(data.data.d.Files.results);
            },
            function (error) {
                // Non esiste, creiamolo
                factory.createFolder(w, l, f)
                    .then(function (data) {
                        console.log(data)
                        deferred.resolve([]);
                    },
                    function (error) {
                        // Non esiste, creiamolo
                        console.log(error)
                        deferred.reject(error);
                    });

            });

        return deferred;

    }

    return factory;
}])