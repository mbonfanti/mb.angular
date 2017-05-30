/*
    Override per Internet Explorer, senza questo il console log, senza gli strumenti di DEV aperti,
    non funziona bloccando il codice
*/
var console = console || { "log": function () { } };

/* 
    Inizializzazione della libreria MB 
*/

var mb = mb || {};
mb.url = "";
mb.loadCSS = function (href) {
 
    var cssLink = $("<link rel='stylesheet' type='text/css' href='" + mb.url + "/" + href + "'>");
    $("head").append(cssLink);
};
mb.resultsToObject = function (ris, key, value) {
    var temp = {}
    for (i = 0; i < ris.length; i++) {
        temp[ris[i][key]] = ris[i][value]
    }
    return temp;
}
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
mb.sp.findTermSet = function (termset) {

    var TermValues = []
    var deferred = $.Deferred();

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

    return deferred.promise();;


}

mb.sp.setPeoplePicker = function (controlName, value) {

    var ppDiv = $("[id$='ClientPeoplePicker'][title='" + controlName + "']");         // Select the People Picker DIV
    var ppEditor = ppDiv.find("[title='" + controlName + "']");  // Use the PP DIV to narrow jQuery scope
    var spPP = SPClientPeoplePicker.SPClientPeoplePickerDict[ppDiv[0].id];           // Get the instance of the People Picker from the Dictionary
    ppEditor.val(value);
    spPP.AddUnresolvedUserFromEditor(true);
}

///////// mb.SP.USER
mb.sp.user = mb.sp.user || {};
mb.sp.user.getAllProfile = function (url, filter) {

    var dfd = $.Deferred();
    mb.sp.user.getCurrentUser(url, filter)
        .then(function (data) {
            mb.user = data.d;
            mb.sp.user.getUserProfile(url, data.d.LoginName)
                .then(function (data) {
                    var tempUser = data.d;
                    tempUser.uniqueID = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                    if (tempUser.UserProfileProperties != undefined) {
                        jQuery.extend(tempUser, mb.resultsToObject(tempUser.UserProfileProperties.results, 'Key', 'Value'));
                    }
                    jQuery.extend(tempUser, mb.user)
                    dfd.resolve(tempUser)
                },
                function (error) {

                    dfd.resolve(mb.user)
                })
        }, function (error) {
            dfd.reject(error)
        })

    return dfd.promise();
}
mb.sp.user.User = function (w, filter) {
    var dfd = $.Deferred();
   mb.sp.user.getCurrentUser(w, filter)
        .then(function (data) {
            mb.user = data.d;
            dfd.resolve(mb.user)
        },function (error) {
             dfd.reject(false)
            })
              return dfd.promise();
};
mb.sp.user.getCurrentUser = function (w, filter) {
    if (filter === undefined) { filter === '' }
    var url = w + "/_api/web/currentuser?" + filter;
    return $.ajax(url, { method: "GET", headers: { "accept": "application/json;odata=verbose" } });
};
mb.sp.user.getUserProfile = function (w, accountName) {

    return $.ajax({
        url: w + "/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='" + encodeURIComponent(accountName) + "'",
        method: "GET",
        headers: { "accept": "application/json;odata=verbose" }
    })
}


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
        manageListsPerms.initPropertiesFromJson(data.data.d.EffectiveBasePermissions);
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

    var d1 = mb.sp.user.getAllProfile(mb.sp.url, '$expand=Groups');
    var d2 = mb.sp.webData(mb.sp.url, '$select=*,AllProperties/__GlobalNavigationExcludes,AllProperties/__CurrentNavigationExcludes,AllProperties/__InheritCurrentNavigation&$expand=Navigation/TopNavigationBar,WebInfos,AllProperties,Webs,Navigation/QuickLaunch,ParentWeb');
    var d3 = mb.sp.loadTaxonomy();
    $.when(d1, d2, d3).then(function (d1, d2, d3) {

        mb.sp.user = d1;
        mb.sp.web = d2[0].d;
        dfd.resolve(true);

    },function (error) {

        dfd.reject(error);
    });

    return dfd.promise();
};


