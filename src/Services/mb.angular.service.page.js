angular.module("mb.angular").factory("pageSvc", ['baseSvc', '$q', '$http', 'itemsSvc', function (baseSvc, $q, $http, itemsSvc) {
    var factory = {};
    factory.getLayoutByName = function (w, title) {
        return baseSvc.getListFilter(w, 'Master Page Gallery', '$filter=Title eq \'' + title + '\'')
    }
    factory.addWebPart = function (siteUrl, serverRelativeUrl, zone, webPartXml) {
        var deferred = $q.defer();
        var clientContext = new SP.ClientContext(siteUrl);
        var oFile = clientContext.get_web().getFileByServerRelativeUrl(serverRelativeUrl);

        var limitedWebPartManager = oFile.getLimitedWebPartManager(SP.WebParts.PersonalizationScope.shared);


        var oWebPartDefinition = limitedWebPartManager.importWebPart(webPartXml);
        var oWebPart = oWebPartDefinition.get_webPart();

        limitedWebPartManager.addWebPart(oWebPart, zone, 1);

        clientContext.load(oWebPart);

        clientContext.executeQueryAsync(Function.createDelegate(this, onQuerySucceeded), Function.createDelegate(this, onQueryFailed));

        function onQuerySucceeded() {
            deferred.resolve(oWebPart.get_title());
        }

        function onQueryFailed(sender, args) {
            deferred.reject(args.get_message());
        }
        return deferred.promise;
    }

    factory.createPage = function (w, name, title, pageLayout) {
        return factory.getLayoutByName(w, pageLayout)
            .then(function (data) {
                var pg = data.data.d.results[0];
                return factory.createPageFromLayout(w, name, pg.Id)
                    .then(function (data) {
                        var obj = {};
                        obj.Title = title;
                        return itemsSvc.updateListItem(w, 'Pages', data.Id, obj)
                    });
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
                                var obj = {};
                                obj.url = web.get_url() + "/Pages/" + listItem.get_fieldValues().FileLeafRef;
                                obj.Id = listItem.get_id()
                                deferred.resolve(obj);
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

    factory.changePageLyout = function (url, pageUrl, pageLayoutUrl, pageLyoutName) {
        // { 'PublishingPageLayout': { 'Type': 'Url', 'Value': '/_catalogs/masterpage/ArticleLeft.aspx, Image on left' } }
        var properties = { 'PublishingPageLayout': { 'Type': 'Url', 'Value': pageLayoutUrl + ', ' + pageLyoutName } };  //Image on Left page layout
        var context = SP.ClientContext.get_current();
        var site = context.get_site();
        var web = context.get_web();
        var pageFile = web.getFileByServerRelativeUrl(pageUrl);
        var pageItem = pageFile.get_listItemAllFields();
        context.load(site);
        context.load(pageItem);

        context.executeQueryAsync(
            function () {

                for (var propName in properties) {
                    var property = properties[propName];
                    var itemValue = pageItem.get_item(propName);
                    if (property.Type == "Url") {
                        var pagelayoutUrl = site.get_url() + property.Value.split(',')[0].trim();
                        itemValue.set_url(pagelayoutUrl);
                        var pagelayoutDesc = property.Value.split(',')[1].trim();
                        itemValue.set_description(pagelayoutDesc);
                        pageItem.set_item(propName, itemValue);
                    }

                }
                pageItem.update();
                context.load(pageItem);
                context.executeQueryAsync(
                    function () {
                        console.log(pageItem);
                    },
                    function (sender, args) {
                        console.log('Failed: ' + args.get_message());
                    }
                );
            },
            function (sender, args) {
                console.log('Failed: ' + args.get_message());
            })

    }

    factory.editPage = function () {
            if (document.forms['aspnetForm']['MSOLayout_InDesignMode'] != null) document.forms['aspnetForm']['MSOLayout_InDesignMode'].value = 1;
            if (document.forms['aspnetForm']['MSOAuthoringConsole_FormContext'] != null) document.forms['aspnetForm']['MSOAuthoringConsole_FormContext'].value = 1;
            if (document.forms['aspnetForm']['MSOSPWebPartManager_DisplayModeName'] != null) document.forms['aspnetForm']['MSOSPWebPartManager_DisplayModeName'].value = 'Design';
            __doPostBack('ctl05','edit');
        }
     factory.savePage = function () {
            CoreInvoke('PageActionClick', this)
        }
    return factory;
}])