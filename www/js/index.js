/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var smartAlert = function(str) {
    document.getElementById("alert").innerHTML = str;
}

$(document).on("mobileinit", function() {
    $.mobile.loading.prototype.options.disabled = true;
})

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('mobileinit', this.onMobileInit, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        //app.receivedEvent('deviceready');
        init();
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:none;');
    },

    onMobileInit: function() {
        initMobile();
    }
};

var initMobile = function() {
    $.extend($.mobile, {
        loadingMessage: false
    });
}


var renderBar = function(bar) {
    //bar.name, bar.distance, bar.capacity, bar.occupants, bar.address, bar.coverfee, bar.genderpercent, bar.img
    $("#barname").html(bar.name);

    $("#barcapacity").html(bar.capacity + "%");
    $("#bargenderpercent").html(bar.genderpercent + "% Male");
    $("#barcoverfee").html("$" + bar.coverfee);

    $("#bartext").html(bar.description);

    if(bar.img == 1) {
        $("#imageholder").removeClass("bgcold");
        $("#imageholder").addClass("bgfire");
    } else {
        $("#imageholder").removeClass("bgfire");
        $("#imageholder").addClass("bgcold");
    }
}
var renderLoading = function() {
    $("#barname").html("Loading...");

    $("#barcapacity").html("Loading...");
    $("#bargenderpercent").html("Loading...");
    $("#barcoverfee").html("Loading...");
}

var renderBars = function(json) {
    var i;
    var str = "";
    for(i = 0; i < json.results.length; i++) {
        renderBar(json.results[i]);
    }
    //smartAlert(str);
    //$("#bars").html(str);
}

var getPosition = function(cb, err) {
    if(window.navigator.geolocation) {
        //smartAlert("Navigation supported");
        window.navigator.geolocation.getCurrentPosition(cb, function() {cb({coords: {}})}, {timeout: 1000});
    } else {
        //smartAlert("Navigation not supported.");
    }
}

var initBarSlides = function(lat, lon, id) {
    //smartAlert("Slides initiated");

    var y = 0;
    var deltay = 0;
    var ready = true;
    var up = false;

    var touchmoveFunc = function(e) {
        e.preventDefault();
        var touch = e.touches[0];
        //smartAlert(touch.pageY - y);
        deltay += touch.pageY - y;
        //smartAlert(deltay);
        //$("#bottommsg").css("bottom", (-1*deltay < 0 ? 0 : -1*deltay) + "px");
        $("#barinfo").css("top", "calc(100% - " + (-1*deltay < 0 ? 0 : -1*deltay) + "px)");
        y = touch.pageY;
    }

    document.addEventListener("touchstart", function(e) {
        y = e.touches[0].pageY;
        deltay = 0;

        if(ready) {
            if(up) {
                up = false;
                ready = false;
                $("#barinfo").addClass("transitionfast");
                $("#barinfo").css("top", "100%");

                setTimeout(function() {
                   /// $("#bottommsg").removeClass("transitionfast");
                   //$("#bottommsg").css("bottom", "0px");
                    $("#barinfo").removeClass("transitionfast");
                    ready = true;
                }, 200)
            } else {
                document.addEventListener('touchmove', touchmoveFunc);
            }
        }
    })

    document.addEventListener('touchend', function(e) {
        ready = false;
        document.removeEventListener('touchmove', touchmoveFunc);

        if(deltay*-1 > 100) {
            renderLoading();
            //$("#bottommsg").addClass("transition");
           // $("#bottommsg").css("bottom", "100%");

            $("#barinfo").addClass("transition");
            $("#barinfo").css("top", "0px");
            //$("#flasher").show();
            //$("#barpage").fadeTo(800,0);

            if(lat && lon) {
                $.get("http://barapptest.herokuapp.com/bars?" + ["lat="+lat,"lon="+lon,"facebooktoken="+id].join("&"), function(data) {
                    renderBars(data);
                })
            } else {
                $.get("http://barapptest.herokuapp.com/bars", function(data) {
                    renderBars(data);
                })
            }

            $.post("http://barapptest.herokuapp.com/touch", JSON.stringify({facebookid: id}), function(data) {
            })

            setTimeout(function() {
                //$("#flasher").hide();
                $("#barpage").fadeTo(200,1);
            }, 200)

            setTimeout(function() {
                //$("#bottommsg").removeClass("transition");
                //$("#bottommsg").css("bottom", "0px");

                $("#barinfo").removeClass("transition");
                ready = true;
                up = true;
            }, 1000)
        } else {
           // $("#bottommsg").addClass("transitionfast");
           // $("#bottommsg").css("bottom", "0px");

            $("#barinfo").addClass("transitionfast");
            $("#barinfo").css("top", "100%");

            setTimeout(function() {
               /// $("#bottommsg").removeClass("transitionfast");
               //$("#bottommsg").css("bottom", "0px");
                $("#barinfo").removeClass("transitionfast");
                ready = true;
            }, 200)
        }
    })
}

