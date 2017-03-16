/*=======================================
Working skyscanner car response + places.
=========================================*/

//MODEL
var carQueryParams = {
  "market": "US",
  "currency": "USD",
  "locale": "en-US",
  "pickupplace": null,
  "dropoffplace": null,
  "pickupdatetime": null,
  "dropoffdatetime": null,
  "driverage": null
}

var placesQueryParams = {
  //pull lat and lon data from skyscanner api.
  "location": null, 
  "city": null,
  //default to 50,000 meters
  "radius": 50000, 
}

//Controller and View. Note, mispelled 'alpaca' on purpose to not interferre with other's code.
var aplaca = {
  //collection of raw data from airports
  "preloadedData": [],
  //collection of US cities only.
  "cityName": [],
  //collection of lat and lon data.
  "carImageId": [],
  "carImageUrl": [],
  "carResultCounter": 1,
  //google places api key
  "apiKeyPlaces": "AIzaSyDxrfECQIUwg8qfKJe1WaDTSgNN8o18lqY",
  //skyscanner's api key for live car pricing.
  "apiKeyCar": "prtl6749387986743898559646983194",
  "ip": "127.0.0.1",
  "queryURLBasePlaces": "https://maps.googleapis.com/maps/api/place/textsearch/xml?query=restaurants+in+",
  "queryURLBaseCar": "http://partners.api.skyscanner.net/apiservices/carhire/liveprices/v2/",
  "newUrlPlaces": null,
  "newUrlCar": null,
  // queryTerm: null,
  // newUrl: null,
  // firstSearch: false,
    //main controller 
    init: function () {
      this.loadData();
      this.cacheDom();
      this.bindEvents();
      this.render();
      
    },
    //first ajax call to load autocomplete and user input control.
    loadData: function () {
      //maintaining context to main obj
      var self = this;
      $.ajax({
          method: "POST",
          dataType: "json",
          url: "https://proxy-cbc.herokuapp.com/proxy",
          data: {
            url: "http://partners.api.skyscanner.net/apiservices/geo/v1.0?apikey=uc462626261286303668321436417455" 
          }
      }).done(function(response){
        console.log(response);
        //pushing entire airport data obj into preloaded array parameter
        for (var i = 0; i < response.Continents[6].Countries[5].Cities.length; i++) {
          self.preloadedData.push(response.Continents[6].Countries[5].Cities[i].Airports[0])
        }
        console.log(aplaca.preloadedData[0]);
        //preloading city names into array for use with autocomplete from jquery UI lib.
        for(var i = 0; i < self.preloadedData.length; i++) {
          //pushing all US cities onto cityName parameter
          self.cityName.push(self.preloadedData[i].Name);
        }
        
      });
    },
    //caching the DOM so we are not searching through the DOM over and over again.
    cacheDom: function () {
      this.$searchBtn = $("#btn-call");
      this.$searchPlacesBtn = $("#btn-places");
    },
    bindEvents: function () {
      this.$searchBtn.on("click", this.runQuery.bind(this));
      this.$searchPlacesBtn.on("click", this.runPlacesQuery.bind(this));
    },
    //initial jquery UI interfaces and autocomplete. 
    render: function () {
      $( function() {
        $( "#depart" ).datepicker();
        $( "#return" ).datepicker();
        $( "#where" ).autocomplete({
        source: aplaca.cityName
        });
        $( "#from" ).autocomplete({
        source: aplaca.cityName
        });
        $( "#to" ).autocomplete({
        source: aplaca.cityName
        });
      });  
    },
    //conditions the query for the skyscanner live car prices parameters.
    queryConditioning: function () {
      //slicing month, day, and year to match skyscanner's date format.
      var month = $("#depart").val().slice(0,2);
      var day = $("#depart").val().slice(3,5);
      var year = $("#depart").val().slice(6);
      var hrUp = $("#hrUp").val(); 
      var minUp = $("#minUp").val();
      var hrOff = $("#hrOff").val(); 
      var minOff = $("#minOff").val();
      carQueryParams.pickupdatetime = $("#depart").val().slice(6) + "-" + 
                                      $("#depart").val().slice(0,2) + "-" + 
                                      $("#depart").val().slice(3,5) + "T" + 
                                      $("#hrUp").val() + ":" + 
                                      $("#minUp").val();
      carQueryParams.dropoffdatetime = $("#return").val().slice(6) + "-" + 
                                      $("#return").val().slice(0,2) + "-" + 
                                      $("#return").val().slice(3,5) + "T" + 
                                      $("#hrOff").val() + ":" + 
                                      $("#minOff").val();
      carQueryParams.driverage = $("#age").val();
      console.log(carQueryParams);
    },
    renderCarResults: function (carData) {
      //loop to aggregate 10 IDs into our object parameter carImageID
      for(var i = 0; i < 10; i++) {
        aplaca.carImageId.push(carData.cars[i].image_id);
      }
      //outter loop cycles through our 10 image IDs
      for(var i = 0; i < aplaca.carImageId.length; i++) {
          //inner loop compared each ID with the image ID returned by the skyscanner response.
          for(var j = 0; j < carData.images.length; j++) {
            //matched! acquire the matched url for the car image.
            if(aplaca.carImageId[i] === carData.images[j].id) {
              aplaca.carImageUrl.push(carData.images[j].url);
            }
          } 
      }
      //appending params into the DOM, 10 total vehicles, pics, and prices.
      for(var i = 0; i < 10; i++) {
        var newH1 = $("<h1>" + aplaca.carResultCounter + "</h1>");
        $("#carResults").append(newH1);
        $("#carResults").append("<p>" + 
          carData.cars[i].vehicle + "</p>");
        $("#carResults").append("<p> $ " + 
          carData.cars[i].price_all_days + "</p>");
        $("#carResults").append("<img src='" + aplaca.carImageUrl[i] + "'> <br>");
        $("#carResults").append("<a href=" + carData.cars[i].deeplink_url +
          "class='btn btn-default' target='_blank'> Book It!!! </a>" );
        aplaca.carResultCounter++;
      }
      // <a href="http://google.com" class="btn btn-default">Go to Google</a>
    },
    runQuery: function () {
      //maintain context to nyt.
      var self = this; 
      var pickUp = $("#from").val();
      var dropOff = $("#to").val();
      //for loop used to collect corresponding IDs for each city name.
      for(var i = 0; i < this.preloadedData.length; i++) {
        if(this.preloadedData[i].Name === pickUp) {
          carQueryParams.pickupplace = this.preloadedData[i].Id;
        }
        if(this.preloadedData[i].Name === dropOff) {
          carQueryParams.dropoffplace = this.preloadedData[i].Id;
        } 
      }
      console.log(carQueryParams);
      this.queryConditioning();
      //constructing the newUrl parameters to be fed to skyscanner.
      this.newUrlCar = this.queryURLBaseCar + 
                    carQueryParams.market + "/" +
                    carQueryParams.currency + "/" +
                    carQueryParams.locale + "/" +
                    carQueryParams.pickupplace + "/" +
                    carQueryParams.dropoffplace + "/" +
                    carQueryParams.pickupdatetime + "/" +
                    carQueryParams.dropoffdatetime + "/" +
                    carQueryParams.driverage + "?apiKey=" + this.apiKeyCar +
                    "&userip=" + this.ip;
      console.log(this.newUrlCar);
      $.ajax({
          method: "POST",
          dataType: "json",
          url: "https://proxy-cbc.herokuapp.com/proxy",
          data: {
            url: self.newUrlCar  
          }
      }).done(function(response){
        console.log("==========");
        console.log(response);
        //successfull callback, call the renderCarResults method.
        self.renderCarResults(response);
      });
      return false;
    },
    runPlacesQuery: function () {
      //maintain context to nyt.
      var self = this; 
      var place = $("#where").val();
      
      //for loop used to collect corresponding lat and lon of searched destination.
      for(var i = 0; i < this.preloadedData.length; i++) {
        if(this.preloadedData[i].Name === place) {
          placesQueryParams.location = this.preloadedData[i].Location;
          placesQueryParams.city = place;
        }
      }
      console.log(placesQueryParams);
   
      //constructing the newUrl parameters to be fed to skyscanner.
      this.newUrlPlaces = this.queryURLBasePlaces + 
                    placesQueryParams.city +
                    "&key=" + this.apiKeyPlaces 
      console.log(this.newUrlPlaces);
      $.ajax({
          method: "POST",
          dataType: "json",
          url: "https://proxy-cbc.herokuapp.com/proxy",
          data: {
            url: self.newUrlPlaces  
          }
      }).done(function(response){
        console.log("==========");
        console.log(response);
        //successfull callback, call the renderCarResults method.
        // self.renderCarResults(response);
      });
      return false;
    }
}
//when document is ready, start the initialization of the object.
$(document).ready(function () {
    aplaca.init();
});