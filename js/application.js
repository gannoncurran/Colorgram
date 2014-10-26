var Colorgram = {}


Colorgram.PageController = (function() {

	return {
		
		init: function() {
			console.log("page controller init fired")
		},

	}
	
})()

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

	var interval

	var buttons = [
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
			browserEvent: "click",
			fn: function(e) {
				console.log("brighten button clicked")
			}
		},

		{
			id: "#button-brightdn",
			browserEvent: "click",
			fn: function(e) {
				console.log("dim button clicked")
			}
		},

		{
			id: "#button-satup",
			browserEvent: "click",
			fn: function(e) {
				console.log("saturate button clicked")
			}
		},

		{
			id: "#button-satdn",
			browserEvent: "mousedown touchstart",
			fn: function(e) {
				e.preventDefault()
				console.log("desaturate button pressed")
				desaturate()
				interval = window.setInterval(desaturate, 200)
			}
		},

		{
			id: "#button-satdn",
			browserEvent: "mouseup touchend",
			fn: function(e) {
				e.preventDefault()
				console.log("desaturate button released")
				window.clearInterval(interval, 500)
			}
		},

		// {
		// 	id: "#button-satdn",
		// 	browserEvent: "click",
		// 	fn: function(e) {
		// 		console.log("desaturate button clicked")
		// 		desaturate()
		// 	}
		// }

	]

	var saturate = function() {
		console.log("desaturating!")
	}

	var desaturate = function() {
		console.log("desaturating!")
	}

	var bindListeners = function() {
		for (var i in buttons) {
			var button = buttons[i]
			$(button.id).on(button.browserEvent, button.fn)
		}
	}

	return {
		init: function() {
			bindListeners()
		}
	}
	
})()


Colorgram.initialize = function() {
	console.log("Colorgram Initializing")

	console.log("Loading page controller")
	Colorgram.PageController.init()

	console.log("Initializing google map and places autocomplete")
	Colorgram.Map.init()

	console.log("Fetching recent colorgrams from server")
	Colorgram.Comm.getRecents()

	console.log("Initializing view")
	Colorgram.View.init()

	console.log("Testing colorgram model")
	var grams = Colorgram.Model.allColorgrams()
	console.log(grams)
}



// var grayMapTheme = [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]}]


// Colorgram.map = (function() {

// })




$(document).ready(function() {
	console.log("document ready fired")
	Colorgram.initialize()
});