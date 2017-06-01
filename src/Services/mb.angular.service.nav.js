angular.module("mb.angular").factory("navSvc", ['baseSvc', '$q', '$http', function (baseSvc, $q, $http) {
    var factory = {};

    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.navTermests = {}
    factory.getTopNav = function (w) {
        return baseSvc.getRestFilter(w + "/_api/web/navigation/TopNavigationbar", "$expand=Children")

    }
    // ****************************************************************************
    // getNavTermSetTree
    //
    // Gets the list item object correspondig with the current file
    // @termSet: Indita il termset che viene letto
    //
    // GET TERMS AS TREE
    factory.getNavTermSetTree = function (termset) {

        var deferred = $q.defer();

        if (factory.navTermests[termset]) {
            deferred.resolve(factory.navTermests[termset]);
        } else {

            var ctx = SP.ClientContext.get_current();
            var taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx);

            var termSets = taxonomySession.getTermSetsByName(termset, 1033);
            var termSet = termSets.getByName(termset);
            var navTermSet = SP.Publishing.Navigation.NavigationTermSet.getAsResolvedByWeb(ctx, termSet, ctx.get_web(), "GlobalNavigationTaxonomyProvider");
            var navTerms = navTermSet.get_terms();
            ctx.load(navTerms, 'Include(Id, Title, TargetUrl, FriendlyUrlSegment, Terms, TaxonomyName, LinkType, SimpleLinkUrl, ExcludeFromCurrentNavigation, ExcludeFromGlobalNavigation, Parent)');

            var Terms = termSet.getAllTerms();
            ctx.load(Terms);

            // allTerms sono i
            var allTerms = navTermSet.getAllTerms();
            ctx.load(allTerms, 'Include(Id, Title, TargetUrl, FriendlyUrlSegment, Terms, TaxonomyName, LinkType, SimpleLinkUrl, ExcludeFromCurrentNavigation, ExcludeFromGlobalNavigation, Parent)');

            ctx.executeQueryAsync(
                function () {
                    var termsTree = factory.recursor(allTerms, navTerms, Terms);
                    factory.navTermests[termset] = termsTree;
                    deferred.resolve(termsTree);
                },
                function (sender, args) {
                    deferred.reject('Request failed ' + args.get_message() + ':' + args.get_stackTrace());
                });
        }
        return deferred.promise;
    }
    factory.recursor = function (allTerms, currentNodeTerms, Terms) {
        var termsEnumerator = currentNodeTerms.getEnumerator();
        var newNodes = new Array();
        while (termsEnumerator.moveNext()) {
            //for the current term stub, get all the properties from the fully loaded getAllTerms object
            var currentTerm = factory.findLoadedTerm(allTerms, termsEnumerator.get_current().get_id().toString());
            var term = factory.findLoadedTerm(Terms, termsEnumerator.get_current().get_id().toString());

            var objTerm = angular.copy(currentTerm.get_objectData().get_properties());
            objTerm = angular.extend(objTerm, term.get_objectData().get_properties());
            objTerm.name = currentTerm.get_title().get_value();
            objTerm.Name = currentTerm.get_title().get_value();
            objTerm.FriendlyUrlSegment = currentTerm.get_friendlyUrlSegment().get_value();
            objTerm.TargetUrl = currentTerm.get_targetUrl().get_value();
            objTerm.guid = currentTerm.get_id().toString();
            objTerm.href = objTerm.SimpleLinkUrl
            objTerm.children = [];
            if (objTerm.href == '' || objTerm.href == undefined) { objTerm.href == objTerm.TargetUrl }
            var subTerms = currentTerm.get_terms();
            if (subTerms.get_count() > 0) {
                objTerm.children = factory.recursor(allTerms, subTerms, Terms)
            }

            newNodes.push(objTerm);
        }
        //console.log(newNodes);
        return newNodes;
    };
    factory.findLoadedTerm = function (allTerms, termId) {
        var termsEnumerator = allTerms.getEnumerator();
        while (termsEnumerator.moveNext()) {
            if (termsEnumerator.get_current().get_id().toString() === termId)
                return termsEnumerator.get_current();
        }
        return null; // The object was not found
    }


    factory.getAllNavTerms = function (termset) {
        var deferred = $q.defer();
        var ctx = SP.ClientContext.get_current();
        var taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx);
        var termSets = taxonomySession.getTermSetsByName(termset, 1033);
        var termSet = termSets.getByName(termset);
        var navTermSet = SP.Publishing.Navigation.NavigationTermSet.getAsResolvedByWeb(ctx, termSet, ctx.get_web(), "GlobalNavigationTaxonomyProvider");
        var navTerms = termSet.get_terms();
        ctx.load(navTerms);

        // allTerms sono i
        var allTerms = navTermSet.getAllTerms();
        ctx.load(allTerms);

        ctx.executeQueryAsync(
            function () {
                var termsEnumerator = allTerms.getEnumerator();
                var newNodes = new Array();
                while (termsEnumerator.moveNext()) {
                    var currentTerm = factory.findLoadedTerm(allTerms, termsEnumerator.get_current().get_id().toString());
                    var objTerm = angular.copy(currentTerm.get_objectData().get_properties());
                    objTerm = angular.extend(objTerm, termsEnumerator.get_current().get_objectData().get_properties());
                    objTerm.name = currentTerm.get_title().get_value();
                    objTerm.FriendlyUrlSegment = currentTerm.get_friendlyUrlSegment().get_value();
                    objTerm.TargetUrl = currentTerm.get_targetUrl().get_value();
                    objTerm.guid = currentTerm.get_id().toString();
                    newNodes.push(objTerm);
                }

                deferred.resolve(newNodes);
            },
            function (sender, args) {
                deferred.reject('Request failed ' + args.get_message() + ':' + args.get_stackTrace());
            });

        return deferred.promise;
    }

    factory.getQuick = function (u) {
        return baseSvc.getRest(u + '/_api/web/navigation/QuickLaunch?$expand=Children')
    }
    factory.getTop = function (u) {
        return baseSvc.getRest(u + '/_api/web/navigation/TopNavigationbar')
    }

    factory.getNavJSOM = function () {
        var deferred = $q.defer();
        var clientContext = new SP.ClientContext.get_current();
        var currentQL = clientContext.get_web().get_navigation().get_quickLaunch();
        clientContext.load(currentQL);
        clientContext.executeQueryAsync(Function.createDelegate(this, function (sender, args) {
            var qlEnum = currentQL.getEnumerator();
            var nav = [];

            while (qlEnum.moveNext()) {
                var nodeObj = {}
                var node = qlEnum.get_current();
                nodeObj = node;
                nodeObj.tile = node.get_title();
                nodeObj.url = node.get_url();

                nav.push(nodeObj);
            }

            deferred.resolve(nav);
        }),
            Function.createDelegate(this, function (sender, args) {
                console.log(args.get_message());
                deferred.reject(false);
            }));
        return deferred;
    }
    factory.getSiteHomePageRest = function (w) {
        var deferred = $q.defer();
        var promise = baseSvc.getRestFilter(w + '/_api/web/rootfolder?$select=WelcomePage');

        $q.all(promise)
            .then(function (data) {
                deferred.resolve(data);
            }, function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    factory.getSiteHomePage = function (w) {
        var deferred = $q.defer();

        var context = new SP.ClientContext(w);
        var web = context.get_web();
        var rootFolder;
        var welcomePage;
        context.load(web);
        rootFolder = web.get_rootFolder();
        context.load(rootFolder);
        context.executeQueryAsync(getWebSuccess, getDataFail);
        function getWebSuccess() {
            welcomePage = rootFolder.get_welcomePage();
            deferred.resolve(welcomePage);
        }
        function getDataFail(sender, args) {
            console.log(args.get_message());
            deferred.reject(args.get_message());
        }

        return deferred.promise;
    }

    factory.getSitePages = function (w) {
        var deferred = $q.defer();
        var pr1 = baseSvc.getRestFilter(w + '/_api/web/lists/getbytitle(\'Pages\')/items', '$select=*,Id,Title,FileRef,ContentType/Name&$expand=File,ContentType')
        var pr2 = factory.getSiteHomePage(w)

        $q.all([pr1, pr2])
            .then(function (data) {
                var pages = data[0].data.d.results;
                for (var i = 0; i < pages.length; i++) {
                    if (pages[i].FileRef.indexOf(data[1]) === -1) {
                        pages[i].isHome = false
                    } else {
                        pages[i].isHome = true
                    }
                }
                deferred.resolve(pages);

            }, function (err) {
                console.log(err)
                deferred.reject(err);
            })
        return deferred.promise;
    }

    return factory;

}])

