var console = console || { "log": function () { } };

var mb = mb || {};
// Globals da usare nella pagina
mb.web = {}; // Contiene L'oggetto sharepoint del web
mb.user = {} // Contiene l'oggetto utente

// Funzioni di supporto per Sharepoint
mb.sp = mb.sp || {};

// Formatta la chiamata per un endpoint rest
mb.sp.getRestFilter = function (restUrl, f) {
    return $.ajax({
        url: restUrl,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose"
        }
    });

};

// Helper per la chiamata rest al web
mb.sp.webData = function (w, f) {
    return mb.sp.getRestFilter(w + "/_api/web?" + f)
}

mb.sp.showEditPage = function () {
    _ribbonStartInit("MyApp.SharePoint.Ribbon.CustomTab", false, null);
}

// Managed MEtadata Relate Functons
mb.sp.mmd = {};

/*
 *  Read TermsSet as flat array
 */
mb.sp.mmd.getTermSet = function (termSet) {

    var TermValues = []
    var deferred = $q.defer();

    var ctx = SP.ClientContext.get_current(),
        taxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(ctx),
        termSets = taxonomySession.getTermSetsByName(termSet, 1033),
        termset = termSets.getByName(termSet),
        terms = termset.getAllTerms();

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

// Chek if current user starts with given string
mb.sp.checkUser = function (startWith) {
    //var startWith = "01ser";
    if (mb.sp.user.LoginName.split('\\')[1].startsWith(startWith)) {
        return true;
    } else {
        return false;
    }

}
// LogOut user if username starts with
mb.sp.logoutUser = function (startWith) {
    //var startWith = "01ser";
    if (mb.sp.checkUser(startWith)) {
        window.location.href = mb.sp.url + "/_layouts/closeConnection.aspx?loginasanotheruser=true";
    }

}

// Async Load Taxonomy and MMD
mb.sp.loadTaxonomy = function () {
    var dfd = $.Deferred();
    SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
    SP.SOD.registerSod('sp.publishing.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.publishing.js'));
    SP.SOD.executeFunc('sp.taxonomy.js', 'SP.Taxonomy.TaxonomySession', function () {
        SP.SOD.executeFunc('sp.publishing.js', 'SP.Publishing.Navigation.NavigationTermSet', function () {
            dfd.resolve(true);
        });
    });

    return dfd.promise();
}

///////// mb.SP.USER
mb.sp.user = mb.sp.user || {};
mb.sp.user.getCurrentUser = function (w, filter) {
    if(filter === undefined) { filter === ''}
    var url = w + "/_api/web/currentuser?" + filter;
    return $.ajax(url, { method: "GET", headers: { "accept": "application/json;odata=verbose" } });
};
mb.sp.user.hasPermission = function (web, Perm) {
    //Permission for admin to show or hide the entries on memory board using ShowOnHomePage Field
    var deferred = $.Deferred();
    var perm = new SP.BasePermissions();
    perm.set(Perm);
    $.ajax({
        url: web + "/_api/web/doesuserhavepermissions(@v)?@v={'High':'" + perm.$4_1.toString() + "', 'Low':'" + perm.$5_1.toString() + "'}",
        type: "GET",
        headers: { "accept": "application/json;odata=verbose" },
        success: function (data) {
            var d = data.d.DoesUserHavePermissions;
            deferred.resolve(d);
        },
        error: function (err) {
            deferred.reject(err);
            console.log(JSON.stringify(err));
        }
    });
    return deferred.promise();
}
mb.sp.user.checkPermissions = function (url, perm) {
    var deferred = $.Deferred();
    var call = jQuery.ajax({
        url: url + "/_api/Web/effectiveBasePermissions",
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json;odata=verbose"
        }
    });

    call.done(function (data, textStatus, jqXHR) {
        var manageListsPerms = new SP.BasePermissions();
        manageListsPerms.initPropertiesFromJson(data.d.EffectiveBasePermissions);
        // SP.PermissionKind.manageLists
        var manageLists = manageListsPerms.has(perm);
        deferred.resolve(manageLists);

    });
    call.fail(function (data, textStatus, jqXHR) {
        deferred.reject(data);
    });
    return deferred.promise();
}
mb.sp.user.doesUserHaveWebPermissions = function (permission) {
    switch (permission.toLowerCase()) {
        case 'viewlistitems': return (_spWebPermMasks.Low & 1) === 1;
        case 'addlistitems': return (_spWebPermMasks.Low & 2) === 2;
        case 'editlistitems': return (_spWebPermMasks.Low & 4) === 4;
        case 'deletelistitems': return (_spWebPermMasks.Low & 8) === 8;
        case 'approveitems': return (_spWebPermMasks.Low & 16) === 16;
        case 'openitems': return (_spWebPermMasks.Low & 32) === 32;
        case 'viewversions': return (_spWebPermMasks.Low & 64) === 64;
        case 'deleteversions': return (_spWebPermMasks.Low & 128) === 128;
        case 'cancelcheckout': return (_spWebPermMasks.Low & 256) === 256;
        case 'managepersonalviews': return (_spWebPermMasks.Low & 512) === 512;
        case 'managelists': return (_spWebPermMasks.Low & 2048) === 2048;
        case 'viewformpages': return (_spWebPermMasks.Low & 4096) === 4096;
        case 'open': return (_spWebPermMasks.Low & 65536) === 65536;
        case 'viewpages': return (_spWebPermMasks.Low & 131072) === 131072;
        case 'addandcustomizepages': return (_spWebPermMasks.Low & 262144) === 262144;
        case 'applythemeandborder': return (_spWebPermMasks.Low & 524288) === 524288;
        case 'applystylesheets': return (_spWebPermMasks.Low & 1048576) === 1048576;
        case 'viewusagedata': return (_spWebPermMasks.Low & 2097152) === 2097152;
        case 'createsscsite': return (_spWebPermMasks.Low & 4194304) === 4194304;
        case 'managesubwebs': return (_spWebPermMasks.Low & 8388608) === 8388608;
        case 'creategroups': return (_spWebPermMasks.Low & 16777216) === 16777216;
        case 'managepermissions': return (_spWebPermMasks.Low & 33554432) === 33554432;
        case 'browsedirectories': return (_spWebPermMasks.Low & 67108864) === 67108864;
        case 'browseuserinfo': return (_spWebPermMasks.Low & 134217728) === 134217728;
        case 'adddelprivatewebparts': return (_spWebPermMasks.Low & 268435456) === 268435456;
        case 'updatepersonalwebparts': return (_spWebPermMasks.Low & 536870912) === 536870912;
        case 'manageweb': return (_spWebPermMasks.Low & 1073741824) === 1073741824;
        case 'useclientintegration': return (_spWebPermMasks.Low & 68719476736) === 68719476736;
        case 'useremoteapis': return (_spWebPermMasks.Low & 137438953472) === 137438953472;
        case 'managealerts': return (_spWebPermMasks.Low & 274877906944) === 274877906944;
        case 'createalerts': return (_spWebPermMasks.Low & 549755813888) === 549755813888;
        case 'editmyuserinfo': return (_spWebPermMasks.Low & 1099511627776) === 1099511627776;
        case 'enumeratepermissions': return (_spWebPermMasks.Low & 4611686018427387904) === 4611686018427387904;
        case 'fullmask': return (_spWebPermMasks.Low & 9223372036854775807) === 9223372036854775807;
        default: return 0;
    }
}

