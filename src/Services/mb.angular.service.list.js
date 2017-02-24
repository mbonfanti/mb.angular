angular.module("mb.angular").factory("listSvc", ['baseSvc', '$q', '$http', function (baseSvc, $q, $http) {
    var factory = {};

    factory.getCtbyName = function (w, name) {
        var url = w + "/_api/web/AvailableContentTypes?$select=Name,Id,StringId&$filter=Name eq '" + name + "'";
        return baseSvc.getRest(url);
    }
    factory.creaLista = function (w, titolo, descrizione, ct, template) {
        return factory.creaListaRest(w, titolo, descrizione, ct, 100)
    }
    factory.creaDocLib = function (w, titolo, descrizione, ct, template) {
        return factory.creaListaRest(w, titolo, descrizione, ct, 101)
    }
    factory.creaListaRest = function (w, titolo, descrizione, ct, template) {
        var obj = {
            '__metadata': { 'type': 'SP.List' },
            'AllowContentTypes': ct,
            'BaseTemplate': template,
            'ContentTypesEnabled': ct,
            'Description': descrizione,
            'Title': titolo
        }
        return baseSvc.getDigest(w).then(function (dataDig) {
            var dig = dataDig.data.d.GetContextWebInformation.FormDigestValue;
            return jQuery.ajax({
                url: w + "/_api/web/lists",
                method: "POST",
                contentType: "application/json;odata=verbose",
                data: JSON.stringify(obj),
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": dig
                }

            });


        })
    }
    factory.addCtbyName = function (w, name, list) {
        return factory.getCtbyName(w, name).then(function (data) {
            return factory.addListCt(w, data.data.d.results[0].StringId, list);
        })

    }
    factory.addListCt = function (w, id, list) {
        return baseSvc.getDigest(w).then(function (dataDig) {
            var dig = dataDig.data.d.GetContextWebInformation.FormDigestValue;
            var siteUrl = w + "/_api/web/lists/getbytitle('" + list + "')/ContentTypes/AddAvailableContentType";
            return jQuery.ajax({
                url: siteUrl,
                type: "POST",
                data: JSON.stringify({
                    "contentTypeId": id
                }),
                headers:
                {
                    'accept': 'application/json;odata=verbose',
                    "content-type": "application/json;odata=verbose",
                    "X-RequestDigest": dig
                }
            });
        });

    }
    factory.removeListCt = function (w, id, list) {

        return baseSvc.getDigest(w).then(function (dataDig) {
            var dig = dataDig.data.d.GetContextWebInformation.FormDigestValue;
            var siteUrl = w + "/_api/web/lists/getbytitle('" + list + "')/ContentTypes('" + id + "')";
            return jQuery.ajax({
                url: siteUrl,
                type: "DELETE",
                data: JSON.stringify({
                    "contentTypeId": id
                }),
                headers:
                {
                    'accept': 'application/json;odata=verbose',
                    "content-type": "application/json;odata=verbose",
                    "X-RequestDigest": dig
                }
            });
        });
    }

    return factory;
}]);

