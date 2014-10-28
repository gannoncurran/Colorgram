var Colorgram = {}

Colorgram.Map = (function() {

	return {
		
		init: function() {
			console.log("map init fired")
		}

	}
	
})()

Colorgram.Comm = (function() {

	return {
		getRecents: function() {
			console.log("get recents via ajax from server fired")
		}
	}
	
})()

Colorgram.Model = (function() {
	var colorgrams = [{name: "testgram", id: "000", hue: "000", sat: "50%", lum: "50%", loc: {lat: 000, lng: 000}, place: {name: "Place Name", lat: 000, lng: 000}, popularity: 0}]

	return {

		add: function (colorgram) {
			colorgrams.push(colorgram)
			return colorgrams
		},

		allColorgrams: function (){
			console.log("allColorgrams fired")
			return colorgrams
		}

	}

})()

Colorgram.View = (function() {

	var $win,
			$header,
			$ctrlPicker,
			$ctrlRecents,
			$ctrlMap,
			$ctrlLum,
			$ctrlSat,
			pressInterval,
			clickTimeout,
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
		form: {name: "form", mountPoint: "#color-form"},
		recents: {name: "recents", mountPoint: "#recents-grid"},
		map: {name: "map", mountPoint: "#map-container"}
	}

	var controlBarStates = {
		picker: {picker: false, recents: true, map: true, sat: true, lum: true },
		form: {picker: false, recents: true, map: true, sat: false, lum: false },
		recents: {picker: true, recents: false, map: true, sat: false, lum: false },
		map: {picker: true, recents: true, map: false, sat: false, lum: false }
	}

	var headerStates = {
		picker: {class: "picker", subtitle: "What color are you feeling today?"},
		form: {class: "submit", subtitle: "HSL: " + currentColorPick.hue + ", " + currentColorPick.sat + "%, " + currentColorPick.lum + "%"},
		recents: {class: "recents", subtitle: "Here are the latest." },
		map: {class: "color-map", subtitle: "Color by place and popularity."}
	}

	var listeners = [
		{
			id: "#button-picker",
			browserEvent: "click",
			fn: function(e) {
				console.log("color picker button clicked")
			}
		},
		{
			id: "#button-recents",
			browserEvent: "click",
			fn: function(e) {
				console.log("recents button clicked")
			}
		},
		{
			id: "#button-map",
			browserEvent: "click",
			fn: function(e) {
				console.log("map button clicked")
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
					console.log('select was clicked')
					currentColorPick.hue = baseColorBar.data("hue")
					currentColorPick.sat = pickerSat
					currentColorPick.lum = pickerLum
					setViewMode.form()
				} else if (classes.indexOf("return") > -1) {
					console.log('return was clicked')
					collapseColorBarsDetail(baseColorBar.data("base"))
				} else if (classes.indexOf("expand") > -1) {
					console.log('expand was clicked')
					expandColorBars(baseColorBar)
				}
			}
		},
		{
			id: $(window),
			browserEvent: "scroll",
			fn: function(e) {
				rotateColorbars()
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
		$ctrlPicker = $("#ctrl-picker")
		$ctrlRecents = $("#ctrl-recents")
		$ctrlMap = $("#ctrl-map")
		$ctrlLum = $("#ctrl-lum")
		$ctrlSat = $("#ctrl-sat")
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

		var setBackgroundColor = function(mode) {
			if (mode === "form") {
				var hue = currentColorPick.hue
				var sat = currentColorPick.sat
				var lum = currentColorPick.lum
				$('html').css("background-color", generateBGColor(hue, sat, lum))
			} else {
				$('html').css("background-color", "#000000")
			}
		}

		var setHeaderState = function(mode){
			$header.removeClass().addClass(headerStates[mode].class)
		}

		var setControlBarStates = function(mode) {
			$ctrlPicker.fadeOut(500)
			$ctrlRecents.fadeOut(500)
			$ctrlMap.fadeOut(500)
			$ctrlLum.fadeOut(500)
			$ctrlSat.fadeOut(500)
			if (controlBarStates[mode].picker) $ctrlPicker.fadeIn(0)
			if (controlBarStates[mode].recents) $ctrlRecents.fadeIn(0)
			if (controlBarStates[mode].map) $ctrlMap.fadeIn(0)
			if (controlBarStates[mode].sat) $ctrlLum.fadeIn(0)
			if (controlBarStates[mode].lum) $ctrlSat.fadeIn(0)
		}

		var showComponent = function(component) {
			setControlBarStates(component)
			setBackgroundColor(component)
			$header.fadeOut(500, function() {			
				setHeaderState(component)
				$header.fadeIn(0)
			})
			for (var comp in viewComponents) {
				if (viewComponents.hasOwnProperty(comp)) {
					if (viewComponents[comp].name === component) {
						$(viewComponents[comp].mountPoint).removeClass()
					} else {
						$(viewComponents[comp].mountPoint).fadeOut(500)
					}
				}
			}
		}

		return {
			picker: 	function() { showComponent("picker") },
			form: 		function() { showComponent("form") },
			recents: 	function() { showComponent("recents") },
			map: 			function() { showComponent("map")	}
		}

	})()

	var	updateMobileViewStatus = function() {
		var currentMobileStatus = mobileView
		if ($win.width() < 767) {
			mobileView = true
		} else {
			mobileView = false
		}
		if (currentMobileStatus !== mobileView && mobileView) renderBaseColorbars()
	}

	var renderBaseColorbars = function() {
		var sat = 50
		var lum = 50
		var bar
		var fadeDelay = 0
		$(".color-bar").remove()
		for (var hue = 0; hue < 360; hue += cbBaseInterval) {
			bar = $(Templates.colorBar)
			$(bar).css("background-color", "hsl(" + hue + "," + sat + "%," + lum + "%)")
			$(bar).attr("data-hue", hue)
			$(bar).hide().appendTo("#color-bars").delay(fadeDelay).fadeIn(500)
			fadeDelay += 75
		}
	}

	var rotateColorbars = function() {
		var currentWinTop = $win.scrollTop()
		var $bodyHeight = $("html").height()
		if (!mobileView && $win.height() < $bodyHeight && currentWinTop <= 0) {
			var $lastBar = $(".color-bar").last()
			$("#color-bars").prepend($lastBar)
			$win.scrollTop(currentWinTop + $lastBar.height())
		} else if (!mobileView && $win.height() < $bodyHeight && ($win.height() + currentWinTop >= $bodyHeight)) {
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

	console.log("Initializing google map and places autocomplete")
	Colorgram.Map.init()

	console.log("Fetching recent colorgrams from server")
	Colorgram.Comm.getRecents()

	console.log("Initializing view")
	Colorgram.View.init()

	// console.log("Testing colorgram model")
	// var grams = Colorgram.Model.allColorgrams()
	// console.log(grams)
}



// var grayMapTheme = [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]}]