// Log Mangement
mb.sp.log = mb.sp.log || {};

mb.sp.log.logNotification = function (opt, stick) {

    function ShowDialog() {
        SP.UI.Notify.addNotification(opt, stick);
    }
    ExecuteOrDelayUntilScriptLoaded(ShowDialog, "sp.js");
}

// Gestione degli errori
// con -> se esce anche in console
// ale -> se geenra anche un alert
mb.sp.log.logError = function (w, title, message, level, con, ale) {
    try {
        var m = {}
        m.Title = "ERROR";
        m.Message = JSON.stringify(message).toString();
        m.Url = w;

        if (con) {
            console.log(message)
        }
        if (ale) {
            alert('Errore: ' + message)
        }
        return baseSvc.addListItem('', "Logs", m)

    } catch (exception) {
        alert('Errore Grave')
        console.log(error)
    }
}


// Space Top
mb.sp.menuSite = mb.sp.menuSite || {};
mb.sp.menuSite.checkToolbar = function () {

    if (eval(localStorage.getItem("toolbar"))) {
        $("#menu-show-toolbar").css('display', 'none');
        $("#menu-hide-toolbar").css('display', 'block');
        $("#s4-ribbonrow").css('display', 'block');
        $("#suiteBar").css('display', 'block');

    } else {
        $("#menu-hide-toolbar").css('display', 'none');
        $("#menu-show-toolbar").css('display', 'block');
        $("#s4-ribbonrow").css('display', 'none');
        $("#suiteBar").css('display', 'none');

    }
    mb.sp.menuSite.setHeight()
}
mb.sp.menuSite.toggleToolbar = function () {

    if (eval(localStorage.getItem("toolbar"))) {

        $("#menu-hide-toolbar").css('display', 'none');
        $("#menu-show-toolbar").css('display', 'block');
        $("#s4-ribbonrow").css('display', 'none');
        $("#suiteBar").css('display', 'none');
        localStorage.setItem("toolbar", false);

    } else {
        $("#menu-show-toolbar").css('display', 'none');
        $("#menu-hide-toolbar").css('display', 'block');
        $("#s4-ribbonrow").css('display', 'block');
        $("#suiteBar").css('display', 'block');
        localStorage.setItem("toolbar", true);

    }
    /*
     * Setto l'altezza del content in base all'altezza dell header
     */
    mb.sp.menuSite.setHeight()

}
mb.sp.menuSite.setHeight = function () {
    setTimeout(function () {
        $(".mcl-main-container").css("padding-top", $(".mcl-header-container").height());
    }, 300);
    
}