mb.sp.bootstrapApp = function (appName,call) {

    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {

        SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
        SP.SOD.registerSod('sp.publishing.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.publishing.js'));
        mb.sp.url = _spPageContextInfo.webAbsoluteUrl;
        var d1 = mb.sp.user.getAllProfile(mb.sp.url, '$expand=Groups');
        var d2 = mb.sp.webData(mb.sp.url, '$select=*&$expand=AllProperties');
        var d3 = mb.sp.loadTaxonomy();

        $.when(d1, d2, d3).then(function (d1, d2, d3) {
            console.log('Bootstrap ' + appName)
            mb.user = d1;
            mb.web = d2[0].d;
            angular.bootstrap(document, [appName]);
            //call();
        }, function (error) {
            console.log('Error Bootstrapping ')
            alert('Errore Grave')
            mb.sp.log.logError(mb.sp.url,'')
        });
    });
    
}
mb.sp.bootstrapAppFoundation = function (appName,call) {

    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {

        mb.sp.url = _spPageContextInfo.webAbsoluteUrl;
        var d1 = mb.sp.user.User(mb.sp.url, '$expand=Groups');
        var d2 = mb.sp.webData(mb.sp.url, '$select=*&$expand=AllProperties');
        

        $.when(d1, d2).then(function (d1, d2) {
            console.log('Bootstrap ' + appName)
            
            mb.web = d2[0].d;
            angular.bootstrap(document, [appName]);
            //call();
        }, function (error) {
            console.log('Error Bootstrapping ')
            alert('Errore Grave.')
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

angular.module("mb.angular").factory("configSvc", ['$q', '$http', "baseSvc", "commonSvc", function ($q, $http, baseSvc, commonSvc) {
    var factory = {};

    factory.headers = { "accept": "application/json;odata=verbose" };
    // CONSTRUCT CONFIG
    factory.config = "";
    factory.getConfig = function (u) {
        var deferred = $q.defer();

        if (factory.config === "") {
            baseSvc.getListFilter(u, 'Config', '')
            .then(
                function (data) {
                    var ris = data.data.d.results;

                    var conf = {}
                   
                    factory.config = commonSvc.resultsToObject(ris, 'Title', 'Value');
                    deferred.resolve(factory.config);
                },
                 function (err) {
                     deferred.reject()
                 })

        } else {
            deferred.resolve(factory.config);
        }

        return deferred.promise;
    }
    factory.getConfigFilter = function (u, t) {
        var deferred = $q.defer();
        factory.getConfig(u).then(
            function (values) {
                 var temp = factory.getConfigTerm(factory.config, t)
                 if (temp == "") {
                     deferred.reject('Non trovato');
                 } else {
                     deferred.resolve(temp);
                 }
             },
             function (err) {
                 deferred.reject()
             })
        
        return deferred.promise;
    }
    factory.getConfigTerm = function (c, t) {
        var result = c[t] === undefined;
        if (!result) {
            return c[t]
        } else {
            return "";
        }
    }

    return factory;
}])

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
    // Sono stati spostati nel webSvc
    factory.getWebProperty = function (w, p) {
        return $http({
            url: w + "/_api/web/AllProperties?select='" + p + "'",
            method: "GET",
            headers: {
                "Accept": "application/json; odata=verbose",
            }
        });
    }
    factory.setWebPropertyRest = function (web, property, value) {
        return baseSvc.getDigest(web).then(function (data) {
            return $.ajax({
                url: web + "/_api/web",
                type: "POST",
                data: '{ "__metadata": { "type": "SP.Web" }, "' + property + '": "' + value + '" }',
                headers: {
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue,
                    "accept": "application/json;odata=verbose",
                    "content-type": "application/json;odata=verbose",
                    "X-HTTP-Method": "MERGE"
                }
            });
        });
    };

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
   
    return factory;
}])


angular.module("mb.angular").factory("commonSvc", ['baseSvc', '$http', function (baseSvc, $http) {
    var factory = {};
    //factory.getWeb = function (exportUrl) {
    //    return $http.get(exportUrl);
    //}

    factory.resultsToObject = function (ris,key,value) {
        var temp = {}
        for (i = 0; i < ris.length; i++) {
            temp[ris[i][key]] = ris[i][value]
        }
        return temp;
    }


    factory.getParameterByName = function (name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    factory.imageExists = function (image_url) {

        var img = new Image();
        img.src = image_url;
        return img.height !== 0;

    }

    factory.modalOptions = function (opt) {

        function ShowDialog() {

            SP.UI.ModalDialog.showModalDialog(options);
        }
        ExecuteOrDelayUntilScriptLoaded(ShowDialog, "sp.ui.dialog.js");
    }

    factory.logNotification = function (opt, stick) {

        function ShowDialog() {
            SP.UI.Notify.addNotification(opt, stick);
        }
        ExecuteOrDelayUntilScriptLoaded(ShowDialog, "sp.js");
    }

    factory.arrayContiene = function (arr, k) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].Title === k) {
                return true;
            }
        }
        return false;
    }

    factory.filtraArrayObject = function (arr, chiave, valore) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][chiave] === valore) {
                return arr[i];
            }
        }
        return "";
    }

    // Utility
    return factory;
}])
angular.module("mb.angular").factory("fileSvc", ['baseSvc', '$http', 'itemsSvc', function (baseSvc, $http, itemsSvc) {

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
        itemPayload['__metadata'] = {
            'type': item.__metadata.type
        };
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
    factory.attachFile = function (w, list, id, filename, file) {
        // endpoint rest: http://site url/_api/web/lists/getbytitle('list title')/items(item id)/AttachmentFiles/ add(FileName='file name')
        var endPoint = w + "/_api/web/lists/getbytitle('" + list + "')/items(" + id + ")/AttachmentFiles/ add(FileName='" + filename + "')"
        var deferred = $.Deferred();
        var dataDig = "";
        baseSvc.getDigest(w).then(function (dataDig) {
            factory.getFileBuffer(file).then(
                function (arrayBuffer) {
                    $.ajax({
                        url: endPoint,
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
    factory.attachFileDelete = function (w, list, id, filename) {
        // endpoint rest: http://site url/_api/web/lists/getbytitle('list title')/items(item id)/AttachmentFiles/ add(FileName='file name')
        var endPoint = w + "/_api/web/lists/getbytitle('" + list + "')/items(" + id + ")/AttachmentFiles/getByFileName(FileName='" + filename + "')"
        var deferred = $.Deferred();
        var dataDig = "";
        baseSvc.getDigest(w).then(function (dataDig) {
            $.ajax({
                url: endPoint,
                type: "DELETE",
                
                contentType: "application/json;odata=verbose",
                headers: {
                    "accept": "application/json;odata=verbose",
                    "X-RequestDigest": dataDig.data.d.GetContextWebInformation.FormDigestValue
                },
                success: function (data) {
                    deferred.resolve(data);
                },
                error: function (err) {
                    deferred.reject(err);
                }
            });
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
angular.module("mb.angular").factory("itemsSvc", ['baseSvc', '$http', function (baseSvc, $http) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };
    $http.defaults.headers.post["Content-Type"] = "application/json";

    // MODIFICATI DA MATTEO IL 18-12 ORA CARICA TUTTO IN AUTOMATICO SIA DIGEST CHE IL __METADATA
    factory.addListItem = function (w, l, metadata) {

        // Becchiamo il tipo
        return baseSvc.getRest(w + '/_api/web/lists/GetByTitle(\'' + l + '\')/ListItemEntityTypeFullName').then(function (data) {

            var item = jQuery.extend({
                "__metadata": {
                    "type": data.data.d.ListItemEntityTypeFullName
                }
            }, metadata);

            var url = w + "/_api/web/lists/getbytitle('" + l + "')/items";
            return baseSvc.getDigest(w).then(function (data) {

                return jQuery.ajax({
                    url: url,
                    method: "POST",
                    contentType: "application/json;odata=verbose",
                    data: JSON.stringify(item),
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue
                    }

                });
            });
        });
    }
    
    factory.updateListItem = function (w, l, id, metadata) {
        var deferred = jQuery.Deferred();
        var url = w + "/_api/web/lists/getbytitle('" + l + "')/items(" + id + ")";
        baseSvc.getDigest(w).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue
            baseSvc.getRest(url).then(function (data) {
                var item = jQuery.extend({
                    "__metadata": {
                        "type": data.data.d.__metadata.type
                    }
                }, metadata);
                jQuery.ajax({
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

    factory.deleteItem = function (url, listname, id) {

        var restUrl = url + "/_api/web/lists/getbytitle('" + listname + "')/items(" + id + ")";
        return baseSvc.getDigest(url).then(function (data) {
            return $http({
                url: restUrl,
                method: "POST",
                contentType: "application/json;odata=verbose",
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue,
                    "IF-MATCH": "*",
                    "X-HTTP-Method": "DELETE"
                }
            });
        });
    };

    factory.approveItem = function (w, l, id, status) {
        // Settiamo il moderation status to

        var restUrl = w + "/_api/web/lists/getByTitle('" + l + "')/items(" + id + ")";
        jQuery.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            processData: false,
            url: restUrl,
            data: "{'OData__ModerationStatus':0}",
            dataType: "json"
        });
    }


    return factory;
}])
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

angular.module("mb.angular").factory("listSvc", ['baseSvc', '$q', '$http', function (baseSvc, $q, $http) {
    var factory = {};

    factory.getCtbyName = function (w, name) {
        var url = w + "/_api/web/AvailableContentTypes?$select=Name,Id,StringId&$filter=Name eq '" + name + "'";
        return baseSvc.getRest(url);
    }
    factory.creaLista = function (w, titolo, descrizione, ct, template) {
        return factory.creaListaRest(w, titolo, descrizione, ct, 100)
    }
    factory.creaDocLib = function (w, titolo, descrizione, ct, template) {
        return factory.creaListaRest(w, titolo, descrizione, ct, 101)
    }
    factory.creaListaRest = function (w, titolo, descrizione, ct, template) {
        var obj = {
            '__metadata': { 'type': 'SP.List' },
            'AllowContentTypes': ct,
            'BaseTemplate': template,
            'ContentTypesEnabled': ct,
            'Description': descrizione,
            'Title': titolo
        }
        return baseSvc.getDigest(w).then(function (dataDig) {
            var dig = dataDig.data.d.GetContextWebInformation.FormDigestValue;
            return jQuery.ajax({
                url: w + "/_api/web/lists",
                method: "POST",
                contentType: "application/json;odata=verbose",
                data: JSON.stringify(obj),
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": dig
                }

            });


        })
    }
    factory.addCtbyName = function (w, name, list) {
        return factory.getCtbyName(w, name).then(function (data) {
            return factory.addListCt(w, data.data.d.results[0].StringId, list);
        })

    }
    factory.addListCt = function (w, id, list) {
        return baseSvc.getDigest(w).then(function (dataDig) {
            var dig = dataDig.data.d.GetContextWebInformation.FormDigestValue;
            var siteUrl = w + "/_api/web/lists/getbytitle('" + list + "')/ContentTypes/AddAvailableContentType";
            return jQuery.ajax({
                url: siteUrl,
                type: "POST",
                data: JSON.stringify({
                    "contentTypeId": id
                }),
                headers:
                {
                    'accept': 'application/json;odata=verbose',
                    "content-type": "application/json;odata=verbose",
                    "X-RequestDigest": dig
                }
            });
        });

    }
    factory.removeListCt = function (w, id, list) {

        return baseSvc.getDigest(w).then(function (dataDig) {
            var dig = dataDig.data.d.GetContextWebInformation.FormDigestValue;
            var siteUrl = w + "/_api/web/lists/getbytitle('" + list + "')/ContentTypes('" + id + "')";
            return jQuery.ajax({
                url: siteUrl,
                type: "DELETE",
                data: JSON.stringify({
                    "contentTypeId": id
                }),
                headers:
                {
                    'accept': 'application/json;odata=verbose',
                    "content-type": "application/json;odata=verbose",
                    "X-RequestDigest": dig
                }
            });
        });
    }

    return factory;
}]);



angular.module("mb.angular").factory("logSvc", ['baseSvc', 'itemsSvc', '$http', function (baseSvc, itemsSvc, $http) {

    var factory = {};

    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.urlListaLog = '/manager';

    factory.logNotification = function (opt, stick) {

        function ShowDialog() {
            SP.UI.Notify.addNotification(opt, stick);
        }
        ExecuteOrDelayUntilScriptLoaded(ShowDialog, "sp.js");
    }

    // Gestione degli errori
    /// con -> se esce anche in console
    /// ale -> se geenra anche un alert
    factory.logError = function (w, title, message, level, con, ale) {
        try {
            var m = {}
            m.Title = "ERROR";
            m.LogMessage = JSON.stringify(message).toString();
            m.LogLevel = 'medium';
            m.App = 'Space';
            m.LinkUrl = w;

            if (con) {
                console.log(message)
            }
            if (ale) {
                alert('Errore: ' + message)
            }
            return itemsSvc.addListItem(factory.urlListaLog, "AppLog", m)

        } catch (exception) {

            console.log('Non è possbile salavre i log: ' + exception.message)
        }
    }


    return factory;
}])
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
angular.module("mb.angular").factory("permSvc", ['baseSvc', '$q', '$http', function (baseSvc, $q, $http) {
    var factory = {};

    // Util Functions 
    factory.findPermission = function (r,p) {
        var temp = false;
        var roles = factory.parseBasePermissions(r);
        for (var i = 0; i < roles.length; i++) {
            if (roles[i] === p) {
                temp = true
            }
        }
        return temp
    }
    factory.parseBasePermissions = function (value) {
        var permissions = new SP.BasePermissions();
        permissions.initPropertiesFromJson(value);

        var permLevels = [];
        for (var permLevelName in SP.PermissionKind.prototype) {
            if (SP.PermissionKind.hasOwnProperty(permLevelName)) {
                var permLevel = SP.PermissionKind.parse(permLevelName);
                if (permissions.has(permLevel)) {
                    permLevels.push(permLevelName);
                }
            }
        }
        return permLevels;
    }

    // PERMISSION ITEM
    factory.getListUserEffectivePermissions = function (w, l, a) {

        var endpointUrl = w + "/_api/web/lists/getbytitle('" + l + "')/getusereffectivepermissions(@u)?@u='" + encodeURIComponent(a) + "'";

        return $http({
            url: endpointUrl,
            method: "GET",
            headers: baseSvc.headers
        });
    }
    factory.chekPermissionOnList = function (w, l, a, p) {
        /*
         * Controlla se la lista di destinazione contiene il permesso che passiamo come paramentro
         * chekPermissionOnList(webUrl,'Documents','i:0#.f|membership|jdoe@tenant.onmicrosoft.com','editListItems')
         */
        var deferred = $q.defer();
        factory.getListUserEffectivePermissions(w, l, a)
        .then(function (data) {
            deferred.resolve(factory.findPermission(data.data.d.GetUserEffectivePermissions,p));

        },function (data) {
            deferred.reject(data);
        })
        return deferred.promise;
    }

    // Permission on web
    factory.getWebUserEffectivePermissions = function (w, a) {
        var endpointUrl = w + "/_api/web/getusereffectivepermissions(@u)?@u='" + encodeURIComponent(a) + "'";

        return $http({
            url: endpointUrl,
            method: "GET",
            headers: baseSvc.headers
        });
    }
    factory.chekPermissionOnWeb = function (w, a, p) {
        /*
         * Controlla se la lista di destinazione contiene il permesso che passiamo come paramentro
         * chekPermissionOnList(webUrl,,'i:0#.f|membership|jdoe@tenant.onmicrosoft.com','editListItems')
         */
        var deferred = $q.defer();
        factory.getWebUserEffectivePermissions(w, a)
        .then(function (data) {
            deferred.resolve(factory.findPermission(data.data.d.GetUserEffectivePermissions, p));

        },function (data) {
            deferred.reject(data);
        })
        return deferred.promise;
    }

    // Role Binding
    factory.getTargetRoleDefinitionId = function (u, t) {
        var deferred = jQuery.Deferred();
        $http({
            url: u + '/_api/web/roledefinitions/getbyname(\'' + t + '\')/id',
            type: 'GET',
            headers: { 'accept': 'application/json;odata=verbose' },
            success: function (responseData) {
                deferred.resolve(responseData.d.Id);
            },
            error: function (data) {
                deferred.reject(data);
            }
        });
        return deferred.promise();
    }
    factory.addRoleDefinitionBinding = function (w, list, iditem, level, user) {
        return factory.getDigest(w).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue
            return factory.getTargetRoleDefinitionId(w, level).then(function (id) {
                return $http({
                    url: w + '/_api/web/lists/getByTitle(\'' + list + '\')/Items(' + iditem + ')/roleassignments/addroleassignment(principalid=' + user + ',roledefid=' + id + ')',
                    type: 'POST',
                    headers: {
                        'X-RequestDigest': digest,
                        'accept': "application/json;odata=verbose",
                        'content-type': "application/json;odata=verbose"
                    }
                });
            });
        });
    }
    factory.removeRoleDefinitionBinding = function (w, list, iditem, user) {
        return factory.getDigest(w).then(function (data) {
            var digest = data.d.GetContextWebInformation.FormDigestValue

            return $http({
                url: w + '/_api/web/lists/getByTitle(\'' + list + '\')/Items(' + iditem + ')/roleassignments/getbyprincipalid(' + user + ')',
                type: 'POST',
                headers: {
                    'X-RequestDigest': digest,
                    'accept': "application/json;odata=verbose",
                    'content-type': "application/json;odata=verbose",
                    'X-HTTP-Method': 'DELETE'
                }
            });

        });
    }

    /*
     * Check access to site -> 
     * url: string dell'url da controllare
     * return:
     * 0. Accesso al sito
     * 1. Accesso negato
     * 2. sito non esistente
     */

    factory.checkSiteAccesss = function (url) {
        var deferred = jQuery.Deferred();
        if (url === undefined || url === '' || url === null) {
            deferred.resolve(2)
        } else {
            $http.get(url)
                       .then(function (jqXHR, textStatus, errorThrown) {
                           if (textStatus === 200) {
                               deferred.resolve(0);
                           }
                           if (textStatus === 202) {
                               deferred.resolve(1);
                           }
                       },function (jqXHR, textStatus, errorThrown) {
                           deferred.resolve(2);
                       })
        }

        return deferred.promise();
    }

    // Utility
    return factory;
}])
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
angular.module("mb.angular").factory("userSvc", ['baseSvc', '$q', '$http', 'commonSvc', function (baseSvc, $q, $http, commonSvc) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };
    factory.isAdmin = false;

    factory.getCurrentUser = function (w) {
        return $http({
            url: w + "/_api/web/getuserbyid(" + _spPageContextInfo.userId + ")",
            method: "GET",
            headers: factory.headers
        });

    }
    factory.getUserByID = function (w, i) {
        return $http({
            url: w + "/_api/web/getuserbyid(" + i + ")",
            method: "GET",
            headers: factory.headers
        });
    }

    // Torna il profilo utente preso dall'UPS - torna errore se l'ups non è attivo
    factory.getUserProfile = function (w, accountName) {
        var deferred = $q.defer();
        $http({
            url: w + "/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='" + encodeURIComponent(accountName) + "'",
            method: "GET",
            headers: factory.headers
        })
            .then(function (data) {
                var tempUser = data.data.d;
                tempUser.uniqueID = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                if (tempUser.UserProfileProperties != undefined) {
                    angular.merge(tempUser, commonSvc.resultsToObject(tempUser.UserProfileProperties.results, 'Key', 'Value'));
                }
                deferred.resolve(tempUser)
            },
            function (error) {
                deferred.reject(error)
            })

        return deferred.promise;
    }

    // Torna l'utente completo, passando il solo ID utente, controlla se ups è attivo e funzionante, nel caso
    // la proprietaa isUps ci dice se il profilo è completo dall'ups

    factory.getCompleteUserProfile = function (w, id) {
        var utenteCompleto = {}
        utenteCompleto.isUps = false;
        var deferred = $q.defer();
        factory.getUserByID(w, id).then(
            function (data) {
                utenteCompleto = data.data.d;
                utenteCompleto.isUps = false;
                utenteCompleto.isUpsAlert = false;
                console.log(data)
                factory.getUserProfile(w, data.data.d.LoginName)
                    .then(function (data) {
                        utenteCompleto.isUps = true
                        angular.merge(utenteCompleto, data)
                        return deferred.resolve(utenteCompleto)
                    }, function (err) {
                        utenteCompleto.isUpsAlert = true;
                        return deferred.resolve(utenteCompleto)
                    })
            }, function (err) {

                return deferred.reject(err)
            })

        return deferred.promise;
    }



    factory.userInGroupsSP = function (url, userId, groups) {
        var deferred = jQuery.Deferred();
        var t = false;
        var arrGroups = groups.split(';');
        factory.getDigest(url).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue;
            baseSvc.getUserGroups(url, userId, digest)
                .done(function (r) {
                    for (i === 0; i < arrGroups; i++) {
                        t = commonSvc.arrayContiene(r.d.results, arrGroups[i])
                    }
                    deferred.resolve(t);
                }).fail(function (data, status) {
                    deferred.reject(data);
                })
        });

        return deferred.promise();
    }
    factory.userInGroups = function (url, userId, groups) {
        var deferred = jQuery.Deferred();
        var t = false;
        var arrGroups = groups.split(';');
        baseSvc.getListFilter(url, "Gruppi", "")
            .then(function (data) {

                for (var i = 0; i < arrGroups.length; i++) {
                    t = commonSvc.arrayContiene(data.data.d.results, arrGroups[i])
                }
                deferred.resolve(t);

            },function (data) {


                deferred.reject(data);

            })

        return deferred.promise();
    }

    factory.ensureUser = function (w, loginName) {
        var payload = { 'logonName': loginName };
        return $http({
            url: w + "/_api/web/ensureuser",
            method: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(payload),
            headers: {
                "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                "accept": "application/json;odata=verbose",
                "Content-Type": "application/json; odata=verbose"
            }
        });
    }

    factory.getUsersFromGroup = function (w, g) {
        var request = $http({
            url: w + "/_api/web/sitegroups/getByName('" + g + "')/Users",
            method: "GET",
            headers: factory.headers
        });
        return request;
    }


    factory.getUserGroups = function (w, i, d) {
        return $http({
            url: w + "/_api/web/GetUserById(" + i + ")/Groups",
            type: "GET",
            headers: { "Accept": "application/json; odata=verbose", "X-RequestDigest": d },
            dataType: "json"
        });

    }

    factory.addUserToGroup = function (w, g, u) {
        return baseSvc.getDigest(w).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue;

            return $http({
                url: w + "/_api/web/sitegroups/getByName('" + g + "')/users",
                method: "POST",
                data: JSON.stringify({ '__metadata': { 'type': 'SP.User' }, 'LoginName': u }),
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "Content-Type": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                }
            });
        });
    }

    factory.removeUserFromGroup = function (w, g, u) {
        return baseSvc.getDigest(w).then(function (data) {
            var digest = data.data.d.GetContextWebInformation.FormDigestValue;
            return $http({
                url: w + "/_api/web/sitegroups/getByName('" + g + "')/users/removebyid(" + u + ")",
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "Content-Type": "application/json; odata=verbose",
                    "X-RequestDigest": digest
                }
            });
        });
    }

    factory.getUpsCurrentUser = function (w, filter) {
        return baseSvc.getRestFilter(w + "/_api/SP.UserProfiles.PeopleManager/GetMyProperties", filter)
    };
    factory.getUpsCurrentUserObj = function (w, filter) {
        var deferred = $q.defer();
        factory.getUpsCurrentUser(w, filter)
            .then(function (data) {
                var temp = data.data.d;
                $.each(temp.UserProfileProperties.results, function (index, result) {
                    temp[result.Key] = result.Value
                });

                deferred.resolve(temp);
            },
            function (error) {
                // Non esiste, creiamolo
                console.log(error)
                deferred.reject(error);
            });

        return deferred.promise;
    };

    return factory;
}])
angular.module("mb.angular").factory("adUserSvc", ['commonSvc', 'baseSvc', '$q', '$http', function (commonSvc, baseSvc, $q, $http) {

    var factory = {};
    factory.webApiOrgUrl = "http://itdgtosax000045fe.idg.audi.vwg:81/organization";
    factory.getADGroups = function (ut) {
        return baseSvc.getRest(factory.webApiOrgUrl + "/api/usersUtility/?id=" + ut)
    }
    factory.isUserMember = function (ut, gr) {
        var deferred = jQuery.Deferred();
        factory.getADGroups(ut).then(function (data) {
            var match = false;
            for (var i = 0; i < data.length; i++) {

                if (data[i] === gr) {
                    match = true;
                }

            }
            if (match) {
                deferred.resolve(data);
            } else {
                deferred.reject(err);
            }
        });
        return deferred.promise();
    }
    return factory;
}])
angular.module("mb.angular").factory("webSvc", ['baseSvc', '$q', '$http', 'commonSvc', function (baseSvc, $q, $http, commonSvc) {

    var factory = {};
    factory.headers = { "accept": "application/json;odata=verbose" };

    factory.getWebProperty = function (w, p) {
        return $http({
            url: w + "/_api/web/AllProperties?select='" + p + "'",
            method: "GET",
            headers: {
                "Accept": "application/json; odata=verbose",
            }
        });
    }
    factory.setWebPropertyRest = function (web, property, value) {
        return baseSvc.getDigest(web).then(function (data) {
            return $.ajax({
                url: web + "/_api/web",
                type: "POST",
                data: '{ "__metadata": { "type": "SP.Web" }, "' + property + '": "' + value + '" }',
                headers: {
                    "X-RequestDigest": data.data.d.GetContextWebInformation.FormDigestValue,
                    "accept": "application/json;odata=verbose",
                    "content-type": "application/json;odata=verbose",
                    "X-HTTP-Method": "MERGE"
                }
            });
        });
    };

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

    return factory;
}])
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
            .then(function (data) {
                ctrl.follow = data.d.Followed.results;
            },function (error) {
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


angular.module("mb.angular.components", ['mb.angular', 'mb.angular.templates'])

angular.module("mb.angular.components").directive('showOnHover', function () {
    return {
        restrict: 'AE',
        link: function (scope, element, attrs) {
            var elemento = attrs.elemento;
            if (!elemento) { elemento = 'div' }
            element.hide();
            element.closest(elemento).bind('mouseenter', function () {
                element.show();
            });
            element.closest(elemento).bind('mouseleave', function () {
                element.hide();
            });
        }
    };
})
angular.module("mb.angular.components").directive('showOnRowHover', function () {
    return {
        restrict: 'AE',
        link: function (scope, element, attrs) {

            element.closest('tr').bind('mouseenter', function () {
                element.show();
            });
            element.closest('tr').bind('mouseleave', function () {
                element.hide();
            });
        }
    };
})
//angular.module("mb.angular.components").directive('editPanelWeb', function () {
//    return {
//        restrict: 'AE',
//        template: '<span ng-transclude ng-if="$ctrl.permission"></span><div ng-if="$ctrl.error">{{ $ctrl.errorMessage }}</div>',
//        transclude: true,
//        controllerAs: '$ctrl',
//        scope: {
//            perm: '@',
//            user: '@'
//        },
//        controller: function (permSvc, logSvc) {
//            var ctrl = this;
//            debugger
//            ctrl.permission = false;
//            ctrl.$onInit = function (changesObj) {
//                permSvc.chekPermissionOnWeb(_spPageContextInfo.webAbsoluteUrl, mb.sp.user.LoginName, ctrl.perm)
//                    .then(function (value) {
//                        ctrl.permission = value
//                    }, function (err) {
//                        logSvc.logError(_spPageContextInfo.webAbsoluteUrl, 'Component - EditPanel', err, '', true, false)
//                    })
//            }
//        }
//    };
//})
//angular.module("space.app").component('editPanel', {
//    // Use: <edit-panel obj="mod.item" list="Announcements" perm="editListItems"></edit-panel>
//    template: '<span ng-transclude ng-if="$ctrl.permission"></span><div ng-if="$ctrl.error">{{ $ctrl.errorMessage }}</div>',
//    transclude: true,
//    bindings: {
//        obj: '<',
//        list: '@',
//        perm: '@'
//    },
//    controller: function (permSvc, logSvc) {
//        var ctrl = this;
//        ctrl.permission = false;
//        ctrl.$onChanges = function (changesObj) {
//            if (changesObj.obj.currentValue !== undefined) {

//                permSvc.chekPermissionOnList(_spPageContextInfo.webAbsoluteUrl, ctrl.list, mb.sp.user.LoginName, ctrl.perm)
//                    .then(function (value) {
//                        ctrl.permission = value
//                    }, function (err) {
//                        logSvc.logError(_spPageContextInfo.webAbsoluteUrl, 'Component - EditPanel', err, '', true, false)
//                    })
//            }
//        }
//    }

//});
angular.module('mb.angular.templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('Bookmark/Bookmarks.html','<div class="mcl-add-bookmark pull-right">\r\n    <a href="#" class="togglable-icon-bookmark" ng-show="$ctrl.isFollow" ng-click="$ctrl.follow(false)">\r\n        <span class="mcl-glyphicons-icon mcl-icon-add-bookmark togglable-icon mcl-full-icon"></span>\r\n        <span class="mcl-bookmark-txt">remove bookmark</span>\r\n    </a>\r\n    <a href="#" class="togglable-icon-bookmark" ng-show="!$ctrl.isFollow" ng-click="$ctrl.follow(true)">\r\n        <span class="mcl-glyphicons-icon mcl-icon-add-bookmark togglable-icon"></span>\r\n        <span class="mcl-bookmark-txt">add bookmark</span>\r\n    </a>\r\n</div>');
$templateCache.put('Like/Like.html','<span class="mcl-action">\r\n    <span ng-if="$ctrl.isLike" ng-click="$ctrl.like(0)" class="pointer">\r\n        <i class="mcl-glyphicons-icon mcl-icon-like mcl-full-icon"></i>\r\n        Unlike\r\n    </span>\r\n    <span ng-if="!$ctrl.isLike" ng-click="$ctrl.like(1)" class="pointer">\r\n        <i class="mcl-glyphicons-icon mcl-icon-like"></i>\r\n        Like\r\n    </span>\r\n    ({{ $ctrl.obj.LikesCount }})\r\n</span>  ');
$templateCache.put('UserBadge/userBadge.html','<span class="mcl-action">\r\n    <span ng-if="$ctrl.isLike" ng-click="$ctrl.like(0)" class="pointer">\r\n        <i class="mcl-glyphicons-icon mcl-icon-like mcl-full-icon"></i>\r\n        Unlike\r\n    </span>\r\n    <span ng-if="!$ctrl.isLike" ng-click="$ctrl.like(1)" class="pointer">\r\n        <i class="mcl-glyphicons-icon mcl-icon-like"></i>\r\n        Like\r\n    </span>\r\n    ({{ $ctrl.obj.LikesCount }})\r\n</span>  ');}]);