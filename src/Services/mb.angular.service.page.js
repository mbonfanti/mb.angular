angular.module("mb.angular").factory("pageSvc", ['baseSvc', '$q', '$http', function (baseSvc, $q, $http) {
    var factory = {};
    factory.getLayoutByName = function (w, title) {
        return baseSvc.getListFilter(factory.web, 'Master Page Gallery', '$filter=Title eq \'' + title + '\'')
    }

    factory.createPage = function (w, name, title, pageLayout) {
        return factory.getLayoutByName(pageLayout)
            .then(function (data) {
                var pg = data.data.d.results[0];
                return factory.createPageFromLayout(name, pg.Id)
                    .then(function (data) {
                        var obj = {};
                        obj.Title = title;
                        console.log(data)
                        return itemsSvc.updateListItem(w, 'Pages', data.data.d.Id, obj)


                    }, function (error) {
                        console.log(error);

                    });


            }, function (error) {
                console.log(error);

            });
    }

    factory.createPageFromLayout = function (w, name, pageLayoutId) {
        var deferred = $q.defer();
        context = SP.ClientContext.get_current();
        user = context.get_web().get_currentUser();

        web = context.get_web();
        var oList = web.get_lists().getByTitle('Master Page Gallery');
        pubWeb = SP.Publishing.PublishingWeb.getPublishingWeb(context, web);
        pageLayoutitem = oList.getItemById(pageLayoutId);
        context.load(web);
        context.load(pubWeb);
        context.load(pageLayoutitem);
        context.executeQueryAsync(

            function () {
                pageInfo = new SP.Publishing.PublishingPageInformation();
                pageInfo.set_name(name);
                pageInfo.set_pageLayoutListItem(pageLayoutitem);
                newPage = pubWeb.addPublishingPage(pageInfo);
                context.load(newPage);
                context.executeQueryAsync(
                    function () {
                        listItem = newPage.get_listItem();
                        context.load(listItem);
                        context.executeQueryAsync(
                            function () {
                                var link = web.get_url() + "/Pages/" + listItem.get_fieldValues().FileLeafRef;
                                deferred.resolve(link);


                            },
                            function (sender, args) {
                                deferred.reject('Failed to get new page: ' + args.get_message());

                            }
                        );
                    },
                    function (sender, args) {
                        deferred.reject('Failed to Add Page: ' + args.get_message());

                    }
                );
            },
            function (sender, args) {
                deferred.reject('Failed to get the PublishingWeb: ' + args.get_message());

            }
        );

        return deferred.promise;
    }

    // Example: factory.createPage(web, 'tesiamo.aspx', 'Pagina Menu');
    return factory;
}])