///////// Space Bootstrapping

mb.sp.bootstrap = function () {
    mb.sp.url = _spPageContextInfo.webAbsoluteUrl;

    var dfd = $.Deferred();
    mb.sp.loadTaxonomy();
    mb.sp.menuSite.checkToolbar();
    mb.sp.showEditPage();
    mb.sp.log.urlListaLog = location.origin + '/manager';

    var d1 = mb.sp.user.getCurrentUser(mb.sp.url,'$expand=Groups'); 
    var d2 = mb.sp.webData(mb.sp.url, '$select=*,AllProperties/__GlobalNavigationExcludes,AllProperties/__CurrentNavigationExcludes,AllProperties/__InheritCurrentNavigation&$expand=Navigation/TopNavigationBar,WebInfos,AllProperties,Webs,Navigation/QuickLaunch,ParentWeb');
    var d3 = mb.sp.loadTaxonomy();
    $.when(d1, d2, d3).then(function (d1, d2, d3) {

        mb.sp.user = d1[0].d;
        mb.sp.web = d2[0].d;
        dfd.resolve(true);

    },function (error) {

        dfd.reject(error);
    });

    return dfd.promise();
};


mb.sp.bootstrapApp = function (appName) {

    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {

        SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
        SP.SOD.registerSod('sp.publishing.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.publishing.js'));
        mb.sp.url = _spPageContextInfo.webAbsoluteUrl;
        var d1 = mb.sp.user.getCurrentUser(mb.sp.url, '$expand=Groups');
        var d2 = mb.sp.webData(mb.sp.url, '$select=*&$expand=AllProperties');
        var d3 = mb.sp.loadTaxonomy();

        $.when(d1, d2, d3).then(function (d1, d2, d3) {
            console.log('Bootstrap ' + appName)
            mb.user = d1[0].d;
            mb.web = d2[0].d;
            angular.bootstrap(document, [appName]);

        }, function (error) {
            console.log('Error Bootstrapping ')
            alert('Errore Grave')
            mb.sp.log.logError(mb.sp.url,'')
        });
    });
}

angular.module("mb.angular", ['mb.angular.templates', 'mb.angular.components']);

angular.module("mb.angular").filter('filtraTerms', function () {

    return function (items, idterm) {

        var out = '-';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.ID === idterm) {
                out = item.Name;
            }
        }
        return out;
    }


});
angular.module("mb.angular").filter('arrayObject', function () {

    return function (items, idterm) {

        var out = '-';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.ID === idterm) {
                out = item.Name;
            }
        }
        return out;
    }

});
angular.module("mb.angular").filter('filterDeep', function ($filter) {

    return function (items, key, val) {

        var out = '';
        for (var i = 0; i < items.length && out === ''; i++) {
            var item = items[i];
            if (item[key] === val) {
                out = item;
                break
            }
            out = $filter('filterDeep')(items[i].children, key, val);
        }
        return out;

    }

});
angular.module("mb.angular").filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace !== -1) {
                //Also remove . and , so its gives a cleaner result.
                if (value.charAt(lastspace - 1) === '.' || value.charAt(lastspace - 1) === ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});

angular.module("mb.angular.components", ['mb.angular', 'mb.angular.templates'])

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

    templateUrl: '/_layouts/15/Space/SpaceJs/Master/badge/badge.html',
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


angular.module('mb.angular.templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('Bookmark/Bookmarks.html','<div class="mcl-add-bookmark pull-right">\r\n    <a href="#" class="togglable-icon-bookmark" ng-show="$ctrl.isFollow" ng-click="$ctrl.follow(false)">\r\n        <span class="mcl-glyphicons-icon mcl-icon-add-bookmark togglable-icon mcl-full-icon"></span>\r\n        <span class="mcl-bookmark-txt">remove bookmark</span>\r\n    </a>\r\n    <a href="#" class="togglable-icon-bookmark" ng-show="!$ctrl.isFollow" ng-click="$ctrl.follow(true)">\r\n        <span class="mcl-glyphicons-icon mcl-icon-add-bookmark togglable-icon"></span>\r\n        <span class="mcl-bookmark-txt">add bookmark</span>\r\n    </a>\r\n</div>');
$templateCache.put('Like/Like.html','<span class="mcl-action">\r\n    <span ng-if="$ctrl.isLike" ng-click="$ctrl.like(0)" class="pointer">\r\n        <i class="mcl-glyphicons-icon mcl-icon-like mcl-full-icon"></i>\r\n        Unlike\r\n    </span>\r\n    <span ng-if="!$ctrl.isLike" ng-click="$ctrl.like(1)" class="pointer">\r\n        <i class="mcl-glyphicons-icon mcl-icon-like"></i>\r\n        Like\r\n    </span>\r\n    ({{ $ctrl.obj.LikesCount }})\r\n</span>  ');}]);