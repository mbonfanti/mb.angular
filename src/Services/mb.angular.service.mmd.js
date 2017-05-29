angular.module("mb.angular").factory("mmdSvc", ['commonSvc', 'baseSvc', '$q', '$http', function (commonSvc, baseSvc, $q, $http, filtraTermsFilter) {

    var factory = {};

    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.termSets = {}

    factory.getTermbyLabel = function (l) {
        var deferred = $q.defer();

        // Get SP Context
        var context = SP.ClientContext.get_current();
        // Get the default Term Store for context
        var session = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);
        var termStore = session.getDefaultSiteCollectionTermStore();
        // Set up Term Query for termStore.getTerms()
        var termQuery = new SP.Taxonomy.LabelMatchInformation(context);
        // The language code identifier (LCID) of the Term.labels to be matched
        termQuery.set_lcid(1033);
        // Determines if only terms available for tagging are returned
        termQuery.set_trimUnavailable(false);
        // The Label of the Term to get
        termQuery.set_termLabel(l);
        // Get Terms based on termQuery
        var termsStoreTerms = termStore.getTerms(termQuery);
        // Load em' and run execute query!
        context.load(session);
        context.load(termStore);
        context.load(termsStoreTerms);
        context.executeQueryAsync(
            function () {
                // Get all the terms based on search
                var termsEnum = termsStoreTerms.getEnumerator();
                var currentTerm = {}
                // Loop through results
                while (termsEnum.moveNext()) {
                    // Current Item in Enumerator Loop
                    currentTerm = termsEnum.get_current();

                    // Get Local Custom Properties
                    currentTerm.termLocalCustomProperties = currentTerm.get_localCustomProperties();
                }
                deferred.resolve(currentTerm);
            }, function (sender, args) {

                var error = 'Failure getting Term: ' + args.get_message() + '\n' + args.get_stackTrace
                deferred.reject(error);
            });

        return deferred.promise;
    }

    // Trova un termine con il Guid in un termSet
    factory.findTermByGuid = function (tset, guid) {
        var temp = '-'
        for (var i = 0; i < tset.length; i++) {
            if (tset[i].ID === guid) {
                temp = tset[i].name
            }
        }
        return temp
    }

    factory.findTermSet = function (termset) {

        var TermValues = []
        var deferred = $q.defer();

        var ctx = SP.ClientContext.get_current(),
            taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx),
            termSets = taxonomySession.getTermSetsByName(termset, 1033),
            termSet = termSets.getByName(termset),
            terms = termSet.getAllTerms();

        ctx.load(terms);
        ctx.executeQueryAsync(Function.createDelegate(this, function (sender, args) {
            var termsEnumerator = terms.getEnumerator();
            var temp = '-'
            while (termsEnumerator.moveNext()) {
                var term = termsEnumerator.get_current();
                var TermValue = {

                    Name: term.get_name(),
                    Desc: term.get_description(),
                    ID: term.get_id().ToSerialized()
                };
                TermValues.push(TermValue);
            }
            deferred.resolve(TermValues);
        }),

        Function.createDelegate(this, function (sender, args) {
            deferred.reject(t);
        }));

        return deferred.promise;


    }

    factory.getTermSet = function (termset) {

        var TermValues = []
        var deferred = $q.defer();

        var ctx = SP.ClientContext.get_current(),
            taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx),
            termSets = taxonomySession.getTermSetsByName(termset, 1033),
            termSet = termSets.getByName(termset),
            terms = termSet.getAllTerms();

        ctx.load(terms);
        ctx.executeQueryAsync(Function.createDelegate(this, function (sender, args) {
            var termsEnumerator = terms.getEnumerator();
            var temp = '-'
            while (termsEnumerator.moveNext()) {
                var term = termsEnumerator.get_current();
                var TermValue = {

                    Name: term.get_name(),
                    Desc: term.get_description(),
                    ID: term.get_id().ToSerialized()
                };
                TermValues.push(TermValue);
            }
            deferred.resolve(TermValues);
        }),

        Function.createDelegate(this, function (sender, args) {
            deferred.reject('Errore getTermSet: ' + args.get_message() + ' --- ' + args.get_stackTrace());
        }));

        return deferred.promise;


    }
    factory.recursor = function (context, allTerms, currentNodeTerms) {
        var termsEnumerator = currentNodeTerms.getEnumerator();
        var newNodes = new Array();

        while (termsEnumerator.moveNext()) {
            //for the current term stub, get all the properties from the fully loaded getAllTerms object
            var currentTerm = termsEnumerator.get_current().get_id().toString();
            var newTerm = {
                "id": currentTerm.get_id().toString(),
                "name": currentTerm.get_title().get_value(),
                "href": currentTerm.get_targetUrl().get_value(),
                "friendly": currentTerm.get_friendlyUrlSegment().get_value(),
                "children": []
            }
            var subTerms = currentTerm.get_terms();
            if (subTerms.get_count() > 0) {
                newTerm.children = factory.recursor(context, allTerms, subTerms)
            }

            newNodes.push(newTerm);
        }
        //console.log(newNodes);
        return newNodes;
    };

    factory.getTermByGuid = function (termId) {
        var deferred = $q.defer();
        if (termId == '' || termId == undefined) {
            deferred.resolve('-')
        } else {
            var context = SP.ClientContext.get_current();
            var session = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);
            var term = session.getTerm(termId);
            context.load(term);
            context.executeQueryAsync(function () {
                var Tempterm = term.get_objectData().get_properties();
                deferred.resolve(Tempterm)
            }, function (err) {
                deferred.reject(err)
            });
        }
        return deferred.promise;
    }

    return factory;
}])
// Componenti Manged Metadata
angular.module("mb.angular").component('getTerm', {

    template: '<a class="mcl-newsitem--contents--showcaselink" ng-href="{{$ctrl.showcaseUrl}}"><span>{{ $ctrl.term.Name }}</span></a>',
    transclude: true,
    bindings: {
        termid: '@'
    },
    controller: function (mmdSvc, spaceService, filtraTermsFilter) {
        var ctrl = this;
        ctrl.term = {}
        ctrl.showcaseUrl = "";
        ctrl.$onInit = function () {

            mmdSvc.getTermByGuid(ctrl.termid)
                .then(
                function (data) {
                    ctrl.term = data;
                    if (data.LocalCustomProperties != undefined && data.LocalCustomProperties._Sys_Nav_SimpleLinkUrl != undefined) {
                        ctrl.showcaseUrl = data.LocalCustomProperties._Sys_Nav_SimpleLinkUrl;
                    }
                },
                function (error) {
                    console.log(error)
                }
                )
            //ctrl.term = filtraTermsFilter(spaceService.deptsTS, ctrl.termid)
        }
    }
});
