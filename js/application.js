var Colorgram = {}

Colorgram.Map = (function() {

	var $mapContainer, map, $pacInput, pac, bounds, pins = [], mapCreated = false

	var grayMapTheme = [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]}]

	var mapOptions = {
	  mapTypeId: google.maps.MapTypeId.ROADMAP,
		zoom: 5,
		center: {lat: 37.6, lng: -95.6},
		mapTypeControl: false,
		panControl: false,
		zoomControl: true,
		zoomControlOptions: {
	    style: google.maps.ZoomControlStyle.SMALL
	  },
	  streetViewControl: false,
	  styles: grayMapTheme
	}

	var setPins = function(colorgrams) {
		var pin
		var pinBounds = new google.maps.LatLngBounds();
		var maxPins = 100
		for (var i = colorgrams.length-1; i > -1; i --) {
			var cg = colorgrams[i]
			var scaleFactor = 30 + ((maxPins) * .5)
			maxPins--
			var browserWidth = $(window).width()
			var latlng = new google.maps.LatLng(cg.loc.lat, cg.loc.lng)
			var markerOptions = {
				icon: {
		      path: google.maps.SymbolPath.CIRCLE,
		      scale: (browserWidth * .0006) * scaleFactor,
		      strokeColor: "#FFFFFF",
		      strokeWeight: 0,
		      fillColor: "hsl(" + cg.hue + "," + cg.sat + "%," + cg.lum + "%)",
		      fillOpacity: .8,
		    },
				position: {lat: cg.loc.lat, lng: cg.loc.lng},
				map: map,
				draggable: true,
				title: cg.name
			}
			pin = new google.maps.Marker(markerOptions)
	    pins.push(pin)
	    pinBounds.extend(latlng)
		}
	  bounds = pinBounds
	  map.fitBounds(bounds)
	  pinBounds = []
	}

	var clearPins = function() {
  	pins.forEach(function(pin) {pin.setMap(null)})
		pins = []
	}

	var sizeMapContainer = function() {
		$("#map-container").height($(window).height() - $("header").height())
	}

	return {

  	renderMap: function() {
				sizeMapContainer()
				if (!mapCreated) {
					$mapContainer = $("#map-container")
				  map = new google.maps.Map($mapContainer[0], mapOptions)
					mapCreated = true
				}
				google.maps.event.trigger(map, 'resize')
				clearPins()
				setPins(Colorgram.Model.all())
	  },

  	initPac: function() {
		  $pacInput = $("#colorgram-place-field")
		  pac = new google.maps.places.SearchBox($pacInput[0])
		  google.maps.event.addListener(pac, 'places_changed', function() {
		  	var lat = pac.getPlaces()[0].geometry.location.k
		  	var lng = pac.getPlaces()[0].geometry.location.B
		  	Colorgram.View.setLatLng(lat, lng)
		  })
	  }

	}
	
})()

