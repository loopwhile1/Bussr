var BusStopFetcher = function (resultHandler) {
    return {
        ajaxObj: null,

        // get fetch url
        getStopUrl : function (lat, lng) {
            return '/ws/stops/' + lat + ',' + lng + '/';
        },

		// abort the pending ajax operation
        abortAjax : function() {
            if (this.ajaxObj) {
				this.ajaxObj.abort();
            }
        },

        getStopsForLatLng : function(lat, lng) {
            url = this.getStopUrl(lat, lng);
            this.abortAjax();
            this.ajaxObj = $.ajax({
                url: url,
                type: "GET",
                dataType: "json",
            });

            this.ajaxObj.done(function(msg) {
                if (resultHandler && resultHandler.stopFetcherGotStops) {
                    resultHandler.stopFetcherGotStops(msg["stops"]);
                }
            });

            this.ajaxObj.fail(function(jqXHR, textStatus) {
                // TODO: handle error
                console.log('ajax failed', jqXHR, textStatus);
            });
        },
    }
};


var earthQuakeMap = {
    map : null,
    markers : [],
    busStopFetcher : null,
	searchDelay : null,

    stopFetcherGotStops : function(stops) {
		this.clearAllMarkers();
        for (var j = 0; j < stops.length; j++) {
            stop = stops[j];
            this.addMarker(stop["lat"], stop["lng"]);
        }
    },
    
    searchAroundMapCenter : function () {
		this.searchForStopsAroundCenter(this.map.getCenter());
	},
    
    searchForStopsAroundCenter : function(center) {
		this.busStopFetcher.getStopsForLatLng(center.lat(), center.lng());
	},
	
	initializeGoogleMapHelper : function() {
		var initialMapCenter = new google.maps.LatLng(41.87811, -87.62980);
        var myOptions = {
            zoom: 15,
            center: initialMapCenter,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        this.map = new google.maps.Map(
                    document.getElementById('map_canvas'), 
                    myOptions
                   );
        var that = this;
		
        google.maps.event.addListener(this.map, 'bounds_changed', 
			function() {
				that.handleBoundsChanged();
			});	
			
		google.maps.event.addListener(this.map, 'dragstart', 
			function() {
				that.handleDragStart();
			});
	},

    initializeMap : function() {
		// Create the bus stop fetcher with ourselves as the delegate
		this.busStopFetcher = BusStopFetcher(earthQuakeMap);
		this.initializeGoogleMapHelper();
    },

	clearAllMarkers  : function() {
		if (this.markers) {
			for (var i = 0; i < this.markers.length; i++ ) {
				this.markers[i].setMap(null);
			}
		}
	},
	
	//+-----------------------------------------------------------
	// marker managing
	//------------------------------------------------------------
//    hideMarkers : function() {
//		for (var i = 0; i < this.markers.length; i++) {
//			if(this.markers[i].markerObj) {
//				this.markers[i].markerObj.setVisible(false);
//			}
//		}
//	},

	displayBubble : function(marker)
	{
		console.log(marker)
	},
	
    addMarker : function(lat, lng) {
		var that = this;
        position = new google.maps.LatLng(lat, lng);
        marker = new google.maps.Marker({
            position: position, 
            map: this.map,
            draggable: false
        });
		google.maps.event.addListener(marker, 'click', function() { 
	    	that.displayBubble(marker); 
	    });
		this.markers.push(marker);
        return this.markers[this.markers.length-1];
    },
	
	// Private methods
	// Abort the pending ajax fetch
	abortPendingFetch : function() {
		if(this.busStopFetcher) {
	        this.busStopFetcher.abortAjax();
	    }
	},
	
	//+-----------------------------------------------------------
	// event handlers
	//------------------------------------------------------------
	// Prevent overzealous firing
	handleBoundsChanged : function() {
		if (this.searchTimeout) {
			clearTimeout(this.searchTimeout);
		}	
		var that = this;
		this.searchTimeout = setTimeout(
								function() { that.searchAroundMapCenter(); },
								500);
	},
	
	// Handle the dragging of the map
	handleDragStart : function () {
		this.abortPendingFetch();
//		this.abortResultHandler();
//		this.hideMarkers();
//		this.hideBubble();
//		this.changeStatus( "Loading...", true );
	},
};

// When the document is ready initialize the map.
$(document).ready(function() {
    earthQuakeMap.initializeMap();
});