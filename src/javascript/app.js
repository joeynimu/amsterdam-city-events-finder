// my required files
var angular = require('angular');
    ngResource = require('angular-resource'),
    ngRoute = require('angular-route');

// initialising my angular app with its dependancies
var festiveApp = angular.module('festiveApp', ['ngRoute', 'ngResource']);

//routes
festiveApp.config(function($routeProvider){
 // base route/homepage
  $routeProvider.when('/', {
    templateUrl: '/pages/home.html',
    controller: 'homeCtrl'
  })
  // festivals listings page
  .when('/festivals', {
    templateUrl: 'pages/festivals.html',
    controller: 'festivesCtrl'
  })
  // route for single event with a specific :id
  .when('/festivals/:id', {
    templateUrl: 'pages/single-festival.html',
    controller: 'singleFestiveCtrl'
  })
});


// services
festiveApp.service('eventService', function(){
  // this grabs whatever value the user has searched for and binds it.
  // it defaults to 'Restaurant'
  this.category = 'Restaurant';
});

// controllers
// notice the way i am adding the dependancies so that i don't have problems after minification

// home controller
festiveApp.controller('homeCtrl', ['$scope', 'eventService', function($scope, eventService){
  // set the category from the eventService
  $scope.category = eventService.category;
  // watch and update the category
  $scope.$watch('category', function(){
    eventService.category = $scope.category;
  });
}]);

// results route controller
festiveApp.controller('festivesCtrl', ['$scope', '$resource', '$routeParams', 'eventService',
  function($scope, $resource, $routeParams, eventService){
    // watch and update category
    $scope.category = eventService.category;

    // city API base route with the required params.
    // the method should be JSONP to prevent CORS
    $scope.amsterdamCityAPI = $resource("http://citysdk.dmci.hva.nl/CitySDK/pois/search", {get: {method: "JSONP", params : {callback : 'JSON_CALLBACK'}}});

    // make the call passing the category as the search parameter
    $scope.eventResults = $scope.amsterdamCityAPI.get({category: $scope.category});

}]);

festiveApp.controller('singleFestiveCtrl', ['$scope', '$resource', '$routeParams',
  function($scope, $resource, $routeParams){
    // get the map div
    $scope.mapEl = $('.map');
    // function to Initialise the map
    // i give it two params, lat and lng
    $scope.mapInit = function(lat, lng){
      // get the latitude and longitude which should be floats hence parseFloat
      var eventCord = {lat: parseFloat(lat), lng: parseFloat(lng)};
      // the event map passing it the El and position by lat and lng
      var eventMap = new google.maps.Map($scope.mapEl[0], {center: new google.maps.LatLng(lat, lng), zoom: 8});
      // adda marker on the map
      var eventMarker = new google.maps.Marker({
        position: eventCord,
        map: eventMap
      });
      //  infowindow shoing the event name on clicking marker
      var infoWindowContent = '<div class="info_content">' + '<h3>' + $scope.eventName + '</h3>' + '</div>';

      // Initialise the inforWindow
      var infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent
    });
      //  add click listener and show the infowindow
      google.maps.event.addListener(eventMarker, 'click', function() {
          infoWindow.open(eventMap, eventMarker);
      });
    }
    // single point of interest base url with configs
    var amsterdamCityEvent = $resource("http://citysdk.dmci.hva.nl/CitySDK/pois/", {get: {method: "JSONP", params : {callback : 'JSON_CALLBACK'}}});
    var event = amsterdamCityEvent.get({id: $routeParams.id},
      // grab the data on callback
      function(data){
        // grabing the cordinats
        $scope.cord = data.location.point[0].Point.posList;
        // grabing the event name
        $scope.eventName = data.label[0].value;
        // getting the lat cordinate from the string; the first portion before the space ' '
        $scope.lat = $scope.cord.substr(0,$scope.cord.indexOf(' '));
        // getting the long cordinate from the string; the first porting after the space ' '
        $scope.lng = $scope.cord.substr($scope.cord.indexOf(' ')+1);
        // now i have all the info i need to pass to my maoInit function. so i call it below
        $scope.mapInit($scope.lat, $scope.lng);
      },
      // error callback
      function(err){
        throw err;
      }
  );
    // grab the events data and bind it
    $scope.event = event;
  }
]);
