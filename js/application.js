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

		colorgrams.forEach(function(cg){
			var scaleFactor = Math.sqrt((cg.popularity + 1))
			var latlng = new google.maps.LatLng(cg.loc.lat, cg.loc.lng)
			var markerOptions = {
				icon: {
		      path: google.maps.SymbolPath.CIRCLE,
		      scale: 10 * scaleFactor,
		      strokeColor: "#444444",
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
		})

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
	  },

	  getPac: function() {
	  	return pac
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
		AWS.config.update({accessKeyId: 'AKIAIVW7GHJJMH2LCLQQ', secretAccessKey: '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'})
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
	    	'cgTimestamp': {
	    		AttributeValueList: [{'N':''+(Date.now()-86400000)}, {'N':''+Date.now()}],
	    		ComparisonOperator: 'BETWEEN'
	    	}
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
		    else        console.log(data)
		})
	}

	return {

		init: function() {
			configDB()
		},

		getRecents: function() {
			// console.log("get recents via ajax from server fired")
			cgReadAll()
		},

		postNew: function (colorgram) {
			// console.log("posting new colorgram to database")
			cgCreate(colorgram)
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
			currentViewMode = "picker",
			infiniteScroll = true,
			mobileView = false,
			pickerSat = 50,
			pickerLum = 50,
			cbBaseInterval = 20

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
				// infiniteScroll = true
				setViewMode.picker()
			}
		},
		{
			id: "#button-recents",
			browserEvent: "click",
			fn: function(e) {
				// infiniteScroll = false
				setViewMode.recents()
			}
		},
		{
			id: "#button-map",
			browserEvent: "click",
			fn: function(e) {
				// infiniteScroll = false
				setViewMode.map()
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
				var baseColorBar = $(e.target).parents(".color-bar").first()
				var classes = e.target.parentNode.className
				if (classes.indexOf("select") > -1) {
					currentColorPick.hue = baseColorBar.data("hue")
					currentColorPick.sat = pickerSat
					currentColorPick.lum = pickerLum
					setViewMode.form()
				} else if (classes.indexOf("return") > -1) {
					collapseColorBarsDetail(baseColorBar.data("base"))
				} else if (classes.indexOf("expand") > -1) {
					expandColorBars(baseColorBar)
				}
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
	}

	var bindListeners = function() {
		for (var i in listeners) {
			var listener = listeners[i]
			$(listener.id).on(listener.browserEvent, listener.fn)
		}
	}

	var getTemplates = function() {
		var colorBar 							= $('#color-bar-template')
		var colorBarDetail 				= $('#color-bar-detail-template')
		var recentsTile 					= $('#recents-tile-template')

		Templates.colorBar 				= $.trim(colorBar.html())
		Templates.colorBarDetail 	= $.trim(colorBarDetail.html())
		Templates.recentsTile 	 	= $.trim(recentsTile.html())

		$(colorBar).remove()
		$(colorBarDetail).remove()
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
			$(bar).hide().appendTo(viewComponents.picker.mountPoint).delay(fadeDelay).fadeIn(500)
			fadeDelay += 75
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

	var expandColorBars = function(baseColorBar) {
		var baseHue = $(baseColorBar).data("hue")
		var detailBar = $(Templates.colorBarDetail)
		var barHeight = $(".color-bar").first().height()
		var anchorIndex = $(baseColorBar).index() + 1

		$(detailBar).attr("data-hue", baseHue)
		$(detailBar).attr("data-base", baseHue)

		$(detailBar).css("background-color", "hsl(" + baseHue + "," + pickerSat + "%," + pickerLum + "%)")
		$(baseColorBar).replaceWith(detailBar)

		var $anchor = $("#color-bars .color-bar:nth-child("+anchorIndex+")")

		for (var hue = baseHue + cbBaseInterval - 1 ; hue > baseHue; hue --) {
			detailBar = $(Templates.colorBarDetail)
			$(detailBar).attr("data-hue", hue)
			$(detailBar).attr("data-base", baseHue)
			$(detailBar).css("background-color", "hsl(" + hue + "," + pickerSat + "%," + pickerLum + "%)")
			if (mobileView) {
				$(detailBar).insertAfter($anchor)
			} else {
				$(detailBar).height(0)
				$(detailBar).insertAfter($anchor).animate({height: barHeight}, 800)
			}
		}
	}

	var collapseColorBarsDetail = function (baseHue) {
		var $detailColorBars = $('[data-base="' + baseHue + '"]')
		var $baseColorBar = $detailColorBars.first()
		// TODO: USE BASEOFFSET BELOW TO CHECK FOR BAR POSITION EDGECASES THAT 
		// WILL BREAK COLLAPSE FUNCTIONALITY BECAUSE OF INFINITIE SCROLL
		// var	baseOffset =$baseColorBar.offset()
				$detailColorBars = $detailColorBars.not($baseColorBar)
		var $baseBar = $(Templates.colorBar)
		var scrollOffset = ($win.height() / 2) - ($baseColorBar.height() / 2)

		$baseBar.attr("data-hue", baseHue)
		$baseBar.css("background-color", "hsl(" + baseHue + "," + pickerSat + "%," + pickerLum + "%)")
		$baseColorBar.replaceWith($baseBar)

		if (mobileView) {
			$detailColorBars.remove()
			$win.scrollTo( $baseBar, 500, {axis: 'y', offset: -scrollOffset} )
		} else {
			$detailColorBars.animate({height: 0}, 500, function() {
				$detailColorBars.remove()
			})
			$win.scrollTo( $baseBar, 500, {axis: 'y', offset: -scrollOffset} )
		}
	}

	var submitColorgram = function() {
		var pacLat = Colorgram.Map.getPac().getPlaces()[0].geometry.location.k
		var pacLng = Colorgram.Map.getPac().getPlaces()[0].geometry.location.B
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
			// name, when.date, when.time, place.name, hue, sat, lum 
			var tile = $(Templates.recentsTile)
			$(tile).css("background-color", generateBGColor(c.hue, c.sat, c.lum))
			$(tile).children(".color-name").text(c.name)
			if (c.lum < 50) $(tile).addClass("reverse")
			$(tile).children(".datetime").text(c.when.date+" | "+c.when.time)
			$(tile).children(".location").text(c.place.name)
			$(tile).children(".color-build").text("HSL: "+c.hue+", "+c.sat+"%, "+c.lum+"%")
			$(tile).hide().appendTo($(viewComponents.recents.mountPoint)).delay(fadeDelay).fadeIn(500)
			fadeDelay += 75
		}	
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
		}
	}
	
})()

Colorgram.initialize = function() {

	// console.log("initializing AWS DynamoDB")
	Colorgram.Comm.init()

	// console.log("retrieving recent colorgrams from AWS DynamoDB")
	Colorgram.Comm.getRecents()

	// console.log("Initializing view")
	Colorgram.View.init()

	// console.log("Initializing pac")
	Colorgram.Map.initPac()

}