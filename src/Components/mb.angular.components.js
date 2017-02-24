angular.module("mb.angular.components", ['mb.angular', 'mb.angular.templates'])
angular.module("mb.angular.components").directive("dirTrueFalse", function () {
    return {
        restrict: "AE",
        link: function (scope, element, attrs) {
            if (eval(attrs.val)) {
                element.html('SI')
            } else {
                element.html('NO')
            }
        }
    };
});
angular.module("mb.angular.components").component('socialBookmarkDocument', {
    // url: url completa del sito dove si trova l'elemento da controllare
    // actor: 1 document - 2 site - 3 
    // fullurl: url del sito o del documento o guid del tag

    templateUrl: 'Bookmark/Bookmarks.html',
    bindings: {
        url: '@'
    },
    controller: function (socialService) {
        var ctrl = this;
        ctrl.follow = {}
        ctrl.error = false;
        ctrl.$onInit = function () {

            socialService.socialFollow(_spPageContextInfo.webAbsoluteUrl, 'isfollowed', 1, _spPageContextInfo.siteAbsoluteUrl + ctrl.url)
            .then(function (data) {
                ctrl.isFollow = data.data.d.IsFollowed;
            }, function (error) {
                console.log(error);
                ctrl.error = true
            });


        }
        ctrl.follow = function (i) {
            var action = 'stopfollowing'
            if (i) { action = 'follow' }
            var fullUrlDoc = ctrl.url + ctrl.urldoc
            socialService.socialFollow(_spPageContextInfo.webAbsoluteUrl, action, 1, _spPageContextInfo.siteAbsoluteUrl + ctrl.url)
            .then(function (data) {
                if (i) {
                    //alert(socialService.statusMessage[data.data.d.Follow]);
                    ctrl.isFollow = true;
                } else {
                    ctrl.isFollow = false;
                    //alert('Stop Following Site')
                }
            }, function (error) {
                console.log(error);
            });
        }

    }
});

angular.module("mb.angular.components").component('socialBookmarkPage', {
    // url: url completa del sito dove si trova l'elemento da controllare
    // actor: 1 document - 2 site - 3 
    // fullurl: url del sito o del documento o guid del tag

    templateUrl: 'Bookmark/Bookmarks.html',
    bindings: {
        url: '@'
    },
    controller: function (socialService) {
        var ctrl = this;
        ctrl.follow = {}
        ctrl.error = false;
        ctrl.$onInit = function () {

            socialService.socialFollow(_spPageContextInfo.webAbsoluteUrl, 'isfollowed', 1, _spPageContextInfo.webAbsoluteUrl + _spPageContextInfo.serverRequestPath)
            .then(function (data) {
                ctrl.isFollow = data.data.d.IsFollowed;
            }, function (error) {
                console.log(error);
                ctrl.error = true
            });


        }
        ctrl.follow = function (i) {
            var action = 'stopfollowing'
            if (i) { action = 'follow' }
            var fullUrlDoc = ctrl.url + ctrl.urldoc
            socialService.socialFollow(_spPageContextInfo.webAbsoluteUrl, action, 1, _spPageContextInfo.webAbsoluteUrl + _spPageContextInfo.serverRequestPath)
            .then(function (data) {
                if (i) {
                    //alert(socialService.statusMessage[data.data.d.Follow]);
                    ctrl.isFollow = true;
                } else {
                    ctrl.isFollow = false;
                    //alert('Stop Following Site')
                }
            }, function (error) {
                console.log(error);
            });
        }
    }
});

angular.module("mb.angular.components").component('socialBookmarkSite', {
    // url: url completa del sito dove si trova l'elemento da controllare
    // actor: 1 document - 2 site - 3 
    // fullurl: url del sito o del documento o guid del tag

    templateUrl: 'Bookmark/Bookmarks.html',
    controller: function (socialService) {
        var ctrl = this;
        ctrl.error = false;
        ctrl.isFollow = {}
        ctrl.$onInit = function () {
            //w, action, type, url
            var fullUrlDoc = ctrl.url + ctrl.urldoc
            socialService.socialFollow(_spPageContextInfo.webAbsoluteUrl, 'isfollowed', 2, _spPageContextInfo.webAbsoluteUrl)
            .then(function (data) {
                ctrl.isFollow = data.data.d.IsFollowed;
            }, function (error) {
                console.log(error);
                ctrl.error = true;
            });

        }
        ctrl.follow = function (i) {
            var action = 'stopfollowing'
            if (i) { action = 'follow' }
            var fullUrlDoc = ctrl.url + ctrl.urldoc
            socialService.socialFollow(_spPageContextInfo.webAbsoluteUrl, action, 2, _spPageContextInfo.webAbsoluteUrl)
            .then(function (data) {
                if (i) {
                    //alert(socialService.statusMessage[data.data.d.Follow]);
                    ctrl.isFollow = true;
                } else {
                    ctrl.isFollow = false;
                    //alert('Stop Following Site')
                }
            }, function (error) {
                console.log(error);
            });
        }
    }
});

