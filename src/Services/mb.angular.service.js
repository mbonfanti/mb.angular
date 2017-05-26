angular.module("mb.angular").factory("socialService", ['baseSvc', '$q', '$http', function (baseSvc, $q, $http) {

    var factory = {};
    factory.statusMessage = {
        0: 'The user has started following the site. ',
        1: 'The user is already following the site. ',
        2: 'An internal limit was reached. ',
        3: 'An internal error occurred. '
    }
    factory.baseUrl = '/_api/social.following';

    // w: url del web
    // action: cosa deve fare. isfollowed | follow | stopfollowing
    // // The type Documents = 1, Sites = 2
    // url: url del documento o del sito
    factory.socialFollow = function (w, action, type, url) {

        var urlrest = '/_api/social.following/' + action
        var d = JSON.stringify({
            "actor": {
                "__metadata": {
                    "type": "SP.Social.SocialActorInfo"
                },
                "ActorType": 1,
                "ContentUri": url,
                "Id": null
            }
        })
        //return factory.baseSvc(w, urlrest, data)
        return baseSvc.getDigest(w).then(
            function (data) {
                return $http({
                    url: w + urlrest,
                    method: "POST",
                    data: d,
                    headers: {
                        "accept": "application/json;odata=verbose",
                        "content-type": "application/json;odata=verbose",
                        "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue
                    }
                });
            });
    }

    factory.createMySite = function (w) {

        var deferred = jQuery.Deferred();
        baseSvc.getDigest(w).then(function (data) {
            $http({
                method: 'POST',
                url: w + "/_api/sp.userprofiles.profileloader.getprofileloader/getuserprofile/createpersonalsiteenque(true)",
                headers: {
                    "accept": "application/json;odata=verbose",
                    "content-type": "application/json;odata=verbose",
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue
                }
            }).then(function (response) {
                deferred.resolve(response);

            },
            function (err) {
                console.log(err);
                deferred.reject(error);
            });
        })
        return deferred;

    }
    /* 
     * Recuper tutto cio che un utente sta seguendo
     */
    factory.following = [];
    factory.getFollowing = function (w, a) {
        /*
         * The actor types to include. 
         * Users = 1, 
         * Documents = 2, 
         * Sites = 4, 
         * Tags = 8. 
         * Bitwise combinations are allowed. 15 all
         * Users & Docs = 6
         */
        baseSvc.getRest(w + "/_api/social.following/my/followed(types=" + a + ")")
         .then(function (data) {
             factory.following = data.d.Followed.results;
         },function (error) {
               console.log(error);
           });
    }
    factory.getFollowed = function (w, a) {
        // The actor types to include. Users = 1, Documents = 2, Sites = 4, Tags = 8. Bitwise combinations are allowed. 15 all
        return baseSvc.getRest(w + "/_api/social.following/my/followed(types=" + a + ")")
    }

    // Manage Likes
    factory.GetLikeCount = function (w, l, i, listTitle, itemId) {

        var context = new SP.ClientContext(_spPageContextInfo.webServerRelativeUrl);
        var list = context.get_web().get_lists().getById(_spPageContextInfo.pageListId);
        var item = list.getItemById(_spPageContextInfo.pageItemId);

        context.load(item, "LikedBy", "ID", "LikesCount");
        context.executeQueryAsync(Function.createDelegate(this, function (success) {
            // Check if the user id of the current users is in the collection LikedBy. 
            var likeDisplay = true;
            var $v_0 = item.get_item('LikedBy');
            var itemc = item.get_item('LikesCount');
            if (!SP.ScriptHelpers.isNullOrUndefined($v_0)) {
                for (var $v_1 = 0, $v_2 = $v_0.length; $v_1 & $v_2; $v_1++) {
                    var $v_3 = $v_0[$v_1];
                    if ($v_3.$1E_1 === _spPageContextInfo.userId) {
                        //cb(true, item.get_item('LikesCount'));
                        //alert("Liked by me");
                        likeDisplay = false;
                    }
                }
            }
            ChangeLikeText(likeDisplay, itemc);

        }), Function.createDelegate(this, function (sender, args) {
            //alert('F1');
        }));

    }
    factory.setLike = function (w, listId, itemId, isLike) {
        var deferred = $q.defer();
        var context = new SP.ClientContext(w);
        SP.SOD.registerSod('SP.ClientContext', SP.Utilities.Utility.getLayoutsPageUrl('sp.js'));
        SP.SOD.registerSod('Microsoft.Office.Server.ReputationModel.Reputation', SP.Utilities.Utility.getLayoutsPageUrl('reputation.js'));
        SP.SOD.loadMultiple(['SP.ClientContext', 'Microsoft.Office.Server.ReputationModel.Reputation'], function () {

            SP.SOD.executeFunc('reputation.js', 'Microsoft.Office.Server.ReputationModel.Reputation', function () {
                Microsoft.Office.Server.ReputationModel.Reputation.setLike(context, listId, itemId, isLike);
                context.executeQueryAsync(function () {
                    deferred.resolve(isLike);
                }, function (sender, args) {
                    deferred.reject('Errore: ' + args.get_message());
                    console.error(args.get_message())
                });
            });
        });
        return deferred.promise;
    };
    factory.restGetLikesItem = function (w, l, i) {
        baseSvc.getRest(w + "/_api/Web/Lists/GetByTitle('" + l + "')/items(" + i + ")?$select=Title,LikesCount,LikedBy/Title&$expand=LikedBy")
    }
    factory.restGetLikes = function (w, l, i) {
        baseSvc.getRest(w + "/_api/Web/Lists/GetByTitle('" + l + "')/items?$select=Title,LikesCount,LikedBy/Title&$expand=LikedBy")
    }

    factory.getCurrentUser = function (w) {
        return baseSvc.getRestFilter(w + '/_api/SP.UserProfiles.PeopleManager/GetMyProperties')
    }


    // Gestione dei commenti che prevede la lista SpaceComments
    factory.getComments = function (uri) {
        uri = uri.replace(/\'/g, "''");
        uri = encodeURIComponent(uri);
        return baseSvc.getListFilter(_spPageContextInfo.siteAbsoluteUrl, 'SpaceComments', '$filter=SpaceUri eq \'' + uri + '\'')
    }
    factory.postComment = function (uri, testo) {
        var meta = {}
        meta.SpaceComment = testo;
        meta.SpaceUri = uri;
        meta.Title = '-';
        return itemsSvc.addListItem(_spPageContextInfo.siteAbsoluteUrl, 'SpaceComments', meta)
    }
    factory.deleteComment = function (id) {
        return itemsSvc.deleteItem(_spPageContextInfo.siteAbsoluteUrl, 'SpaceComments', id)
    }
    factory.editComment = function (id, uri, testo) {
        var meta = {}
        meta.SpaceComment = testo;
        return itemsSvc.updateListItem(_spPageContextInfo.siteAbsoluteUrl, 'SpaceComments', id, meta)
    }
    return factory;
}]);
