angular.module("mb.angular").factory("searchSvc", ['baseSvc', '$q', '$http', 'commonSvc', function (baseSvc, $q, $http, commonSvc) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.convertRowsToObjects = function (itemRows) {
        var items = []; //foreach row in the result set
        for (var i = 0; i < itemRows.length; i++) {
            var row = itemRows[i], item = {}; //Each cell in the row is a key/value pair, save each one as an object property 
            for (var j = 0; j < row.Cells.results.length; j++) {
                item[row.Cells.results[j].Key] = row.Cells.results[j].Value;
            }
            items.push(item);
        }
        return items;
    };
    factory.convertRefinersToObjects = function (itemRows) {
        var refiners = {}; //foreach row in the result set
        for (var i = 0; i < itemRows.length; i++) {
            refiners[itemRows[i].Name] = itemRows[i].Entries.results;
        }
        return refiners;
    };
    factory.getValueByKey = function (key, results) {
        var postItem = jQuery.grep(results, function (e) {
            if (e.Key === key)
                return e;
        })[0].Value;

        return postItem;
    }

    // Example Query: http://yoursite.domain.com/_api/search/query?querytext='contenttype:CONTENT_TYPE_NAME'
    factory.getSearch = function (s) {
        var deferred = $q.defer();
        baseSvc.getRest(s)
            .then(function (values) {
                var docs = {};
                docs.results = factory.convertRowsToObjects(values.data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results);
                docs.all = values.data.d
                deferred.resolve(docs)

            }, function (err) {
                deferred.reject()
            })

        return deferred.promise;

    }
    factory.getSearchContentType = function (ct) {

        var deferred = $q.defer();
        factory.getSearch('/_api/search/query?querytext=\'contenttype:' + ct + '\'')
            .then(function (values) {
                var docs = values.data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results
                deferred.resolve(factory.convertRowsToObjects(docs))

            }, function (err) {
                deferred.reject()
            })

        return deferred.promise;
    }
    return factory;
}])