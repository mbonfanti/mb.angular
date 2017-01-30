angular.module("mb.angular").factory("baseSvc", ['$q', '$http', function ($q, $http) {

    var factory = {};

    factory.headers = { "accept": "application/json;odata=verbose" };

    factory.executeJson = function (url, method, additionalHeaders, payload) {
        var headers = {};
        headers["Accept"] = "application/json;odata=verbose";
        if (method === "POST") {
            headers["X-RequestDigest"] = jQuery("#__REQUESTDIGEST").val();
        }
        if (typeof additionalHeaders !== 'undefined') {
            for (var key in additionalHeaders) {
                headers[key] = additionalHeaders[key];
            }
        }

        var ajaxOptions =
            {
                url: url,
                type: method,
                contentType: factory.headers,
                headers: headers
            };
        if (method === "POST") {
            ajaxOptions.data = JSON.stringify(payload);
        }

        return $http(ajaxOptions);
    }


    factory.getDigest = function (w) {
        return $http({
            url: w + "/_api/contextinfo",
            method: "POST",
            headers: factory.headers
        });

    };
    factory.GetItemTypeForListName = function (name) {
        return "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1) + "ListItem";
    }

    // Get WebSite Data
    factory.webData = function (w, f) {
        return factory.getRest(w + "/_api/web?" + f)
    }


    factory.getCurrentPage = function () {
        var url = _spPageContextInfo.webServerRelativeUrl;
        var id = _spPageContextInfo.pageItemId;
        return factory.getListIdFilter(url, 'Pages', id, '$select=*,LikedBy/Title,LikedBy/Id,ParentList/Id,PublishingContact/Id,PublishingContact/Name,PublishingContact/Title&$expand=LikedBy,ContentType,ParentList,PublishingContact')
    }

    // Plain Rest Call in Sharepoint
    factory.getRest = function (restUrl) {
        return $http({
            url: restUrl,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose"
            }
        });

    };
    factory.getRestFilter = function (restUrl, f) {
        return $http({
            url: restUrl + '?' + f,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose"
            }
        });

    };

    factory.getRestPost = function (w, l, metadata) {
        return factory.getDigest(w).then(function (data) {
            return $http({
                url: w + "/_api/web/lists/getbytitle('" + l + "')/getitems",
                method: "POST",
                data: metadata,
                headers: {
                    "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue,
                    "Accept": factory.headers,
                    "content-type": factory.headers
                }
            })
        })
    }

    // Work With list Items
    factory.getListFilter = function (w, l, f) {
        var restUrl = w + "/_api/web/lists/getByTitle('" + l + "')/items?" + f;
        return $http({
            type: "GET",
            url: restUrl,
            headers: factory.headers
        });
    }
    factory.getListId = function (w, l, id) {
        var restUrl = w + "/_api/web/lists/getByTitle('" + l + "')/items(" + id + ")";
        return $http({
            type: "GET",
            url: restUrl,
            headers: factory.headers
        });

    }
    factory.getListIdFilter = function (w, l, id, f) {
        var restUrl = w + "/_api/web/lists/getByTitle('" + l + "')/items(" + id + ")?" + f;
        return $http({
            type: "GET",
            url: restUrl,
            headers: factory.headers
        });

    }

    factory.getListCaml = function (w, l, caml) {
        return factory.getDigest(w).then(function (data) {
            return jQuery.ajax({
                url: w + "/_api/web/lists/getbytitle('" + l + "')/getitems",
                method: "POST",
                data: "{ 'query' : {'__metadata': { 'type': 'SP.CamlQuery' }, \"ViewXml\": \"" + caml + "\" }}",
                headers: {
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue,
                    "Accept": factory.headers,
                    "content-type": factory.headers
                }
            })
        })
    }
    factory.getListCamlFilter = function (w, l, f, caml) {
        return factory.getDigest(w).then(function (data) {
            return jQuery.ajax({
                url: w + "/_api/web/lists/getbytitle('" + l + "')/getitems?" + f,
                method: "POST",
                data: "{ 'query' : {'__metadata': { 'type': 'SP.CamlQuery' }, \"ViewXml\": \"" + caml + "\" }}",
                headers: {
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue,
                    "Accept": "application/json;odata=verbose",
                    "content-type": "application/json;odata=verbose"
                }
            })
        })
    }

    factory.getListItemsFIlterMMD = function (w, l, filed, term) {
        var caml = "<View Scope='RecursiveAll'>" +
            "<Query>" +
            "<Where>" +
            "<Eq>" +
            "<FieldRef Name='" + field + "'/>" +
            "<Value Type='TaxonomyFieldType'>" + ct + "</Value>" +
            "</Eq>" +
            "</Where>" +
            "</Query>" +
            "</View>";
        return factory.getListCamlFilter(w, l, '', caml)
    }
    factory.getListItemsCT = function (w, l, ct) {
        var caml = "<View>" +
            "<Query>" +
            "<Where>" +
            "<Eq>" +
            "<FieldRef Name='ContentType'/>" +
            "<Value Type='Computed'>" + ct + "</Value>" +
            "</Eq>" +
            "</Where>" +
            "</Query>" +
            "</View>";
        return factory.getListCamlFilter(w, l, '', caml)
    }

    factory.getTasksMilestone = function (u) {
        var deferred = $q.defer();
        var clientContextCertType = new SP.ClientContext(u);
        var oListCertType = clientContextCertType.get_web().get_lists().getByTitle('Tasks');
        var queryCertType = new SP.CamlQuery();
        queryCertType.set_viewXml(
            '<View><Query><Where>' +
            '<IsNull><FieldRef Name="ParentID" /></IsNull>' +
            '</View></Query></Where>'
        );
        oListItemCertType = oListCertType.getItems(queryCertType);
        clientContextCertType.load(oListItemCertType);
        clientContextCertType.executeQueryAsync(
            Function.createDelegate(this, function (data) {
                deferred.resolve(data);
            }),
            Function.createDelegate(this, function (sender, args) {
                deferred.reject('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
            })
        );

        return deferred.promise;

    }
    factory.getWebProperty = function (w, p) {
        return $http({
            url: w + "/_api/web/AllProperties?select='" + p + "'",
            method: "GET",
            headers: {
                "Accept": "application/json; odata=verbose",
            }
        });
    }

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
    factory.createFolder = function (w, u, f) {
        $http.defaults.headers.post["Content-Type"] = "application/json";
        var item = { "__metadata": { 'type': 'SP.Folder' }, 'ServerRelativeUrl': u }
        var url = w + "/_api/web/GetFolderByServerRelativeUrl('" + u + "')/folders/add(url=\'" + f + "\')";
        return factory.getDigest(w).then(function (data) {

            return jQuery.ajax({
                url: url,
                method: "POST",
                contentType: "application/json;odata=verbose",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue
                }

            });
        });
    }

    // CROSS DOMAIN
    factory.getRestCORS = function (restUrl) {
        return $http({
            url: restUrl,
            type: "GET",
            headers: {
                "accept": factory.header,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",

            }
        });

    };
    factory.putRestCORS = function (restUrl) {
        return $http({
            url: restUrl,
            type: "PUT",
            headers: {
                "accept": factory.header,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Requested-With"
            }
        });
    };
    factory.postRestCORS = function (restUrl, payload) {
        return $http({
            url: restUrl,
            crossDomain: true,
            type: 'POST',
            dataType: 'json',
            headers: {
                "Accept": factory.header,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Requested-With"
            },
            data: payload
        });
    };
    factory.getJsonP = function (u) {
        return $http.jsonp(u)

    }

    // GET LIST AS OBJECTS
    factory.getListAsObj = function (u, l) {
        var deferred = $q.defer();
        jQuery.ajax({
            url: u + "/_api/web/lists/getByTitle('" + l + "')/items",
            type: 'GET',
            headers: { 'accept': 'application/json;odata=verbose' },
            success: function (data) {
                var ris = data.d.results;
                var conf = {}
                for (i = 0; i < ris.length; i++) {
                    conf[ris[i].Title] = ris[i].Valore
                }
                deferred.resolve(conf);
            },
            error: function (data) {
                deferred.reject(data);
            }
        });

        return deferred.promise;
    }


    return factory;
}])
