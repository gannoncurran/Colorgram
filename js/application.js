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

	var pressInterval,
			clickTimeout,
			mobileView = false,
			pickerSat = 50,
			pickerLum = 50

	var Templates = {}

	var $win = $(window)

	var viewComponents = {
		nav: "#control-bar",
		picker: "#color-bars",
		form: "#color-form",
		recents: "#recents-grid",
		map: "#map-container"
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
				} else if (classes.indexOf("return") > -1) {
					console.log('return was clicked')
					renderBaseColorbars()
				} else if (classes.indexOf("expand") > -1) {
					console.log('expand was clicked')
					expandColorBars(baseColorBar)
				}

			}
		},
		{
			id: $win,
			browserEvent: "scroll",
			fn: function(e) {
				rotateColorbars()
			}
		},
		{
			id: $win,
			browserEvent: "resize",
			fn: function(e) {
				updateMobileViewStatus()
			}
		}
	]

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

	var rotateColorbars = function() {
		var $currentWinTop = $win.scrollTop()
		var $bodyHeight = $("html").height()
		if (!mobileView && $win.height() < $bodyHeight && $currentWinTop <= 0) {
			var $lastBar = $(".color-bar").last()
			$("#color-bars").prepend($lastBar)
			$win.scrollTop($currentWinTop + $lastBar.height())
		} else if (!mobileView && $win.height() < $bodyHeight && ($win.height() + $currentWinTop >= $bodyHeight)) {
			var $firstBar = $(".color-bar").first()
			$("#color-bars").append($firstBar)
			$win.scrollTop($currentWinTop - $firstBar.height())
		}
	}

	var	updateMobileViewStatus = function() {
		var currentMobileStatus = mobileView
		if ($win.width() < 767) {
			mobileView = true
		} else {
			mobileView = false
		}
		if (currentMobileStatus !== mobileView && mobileView) renderBaseColorbars()
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

	var renderBaseColorbars = function() {
		var cbBaseSpread = 20
		var sat = 50
		var lum = 50
		var bar
		var fadeDelay = 0
		$(".color-bar").remove()
		for (var hue = 0; hue < 360; hue +=cbBaseSpread) {
			bar = $(Templates.colorBar)
			$(bar).css("background-color", "hsl(" + hue + "," + sat + "%," + lum + "%)")
			$(bar).attr("data-hue", hue)
			$(bar).hide().appendTo("#color-bars").delay(fadeDelay).fadeIn(500)
			fadeDelay += 75
		}
	}

	var expandColorBars = function(baseColorBar) {
		var cbDetailCount = 20
		var baseHue = $(baseColorBar).data("hue")
		var detailBar = $(Templates.colorBarDetail)
		var barHeight = $(".color-bar").first().height()
		console.log("barheight:",barHeight)
		var anchorIndex = $(baseColorBar).index() + 1

		$(detailBar).attr("data-hue", baseHue)
		$(detailBar).attr("data-base", baseHue)

		$(detailBar).css("background-color", "hsl(" + baseHue + "," + pickerSat + "%," + pickerLum + "%)")
		$(baseColorBar).replaceWith(detailBar)

		var $anchor = $("#color-bars .color-bar:nth-child("+anchorIndex+")")
		console.log($anchor)

		for (var hue = baseHue + cbDetailCount - 1 ; hue > baseHue; hue --) {
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

	var bindListeners = function() {
		for (var i in listeners) {
			var listener = listeners[i]
			$(listener.id).on(listener.browserEvent, listener.fn)
		}
	}

	$(document).ready(function() {
		console.log("document ready fired")
		Colorgram.initialize()
	});

	return {
		init: function() {
			getTemplates()
			renderBaseColorbars()
			bindListeners()
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