Colorgram.Comm = (function() {

	var colorgramDB

	var configDB = function() {
		var dbOptions = {
			apiVersion: '2012-08-10',
			sslEnabled: true,
			endpoint: 'https://dynamodb.us-west-2.amazonaws.com',
		}

		AWS.config.update({accessKeyId: Colorgram.Access.k, secretAccessKey: Colorgram.Access.s})
		AWS.config.region = 'us-west-2'
		colorgramDB = new AWS.DynamoDB(dbOptions);
	}

	var cgReadAll = function() {
		var getRecent = {
			ConsistentRead: true,
	    TableName: 'Colorgrams',
	    KeyConditions: {
	    	'userId': {
	    		AttributeValueList: [{'N':'0'}],
	    		ComparisonOperator: 'EQ'
	    	},
	    },
	    Limit: '100'
		}
		colorgramDB.query(getRecent, function(err, data) {
			if (err) {	
				console.log(err, err.stack)
			} else {
				Colorgram.Model.add(parseResponse(data.Items))
			}			
		})
	}

	var parseResponse = function(r) {
		var cleanGrams = []
		for (var i in r) {
			var parsedCg = {
				userId: Number(r[i].userId.N),
				cgTimestamp: Number(r[i].cgTimestamp.N),
				name: r[i].name.S, 
				hue: Number(r[i].hue.N), 
				sat: Number(r[i].sat.N), 
				lum: Number(r[i].lum.N), 
				loc: {lat: Number(r[i].loc.M.lat.N), lng: Number(r[i].loc.M.lng.N)}, 
				place: {name: r[i].place.M.name.S}, 
				when: {date: r[i].when.M.date.S, time: r[i].when.M.time.S},
				popularity: Number(r[i].popularity.N)
			}
			cleanGrams.push(parsedCg)
		}
		return cleanGrams
	}

	var cgCreate = function(cg) {
		var newCG = {
	    TableName: 'Colorgrams',
	    Item: {
	    	'userId': {'N': '0'}, 
	    	'cgTimestamp': {'N': ''+cg.cgTimestamp},
	    	'name': {'S': ''+cg.name},
	    	'hue': {'N': ''+cg.hue},
	    	'sat': {'N': ''+cg.sat},
	    	'lum': {'N': ''+cg.lum},
	    	'loc': {
	    		'M': {
	    			'lat': {'N': ''+cg.loc.lat},
	    			'lng': {'N': ''+cg.loc.lng}
	    		}
	    	},
	    	'place': {
	    		'M': {
	    			'name': {'S': ''+cg.place.name}
	    		}
	    	},
	    	'when': {
	    		'M': {
	    			'date': {'S': ''+cg.when.date},
	    			'time': {'S': ''+cg.when.time}
	    		}
	    	},
	    	'popularity': {'N': ''+cg.popularity}
	    },
	  }
		colorgramDB.putItem(newCG, function(err, data) {
		    if (err)    console.log(err, err.stack)
		})
	}

	return {

		init: function() {
			configDB()
		},

		getRecents: function() {
			cgReadAll()
		},

		postNew: function (colorgram) {
			cgCreate(colorgram)
		}

	}
	
})()

Colorgram.Geo = (function() {

	var reverseGeocode = function(lat, lng) {
		var key = "AIzaSyCwoBQLdXCBaGaZ-JUj4efqMvlmhoerIAs"
		var resultTypes = "natural_feature&result_type=postal_code&result_type=neighborhood&location_type=APPROXIMATE"
		var baseURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng="

		var request = $.ajax({
		  url:      ""+baseURL+lat+","+lng+"&key="+key+"&result_type="+resultTypes, 
		  get:      "GET",
		  dataType: "json",
		  timeout:  8000,
		})

		request.done(function(ajaxResponse) {
		  if (ajaxResponse["status"] === "OK") {
		  	var place = selectPreferredPlace(ajaxResponse["results"])
		  	Colorgram.View.setPlace(place)
		  } else {
		  	Colorgram.View.setPlace("Lat: "+lat+", Lng:"+lng)
		  }

		})

		request.fail(function(ajaxResponse) {
	  	Colorgram.View.setPlace("You'll have to type ;(")
		})

	}

	var selectPreferredPlace = function(places) {

		if (places.length === 1) return places[0]["formatted_address"]

		var greatestPostalCodeIndex = -Infinity
		var leastNaturalFeatureIndex = Infinity

		for (var i = places.length -1; i > -1; i --) {
			if (places[i].types.indexOf('neighborhood') !== -1) return places[i]["formatted_address"]
			if (places[i].types.indexOf('postal_code') !== -1 && i > greatestPostalCodeIndex) greatestPostalCodeIndex = i
			if (places[i].types.indexOf('natural_feature') !== -1 && i < leastNaturalFeatureIndex) leastNaturalFeatureIndex = i 
		}

		if (greatestPostalCodeIndex !== -Infinity) {
			return places[greatestPostalCodeIndex]["formatted_address"]
		} else if (leastNaturalFeatureIndex !== Infinity) {
			return places[leastNaturalFeatureIndex]["formatted_address"]
		} else {
			return places[0]["formatted_address"]
		}

	}

	return {

		getPlace: function(lat, lng) {
			reverseGeocode(lat, lng)
		}

	}

})()

Colorgram.Model = (function() {
	var colorgrams = []

	return {

		add: function (cgArray) {
			cgArray.forEach(function(colorgram) {colorgrams.push(colorgram)})
		},

		all: function () {
			return colorgrams
		},

		latest: function() {
			return colorgrams[colorgrams.length-1]
		},

		count: function() {
			return colorgrams.length
		}

	}

})()