/*
 *  Snippets per la pagina. Dove andiamo ad inserire i link socials
 */
angular.module("mb.angular.components").component('socialPage', {
    // url: url completa del sito dove si trova l'elemento da controllare
    // actor: 1 document - 2 site - 3 
    // fullurl: url del sito o del documento o guid del tag

    templateUrl: '/_layouts/15/Space/SpaceJS/Components/Social/page.html',
    controller: function (socialService, baseSvc) {
        var ctrl = this;
        ctrl.$onInit = function () {

            baseSvc.getCurrentPage()
               .then(
               function (data) {
                   ctrl.obj = data.data.d;
               },
               function (error) {
                   console.log(error);
               });

        }
    }
});

angular.module("mb.angular.components").component('socialComments', {
    // url: url completa del sito dove si trova l'elemento da controllare
    // actor: 1 document - 2 site - 3 
    // fullurl: url del sito o del documento o guid del tag

    templateUrl: '/_layouts/15/Space/SpaceJS/Components/Social/comments.html',
    controller: function (socialService, baseSvc) {
        var ctrl = this;
        ctrl.$onInit = function () {

            baseSvc.getCurrentPage()
               .then(
               function (data) {
                   ctrl.obj = data.data.d;
               },
               function (error) {
                   console.log(error);
               });

        }
    }
});

// Home My - FollowList
angular.module("mb.angular.components").component('followedListE', {

    templateUrl: '/_layouts/15/Space/SpaceJS/components/followE/followedListE.html',
    transclude: true,
    bindings: {},
    controller: function (socialService, spaceService) {
        var ctrl = this;
        ctrl.url = _spPageContextInfo.webAbsoluteUrl;
        ctrl.follow = spaceService.following;
        ctrl.$onInit = function () {
            socialService.getFollowed(ctrl.url, 6)
            .success(function (data) {
                ctrl.follow = data.d.Followed.results;
            })
           .error(function (error) {
               console.log(error);
           });

        }
        ctrl.stop = function (obj) {
            socialService.socialFollow(ctrl.url, 'stopfollowing', obj.ActorType, obj.Uri)
            .then(function (data) {
                ctrl.$onInit()
            }, function (error) {
                console.log(error);
            });
        }
    }
});

// Home Top Links
/*
 * Like Area
 */
angular.module("mb.angular.components").component('likeSnippet', {

    templateUrl: 'Like/Like.html',
    transclude: true,
    bindings: {
        obj: '<'
    },
    controller: function (socialService) {
        var ctrl = this;
        ctrl.isLike = false;
        ctrl.follow = {}
        ctrl.$onInit = function () {

            if (ctrl.obj === undefined) {
                ctrl.obj = {}
                ctrl.obj.LikesCount = 0
            } else {
                var uts = ctrl.obj.LikedBy.results
                angular.forEach(uts, function (ut, index) {
                    if (ut.Id === _spPageContextInfo.userId) {
                        ctrl.isLike = true;
                    }
                });
                if (ctrl.obj.LikesCount === undefined || ctrl.obj.LikesCount === '' || ctrl.obj.LikesCount == null) {
                    ctrl.obj.LikesCount = 0
                }
            }

        }
        ctrl.$onChanges = function (changesObj) {
            if (changesObj.obj.currentValue !== undefined) {

                var uts = ctrl.obj.LikedBy.results
                angular.forEach(uts, function (ut, index) {
                    if (ut.Id === _spPageContextInfo.userId) {
                        ctrl.isLike = true;
                    }
                });
                if (ctrl.obj.LikesCount === undefined) { ctrl.obj.LikesCount = 0 }
            }
        }
        ctrl.like = function (i) {
            socialService.setLike(_spPageContextInfo.webServerRelativeUrl, ctrl.obj.ParentList.Id, ctrl.obj.Id, i)
            .then(function (risultato) {
                if (risultato === 1) {
                    ctrl.isLike = true;
                    ctrl.obj.LikesCount = ctrl.obj.LikesCount + 1
                } else {
                    ctrl.isLike = false;
                    ctrl.obj.LikesCount = ctrl.obj.LikesCount - 1
                }
            }, function (reason) {
                alert('Failed: ' + reason);
            });
        }
    }
});

/*
 * Area Commenti
 * Studiare come renderizzare
 */

/*
 * Badge Utente
 */
angular.module("mb.angular.components").component('userBadge', {

    templateUrl: 'UserBadge/userBadge.html',
    transclude: true,
    bindings: {
        obj: '<'
    },
    controller: function (socialService) {
        var ctrl = this;
        ctrl.isAdmin = mb.sp.user.IsSiteAdmin;
        ctrl.url = _spPageContextInfo.webAbsoluteUrl;
        ctrl.$onInit = function () {
            socialService.getCurrentUser(ctrl.url)
             .then(function (risultato) {
                 ctrl.user = risultato.data.d
             }, function (reason) {
                 console.log(reason)

             });
        }

    }
});