var initBars = function(data) {
    $(".login").hide();
    $("#loginpage").hide();
    $("#barinfo").show();
    $("#barpage").show();
    //openFB.api({path: '/me', success: function(data) {
    getPosition(function(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        var id = data.id;

        if(lat && lon) {
            $.get("http://barapptest.herokuapp.com/bars?" + ["lat="+lat,"lon="+lon,"facebooktoken="+id].join("&"), function(data) {
                renderBars(data);
                initBarSlides(lat, lon, id);
            })
        } else {
            $.get("http://barapptest.herokuapp.com/bars", function(data) {
                renderBars(data);
                initBarSlides(lat, lon, id);
            })
        }
    });
}

var doFBLogin = function(cb) {
    facebookConnectPlugin.login(["email", "user_friends"], cb, function(error) {
        smartAlert("" + error);
    });
    /*
    openFB.login(function(response) {
        cb(response);
    }, {scope: 'email,user_friends'});*/
}

var ping = function(params, cb) {
    $.post("http://barapptest.herokuapp.com/ping", params, cb);
}

var startBackgroundGeo = function(facebookid) {
    var bgGeo = window.plugins.backgroundGeoLocation;
    var ajaxCallback = function(resp) { bgGeo.finish(); };
    var callbackFn = function(location) {
        ping({facebookid: facebookid, lat: location.latitude, lon: location.longitude}, ajaxCallback);
    };

    var failureFn = function(error) {
        console.log('BackgroundGeoLocation error');
    }

    bgGeo.configure(callbackFn, failureFn, {
        url: 'http://barapptest.herokuapp.com/ping', // <-- Android ONLY:  your server url to send locations to
        params: {
            facebookid: facebookid  //  <-- Android ONLY:  HTTP POST params sent to your server when persisting locations.
        },
        desiredAccuracy: 10,
        stationaryRadius: 20,
        distanceFilter: 30,
        notificationTitle: 'Nacht BG Tracking', // <-- android only, customize the title of the notification
        notificationText: 'Nacht is sending our scouts out to bars now', // <-- android only, customize the text of the notification
        activityType: 'OtherNavigation',
        debug: false, // <-- enable this hear sounds for background-geolocation life-cycle.
        stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
    });

    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
    bgGeo.start();
}

//also starts background service
var initPing = function(data) {
    ///openFB.api({path: '/me', success: function(data) {
    getPosition(function(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        var gender = data.gender;
        var age = data.age || -1;
        var name = data.name;
        var facebooktoken = "unused";//window.localStorage['fbtoken'];
        var facebookid = data.id;

        ping(JSON.stringify({lat: lat, lon: lon, gender: gender,
              age: age, name: name, facebooktoken: facebooktoken, facebookid: facebookid}));

        startBackgroundGeo(facebookid);
    });
}

var initApp = function() {
    facebookConnectPlugin.api("/me", null, function(response) {
        initPing(response);
        initBars(response);
    })
}

var init = function() {
    document.addEventListener('touchmove', function(e) { e.preventDefault(); });

    facebookConnectPlugin.getLoginStatus(function(status) {
        if(status.status === "connected") {
            $("#loginpage").hide();
            initApp();
        } else {
            $(".login").show();
            $("#fblogin").click(function() {
                doFBLogin(function(response) {
                    smartAlert(JSON.stringify(response));
                    if(response.status === "connected") {
                        initApp();
                    } else {
                        //uhhhhhhhhhhhhhhhhh
                    }
                })
            })
        }
    })

    /*openFB.init({appId: '789010644529178', tokenStore: window.localStorage});
    openFB.getLoginStatus(function(status) {
        smartAlert(status.status);
        if(status.status === "connected") {
            $("#loginpage").hide();
            initPing();
            initBars();
        } else {
            $(".login").show();
            $("#fblogin").click(function() {
                doFBLogin(function(response) {
                    if(response.status === "connected") {
                        initPing();
                        initBars();
                    } else {
                        //uhhhhhhhhhhhhhhhhh
                    }
                })
            })
        }
    })*/
}