Colorgram.View = (function() {

	var $win,
			$header,
			$ctrlBar,
			$ctrlPicker,
			$ctrlRecents,
			$ctrlMap,
			$ctrlLum,
			$ctrlSat,
			pressInterval,
			clickTimeout,
			headerHeight,
			colorgramLat = 0,
			colorgramLng = 0,
			currentViewMode = "picker",
			infiniteScroll = true,
			mobileView = false,
			pickerSat = 50,
			pickerLum = 50,
			cbBaseInterval = 6

	var	currentColorPick = {
		hue: 0,
		sat: 50,
		lum: 50
	}

	var Templates = {}

	var viewComponents = {
		picker: {name: "picker", mountPoint: "#color-bars"},
		form: {name: "form", mountPoint: "#form-container"},
		recents: {name: "recents", mountPoint: "#recents-grid"},
		map: {name: "map", mountPoint: "#map-container"}
	}

	var controlBarStates = {
		picker: {picker: false, recents: true, map: true, sat: true, lum: true },
		form: {picker: true, recents: true, map: true, sat: false, lum: false },
		recents: {picker: true, recents: false, map: true, sat: false, lum: false },
		map: {picker: true, recents: true, map: false, sat: false, lum: false }
	}

	var headerStates = {
		picker: {class: "picker", subtitle: "What color are you feeling today?"},
		form: {class: "submit", subtitle: function() {
			return "HSL: " + currentColorPick.hue + ", " + currentColorPick.sat + "%, " + currentColorPick.lum + "%"}
		},
		recents: {class: "recents", subtitle: "Here are the latest." },
		map: {class: "color-map", subtitle: "Recent colors by place."}
	}

	var listeners = [
		{
			id: ".control, .control-module",
			browserEvent: "mouseenter",
			fn: function(e) {
				if (!mobileView) toggleTooltips()
			}
		},
		{
			id: ".control, .control-module",
			browserEvent: "mouseleave",
			fn: function(e) {
				if (!mobileView) toggleTooltips()
			}
		},
		{
			id: "#button-picker",
			browserEvent: "click",
			fn: function(e) {
				setViewMode.picker()
			}
		},
		{
			id: "#button-recents",
			browserEvent: "click",
			fn: function(e) {
				setViewMode.recents()
			}
		},
		{
			id: "#button-map",
			browserEvent: "click",
			fn: function(e) {
				setViewMode.map()
			}
		},
		{
			id: "#button-about",
			browserEvent: "click",
			fn: function(e) {
				$("#about").hide().removeClass().fadeIn(250)
			}
		},
		{
			id: "#button-about-close",
			browserEvent: "click",
			fn: function(e) {
				$("#about").fadeOut(250).addClass("nodisplay").show()
			}
		},
		{
			id: "#button-brightup",
			browserEvent: "mousedown touchstart",
			fn: function(e) {
				e.preventDefault()
				adjustPickerSL(0,1)
				clickTimeout = window.setTimeout(function() { 
					pressInterval = window.setInterval(function() {
						adjustPickerSL(0,1)
					}, 20) 
				}, 500)
			}
		},
		{
			id: "#button-brightup",
			browserEvent: "mouseup touchend",
			fn: function(e) {
				e.preventDefault()
				window.clearTimeout(clickTimeout)
				window.clearInterval(pressInterval)
			}
		},
		{
			id: "#button-brightdn",
			browserEvent: "mousedown touchstart",
			fn: function(e) {
				e.preventDefault()
				adjustPickerSL(0,-1)
				clickTimeout = window.setTimeout(function() { 
					pressInterval = window.setInterval(function() {
						adjustPickerSL(0,-1)
					}, 20) 
				}, 500)
			}
		},
		{
			id: "#button-brightdn",
			browserEvent: "mouseup touchend",
			fn: function(e) {
				e.preventDefault()
				window.clearTimeout(clickTimeout)
				window.clearInterval(pressInterval)
			}
		},
		{
			id: "#button-satup",
			browserEvent: "mousedown touchstart",
			fn: function(e) {
				e.preventDefault()
				adjustPickerSL(1,0)
				clickTimeout = window.setTimeout(function() { 
					pressInterval = window.setInterval(function() {
						adjustPickerSL(1,0)
					}, 20) 
				}, 500)
			}
		},
		{
			id: "#button-satup",
			browserEvent: "mouseup touchend",
			fn: function(e) {
				e.preventDefault()
				window.clearTimeout(clickTimeout)
				window.clearInterval(pressInterval)
			}
		},
		{
			id: "#button-satdn",
			browserEvent: "mousedown touchstart",
			fn: function(e) {
				e.preventDefault()
				adjustPickerSL(-1,0)	
				clickTimeout = window.setTimeout(function() { 
					pressInterval = window.setInterval(function() {
						adjustPickerSL(-1,0)
					}, 20) 
				}, 500)
			}
		},
		{
			id: "#button-satdn",
			browserEvent: "mouseup touchend",
			fn: function(e) {
				e.preventDefault()
				window.clearTimeout(clickTimeout)
				window.clearInterval(pressInterval)
			}
		},
		{
			id: "#color-bars",
			browserEvent: "click",
			fn: function(e) {
				e.preventDefault()
				var ColorBar = $(e.target).parents(".color-bar").first()
				var classes = e.target.parentNode.className
				if (classes.indexOf("select") > -1) {
					currentColorPick.hue = ColorBar.data("hue")
					currentColorPick.sat = pickerSat
					currentColorPick.lum = pickerLum
					setViewMode.form()
				}
			}
		},
		{
			id: "#auto-locate",
			browserEvent: "mouseenter",
			fn: function(e) {
				if (!mobileView) $("#colorgram-place-field").prop("placeholder", "Locate Me!")
			}
		},
		{
			id: "#auto-locate",
			browserEvent: "mouseleave",
			fn: function(e) {
				if (!mobileView) $("#colorgram-place-field").prop("placeholder", "What's your city?")
			}
		},
		{
			id: "#auto-locate",
			browserEvent: "click",
			fn: function(e) {
				e.preventDefault()
				autoLocate()
			}
		},
		{
			id: "#colorgram-submit-button",
			browserEvent: "click",
			fn: function(e) {
				e.preventDefault()
				submitColorgram()
			}
		},
		{
			id: $(window),
			browserEvent: "scroll",
			fn: function(e) {
				var scroll = function() {return infinteScroll}
				if (scroll) rotateColorbars()
			}
		},
		{
			id: $(window),
			browserEvent: "resize",
			fn: function(e) {
				updateMobileViewStatus()
			}
		}
	]

	var attachDOMNodes = function() {
		$win = $(window)
		$header = $("#title-block")
		$viewModeWrapper = $("#view-mode-wrapper")
		$controlBar = $("#control-bar")
		$ctrlPicker = $("#ctrl-picker")
		$ctrlRecents = $("#ctrl-recents")
		$ctrlMap = $("#ctrl-map")
		$ctrlLum = $("#ctrl-lum")
		$ctrlSat = $("#ctrl-sat")
		$fieldName = $("#colorgram-name-field")
		$fieldPlace = $("#colorgram-place-field")
		$fieldPlaceLocate = $("#auto-locate")
	}

	var bindListeners = function() {
		for (var i in listeners) {
			var listener = listeners[i]
			$(listener.id).on(listener.browserEvent, listener.fn)
		}
	}

	var getTemplates = function() {
		var colorBar 							= $('#color-bar-template')
		var recentsTile 					= $('#recents-tile-template')

		Templates.colorBar 				= $.trim(colorBar.html())
		Templates.recentsTile 	 	= $.trim(recentsTile.html())

		$(colorBar).remove()
		$(recentsTile).remove()
	}

	var generateBGColor = function(hue, sat, lum) {

		return "hsl(" + hue + "," + sat + "%," + lum + "%)"
	}

	var setViewMode = (function() {

		var clearForm = function() {
			$fieldName.val("")
			$fieldPlace.val("")
		}

		var setAutolocate = function() {
			(navigator.geolocation) ? $fieldPlaceLocate.show() : $fieldPlaceLocate.hide()
		}

		var setBackgroundColor = function(mode) {
			if (mode === "form") {
				var hue = currentColorPick.hue
				var sat = currentColorPick.sat
				var lum = currentColorPick.lum
				$('html').css("background-color", generateBGColor(hue, sat, lum))
			} else {
				$('html').css("background-color", "#111111")
			}
		}

		var setHeaderState = function(mode){
			$header.removeClass().addClass(headerStates[mode].class)
			$header.children(".subtitle").text(headerStates[mode].subtitle)
		}

		var setControlBarState = function(mode) {
			$ctrlPicker.hide()
			$ctrlRecents.hide()
			$ctrlMap.hide()
			$ctrlSat.hide()
			$ctrlLum.hide()
			if (controlBarStates[mode].picker) $ctrlPicker.show()
			if (controlBarStates[mode].recents) $ctrlRecents.show()
			if (controlBarStates[mode].map) $ctrlMap.show()
			if (controlBarStates[mode].sat) $ctrlSat.show()
			if (controlBarStates[mode].lum) $ctrlLum.show()
		}

		var setBodyState = function(mode) {
			for (var comp in viewComponents) {
				if (viewComponents.hasOwnProperty(comp)) {
					if (viewComponents[comp].name === mode) {
						$(viewComponents[comp].mountPoint).removeClass().show()
					} else {
						$(viewComponents[comp].mountPoint).removeClass().hide()
					}
				}
			}
		}

		var transitionView = function(component) {
			if (component === "form") {
				// if going to the form, setBG immediately
				setBackgroundColor(component)
			} else if (currentViewMode === "form" && component !== "picker") {
				// if we're on the form and NOT going to the picker
				// fade the background color to gray
				$('html').animate({backgroundColor: "#111111"}, 250)
			}
			$viewModeWrapper.fadeOut(250, function() {
				setBodyState(component)
				$viewModeWrapper.fadeIn(250, function() {
					// if we're back at the picker, reset the bg color to gray
					if (component === "picker") setBackgroundColor(component)
				})
			})
			$header.fadeOut(250, function() {
				setHeaderState(component)
				$header.fadeIn(250, function() {
					// map render depends on header size, so rendering map here
					if (component === "map") Colorgram.Map.renderMap()
				})
			})
			$controlBar.fadeOut(250, function() {
				setControlBarState(component)
				$controlBar.fadeIn(250)				
			})
			currentViewMode = component
		}

		return {
			picker: 	function() { 
									infiniteScroll = (mobileView) ? false : true
									transitionView("picker") 
								},
			form: 		function() { 
									infiniteScroll = false
									setAutolocate()
									clearForm()
									transitionView("form") 
								},
			recents: 	function() {
									infiniteScroll = false
									transitionView("recents")
									renderRecents()
								},
			map: 			function() { 
									infiniteScroll = false
									transitionView("map")
								}
		}

	})()

	var	updateMobileViewStatus = function() {
		var currentMobileStatus = mobileView
		if ($win.width() < 767) {
			infiniteScroll = false
			mobileView = true
		} else {
			infiniteScroll = (currentViewMode === "picker") ? true : false
			mobileView = false
		}
		if (currentMobileStatus !== mobileView && mobileView) {
			renderBaseColorbars()
		}
	}

	var toggleTooltips = function() {
		$controlBar.toggleClass("open")
	}

	var renderBaseColorbars = function() {
		var sat = pickerSat
		var lum = pickerLum
		var bar
		var fadeDelay = 0
		$(".color-bar").remove()
		for (var hue = 0; hue < 360; hue += cbBaseInterval) {
			bar = $(Templates.colorBar)
			$(bar).css("background-color", "hsl(" + hue + "," + sat + "%," + lum + "%)")
			$(bar).attr("data-hue", hue)
			$(bar).hide().appendTo(viewComponents.picker.mountPoint).delay(
				fadeDelay > 1000 ? 1000 : fadeDelay
				).fadeIn(500)
			fadeDelay += 100
		}
	}

	var rotateColorbars = function() {
		var currentWinTop = $win.scrollTop()
		var $bodyHeight = $("html").height()
		if (infiniteScroll && $win.height() < $bodyHeight && currentWinTop <= 0) {
			var $lastBar = $(".color-bar").last()
			$("#color-bars").prepend($lastBar)
			$win.scrollTop(currentWinTop + $lastBar.height())
		} else if (infiniteScroll && $win.height() < $bodyHeight && ($win.height() + currentWinTop >= $bodyHeight)) {
			var $firstBar = $(".color-bar").first()
			$("#color-bars").append($firstBar)
			$win.scrollTop(currentWinTop - $firstBar.height())
		}
	}

	var adjustPickerSL = function(satChange, lumChange) {
		if (satChange === 0 && lumChange === 0) return
		var newPickerSat = pickerSat + satChange
		var newPickerLum = pickerLum + lumChange
		if (newPickerSat >= 0 && newPickerSat <= 100) {
			pickerSat = newPickerSat
			$(".color-bar").each(function(i){
				var hue = this.dataset.hue
				this.dataset.sat = pickerSat
				$(this).css("background-color", "hsl(" + hue + "," + pickerSat + "%," + pickerLum + "%)")
			})
		}
		if (newPickerLum >= 0 && newPickerLum <= 100) {
			pickerLum = newPickerLum
			$(".color-bar").each(function(i){
				var hue = this.dataset.hue
				this.dataset.lum = pickerLum
				$(this).css("background-color", "hsl(" + hue + "," + pickerSat + "%," + pickerLum + "%)")
			})
		}
	}

	var submitColorgram = function() {
		var pacLat = colorgramLat
		var pacLng = colorgramLng
		var cgName = $("#colorgram-name-field").val()
		var cgPlace = $("#colorgram-place-field").val()
		var d = new Date()
		var cgPop = Math.random() * (7 - 1) + 1
		var cg = {
			userId: 0,
			cgTimestamp: d.getTime(),
			name: cgName, 
			hue: currentColorPick.hue, 
			sat: currentColorPick.sat, 
			lum: currentColorPick.lum, 
			loc: {lat: pacLat, lng: pacLng}, 
			place: {name: cgPlace}, 
			when: {date: d.toLocaleDateString(), time: d.toLocaleTimeString()},
			popularity: cgPop
		}
		Colorgram.Model.add([cg])
		Colorgram.Comm.postNew(cg)
		setViewMode.recents()
	}

	var renderRecents = function() {
		var colorgrams = Colorgram.Model.all()
		var fadeDelay = 0
		$(".tile").remove()
		for (var i = colorgrams.length-1; i > -1; i --) {
			var c = colorgrams[i]
			var tile = $(Templates.recentsTile)
			$(tile).css("background-color", generateBGColor(c.hue, c.sat, c.lum))
			$(tile).children(".color-name").text(c.name)
			if (c.lum < 50) $(tile).addClass("reverse")
			$(tile).children(".date").text(c.when.date)
			$(tile).children(".time").text(c.when.time)
			$(tile).children(".location").text(c.place.name)
			$(tile).children(".color-build").text("HSL: "+c.hue+", "+c.sat+"%, "+c.lum+"%")
			$(tile).hide().appendTo($(viewComponents.recents.mountPoint)).delay(
				(fadeDelay > 675) ? 675 : fadeDelay
				).fadeIn(500)
			fadeDelay += 75
		}	
	}

	var autoLocate = function() {
		var latLng
		var place
		if (navigator.geolocation) {

			$fieldPlace.prop("placeholder", "Getting Location...")
			$fieldPlaceLocate.off("mouseenter")
			$fieldPlaceLocate.off("mouseleave")

	    navigator.geolocation.getCurrentPosition(function(position) {

		    colorgramLat = position.coords.latitude
		    colorgramLng = position.coords.longitude

	    	Colorgram.Geo.getPlace(colorgramLat, colorgramLng)
	    	// $fieldPlace.val(place)

		    // $fieldPlaceLocate.on("mouseenter", function(e) {
		    // 	$fieldPlace.prop("placeholder", "Locate Me!")
		    // })
		    // $fieldPlaceLocate.on("mouseleave", function(e) {
		    // 	$fieldPlace.prop("placeholder", "What's your city?")
		    // })

	    },
	    function(error) {
				$fieldPlace.prop("placeholder", "You'll have to type ;(")
	    })
		} else { 
			$fieldPlace.prop("placeholder", "You'll have to type. :(")
		}
	}

	var setPlaceFieldValue = function(place) {
		$fieldPlace.prop("value", place)
		$fieldPlace.prop("placeholder", "What's your city?")

		$fieldPlaceLocate.on("mouseenter", function(e) {
			$fieldPlace.prop("placeholder", "Locate Me!")
		})
		$fieldPlaceLocate.on("mouseleave", function(e) {
			$fieldPlace.prop("placeholder", "What's your city?")
		})
	}

	$(document).ready(function() {
		Colorgram.initialize()
	});

	return {
		init: function() {
			attachDOMNodes()
			getTemplates()
			bindListeners()
			renderBaseColorbars()
			updateMobileViewStatus()
		},
		setPlace: function(place) {
			setPlaceFieldValue(place)
		},
		setLatLng: function(lat, lng) {
			colorgramLat = lat
			colorgramLng = lng
		}

	}
	
})()

Colorgram.initialize = function() {

	Colorgram.Comm.init()

	Colorgram.Comm.getRecents()

	Colorgram.View.init()

	Colorgram.Map.initPac()

}