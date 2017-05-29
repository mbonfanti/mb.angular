angular.module("mb.angular").factory("fileSvc", ['baseSvc',  '$http','itemsSvc', function (baseSvc, $http, itemsSvc) {

    var factory = {};
    factory.getFolder = function (w, f) {
        return $.ajax({
            url: w + '/_api/Web/GetFolderByServerRelativeUrl(\'' + f + '\')?$expand=Folders,File,sListItemAllFields',
            type: "GET",
            contentType: "application/json;odata=verbose",
            headers: {
                "Accept": "application/json;odata=verbose"
            }
        })
    }
    factory.getFolderFiles = function (w, f) {
        return $http({
            url: w + '/_api/Web/GetFolderByServerRelativeUrl(\'' + f + '\')/Files?$expand=Folders,Files,ListItemAllFields,ListItemAllFields/ContentType,Author',
            type: "GET",
            contentType: "application/json;odata=verbose",
            headers: {
                "Accept": "application/json;odata=verbose"
            }
        })
    }

    // HELPER per il service
    factory.getListUrl = function (webUrl, listName) {
        var headers = {};
        return $.ajax({
            url: webUrl + "/_api/lists/getbytitle('" + listName + "')/rootFolder?$select=ServerRelativeUrl",
            type: "GET",
            contentType: "application/json;odata=verbose",
            headers: {
                "Accept": "application/json;odata=verbose"
            }
        });
    }

    // CREAZIONE DEI DOCUMENT SET
    factory.createFolder = function (webUrl, listName, folderName, folderContentTypeId) {
        var deferred = $.Deferred();
        factory.getListUrl(webUrl, listName).then(function (data) {
            var listUrl = data.d.ServerRelativeUrl;
            var folderPayload = {
                'Title': folderName,
                'Path': listUrl
            };
            return $.ajax({
                url: webUrl + "/_vti_bin/listdata.svc/" + listName,
                type: "POST",
                contentType: "application/json;odata=verbose",
                data: JSON.stringify(folderPayload),
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "Slug": listUrl + "/" + folderName + "|" + folderContentTypeId
                },
                success: function (data) {
                    deferred.resolve(data);
                },
                error: function (data) {
                    deferred.reject(data);
                }
            });

        });
        return deferred.promise();
    }
    factory.createFolderMetadata = function (webUrl, listName, folderName, folderContentTypeId, metadata) {
        var deferred = $.Deferred();
        factory.createFolder(webUrl, listName, folderName, folderContentTypeId)
            .done(function (data) {
                itemsSvc.updateListItem(webUrl, listName, data.d.Id, metadata)
                    .done(function () {
                        deferred.resolve(data);
                    })
                    .fail(function (error) {
                        deferred.reject(data);
                    });

            }).fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise();
    }
    //factory.updateFolderProperties = function (folder, properties) {
    //    return $.ajax({
    //        type: 'POST',
    //        url: folder.__metadata.uri,
    //        contentType: 'application/json',
    //        headers: {
    //            "Accept": "application/json;odata=verbose",
    //            "X-HTTP-Method": "MERGE",
    //            "If-Match": folder.__metadata.etag,
    //        },
    //        data: JSON.stringify(properties),
    //    });
    //}
    factory.updateFolderProperties = function (folder, properties) {
        return $.ajax({
            type: 'POST',
            url: folder.__metadata.uri,
            contentType: 'application/json',
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-HTTP-Method": "MERGE",
                "If-Match": folder.__metadata.etag,
            },
            data: JSON.stringify(properties),
        });
    }
    factory.renameFolder = function (webUrl, listTitle, itemId, item) {
        var itemUrl = webUrl + "/_api/Web/Lists/GetByTitle('" + listTitle + "')/Items(" + itemId + ")";
        var itemPayload = {};
        itemPayload['__metadata'] = { 'type': item.__metadata.type };
        itemPayload['Title'] = item.Title;
        itemPayload['FileLeafRef'] = item.Title;
        itemPayload['Project'] = item.Project;
        var additionalHeaders = {};
        additionalHeaders["X-HTTP-Method"] = "MERGE";
        additionalHeaders["If-Match"] = "*";
        return baseSvc.executeJson(itemUrl, "POST", additionalHeaders, itemPayload);
    }
    factory.updateFolder = function (webUrl, listTitle, itemId, itemPayload) {
        var itemUrl = webUrl + "/_api/Web/Lists/GetByTitle('" + listTitle + "')/Items(" + itemId + ")";
        var additionalHeaders = {};
        additionalHeaders["X-HTTP-Method"] = "MERGE";
        additionalHeaders["If-Match"] = "*";
        return baseSvc.executeJson(itemUrl, "POST", additionalHeaders, itemPayload);
    }
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
    /*  Work With Files */
    factory.uploadRestMetadata = function (w, dir, filename, file, metadata) {
        return factory.uploadRest(w, dir, filename, file).then(function (data) {
            return itemsSvc.updateListItem(w, data.d.ListItemAllFields.ParentList.Title, data.d.ListItemAllFields.Id, metadata)
        })
    }
    factory.uploadRest = function (w, dir, filename, file) {
        var deferred = $.Deferred();
        var dataDig = "";
        baseSvc.getDigest(w).then(function (dataDig) {
            factory.getFileBuffer(file).then(
                function (arrayBuffer) {
                    $.ajax({
                        url: w + "/_api/web/getFolderByServerRelativeUrl('" + dir + "')/files" + "/Add(url='" + filename + "', overwrite=true)?$expand=ListItemAllFields,ListItemAllFields/ParentList",
                        type: "POST",
                        data: arrayBuffer,
                        processData: false,
                        contentType: "application/json;odata=verbose",
                        headers: {
                            "accept": "application/json;odata=verbose",
                            "X-RequestDigest": dataDig.data.d.GetContextWebInformation.FormDigestValue,
                            "content-lenght": arrayBuffer.byteLenght,
                            "BinaryStringRequestBody": true
                        },
                        success: function (data) {
                            deferred.resolve(data);
                        },
                        error: function (err) {
                            deferred.reject(err);
                        }
                    });
                },
                function (err) {
                    deferred.reject(err);
                }
            );
        })
        return deferred.promise();

    };
    factory.getFileBuffer = function (file) {

        var deferred = $.Deferred();
        var reader = new FileReader();
        reader.onload = function (e) {
            deferred.resolve(e.target.result);
        }
        reader.onerror = function (e) {
            deferred.reject(e.target.error);
        }
        reader.readAsArrayBuffer(file);

        return deferred.promise();
    };
    factory.attachFile = function (w, list, filename, file) {
        // endpoint rest: http://site url/_api/web/lists/getbytitle('list title')/items(item id)/AttachmentFiles/ add(FileName='file name')

        var deferred = $.Deferred();
        var dataDig = "";
        baseSvc.getDigest(w).then(function (dataDig) {
            factory.getFileBuffer(file).then(
                function (arrayBuffer) {
                    $.ajax({
                        url: w + "/_api/web/getFolderByServerRelativeUrl('" + dir + "')/files" + "/Add(url='" + filename + "', overwrite=true)?$expand=ListItemAllFields,ListItemAllFields/ParentList",
                        type: "POST",
                        data: arrayBuffer,
                        processData: false,
                        contentType: "application/json;odata=verbose",
                        headers: {
                            "accept": "application/json;odata=verbose",
                            "X-RequestDigest": dataDig.data.d.GetContextWebInformation.FormDigestValue,
                            "content-lenght": arrayBuffer.byteLenght,
                            "BinaryStringRequestBody": true
                        },
                        success: function (data) {
                            deferred.resolve(data);
                        },
                        error: function (err) {
                            deferred.reject(err);
                        }
                    });
                },
                function (err) {
                    deferred.reject(err);
                }
            );
        })
        return deferred.promise();
    }



    // WORK FILES
    factory.updateFileItem = function (w, l, id, metadata) {
        var deferred = $.Deferred();
        var url = w + "/_api/web/lists/getbytitle('" + l + "')/Items(" + id + ")/File/ListItemAllFields";
        baseSvc.getDigest(w).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue
            baseSvc.getRest(url).then(function (data) {
                var item = $.extend({
                    "__metadata": {
                        "type": data.d.__metadata.type
                    }
                }, metadata);
                $.ajax({
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
    factory.copyFile = function (w, uriFile, newFileName) {
        var deferred = $.Deferred();
        baseSvc.getDigest(w).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue
            var url = uriFile + "/copyto(strnewurl='" + newFileName + "',boverwrite=false)"
            $.ajax({
                url: url,
                contentType: "application/json;odata=verbose",
                method: 'POST',
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                },
                success: function (data) {
                    deferred.resolve(data);
                },
                error: function (data) {
                    deferred.reject(data);
                }
            });
        });
        return deferred.promise();
    }
    factory.moveFile = function (w, uriFile, newFileName) {
        /*
            NewUrl: è il ServerRelativeUrl del folder + FileName
            http://apps.self.edu/sites/Offers/_api/Web/GetFileByServerRelativeUrl('/sites/Offers/Offers/1212/p_12_12a.css')/moveto(newurl%20=%20'//sites/Offers/Offers/1212/12_12a.css',%20flags%20=%201)
        */

        var deferred = $.Deferred();
        baseSvc.getDigest(w).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue
            newurl = '" + newFileName + "', flags = 1
            var url = uriFile + "/moveto(newurl = '" + newFileName + "', flags = 1)"
            $.ajax({
                url: url,
                contentType: "application/json;odata=verbose",
                method: 'POST',
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                },
                success: function (data) {
                    deferred.resolve(data);
                },
                error: function (data) {
                    deferred.reject(data);
                }
            });
        });
        return deferred.promise();
    }

    return factory;
}]);