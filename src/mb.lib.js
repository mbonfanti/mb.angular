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
