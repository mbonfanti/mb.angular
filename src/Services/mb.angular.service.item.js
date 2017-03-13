angular.module("mb.angular").factory("itemsSvc", ['baseSvc', '$http', function (baseSvc, $http) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };
    $http.defaults.headers.post["Content-Type"] = "application/json";

    // MODIFICATI DA MATTEO IL 18-12 ORA CARICA TUTTO IN AUTOMATICO SIA DIGEST CHE IL __METADATA
    factory.addListItem = function (w, l, metadata) {

        // Becchiamo il tipo
        return baseSvc.getRest(w + '/_api/web/lists/GetByTitle(\'' + l + '\')/ListItemEntityTypeFullName').then(function (data) {

            var item = jQuery.extend({
                "__metadata": {
                    "type": data.data.d.ListItemEntityTypeFullName
                }
            }, metadata);

            var url = w + "/_api/web/lists/getbytitle('" + l + "')/items";
            return baseSvc.getDigest(w).then(function (data) {

                return jQuery.ajax({
                    url: url,
                    method: "POST",
                    contentType: "application/json;odata=verbose",
                    data: JSON.stringify(item),
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue
                    }

                });
            });
        });
    }
    
    factory.updateListItem = function (w, l, id, metadata) {
        var deferred = jQuery.Deferred();
        var url = w + "/_api/web/lists/getbytitle('" + l + "')/items(" + id + ")";
        baseSvc.getDigest(w).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue
            baseSvc.getRest(url).then(function (data) {
                var item = jQuery.extend({
                    "__metadata": {
                        "type": data.data.d.__metadata.type
                    }
                }, metadata);
                jQuery.ajax({
                    url: url,
                    type: "POST",
                    contentType: "application/json;odata=verbose",
                    data: JSON.stringify(item),
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": digest,
                        "X-HTTP-Method": "MERGE",
                        "If-Match": "*"
                    },
                    success: function (data) {
                        deferred.resolve(data);
                    },
                    error: function (data) {
                        deferred.reject(data);
                    }
                });
            });

        });
        return deferred.promise();

    }

    factory.deleteItem = function (url, listname, id) {

        var restUrl = url + "/_api/web/lists/getbytitle('" + listname + "')/items(" + id + ")";
        return baseSvc.getDigest(url).then(function (data) {
            return $http({
                url: restUrl,
                method: "POST",
                contentType: "application/json;odata=verbose",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue,
                    "IF-MATCH": "*",
                    "X-HTTP-Method": "DELETE"
                }
            });
        });
    };

    factory.approveItem = function (w, l, id, status) {
        // Settiamo il moderation status to

        var restUrl = w + "/_api/web/lists/getByTitle('" + l + "')/items(" + id + ")";
        jQuery.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            processData: false,
            url: restUrl,
            data: "{'OData__ModerationStatus':0}",
            dataType: "json"
        });
    }


    return factory;
}])