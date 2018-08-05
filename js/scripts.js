//global variables
var map;
var markers = [];
var infoboxes = [];

var FS_ID = 'IWNNXDHZUZ1QYOZY0YPTX3WVA4ZYXZPR5MESIIGPOOBJZLMH';
var FS_SECRET = 'CBA4LWKJPXKWZ5Q3PEHDHIBJZUUZPJA0E53WUOWWRH35IQ2N';

//initalize map to my location
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 35.8427728,
      lng: -78.8553436
    },
    zoom: 12
  });

  fetchMarkers();
}


//fetch and plot markers
//set click event listeners
//fetch foursqaure category and applit to infowindow
function fetchMarkers() {
  $.ajax({
      type: 'GET',
      url: 'https://api.myjson.com/bins/ioxc0', //my pre-populated companies listed in JSON
      data: {},
    })
    .done(function (data) {
      var infoWindow = new google.maps.InfoWindow();
      data.coordinates.forEach(function (el, i) {
        var marker = new google.maps.Marker({
          position: el.location,
          title: el.company_name,
          animation: google.maps.Animation.DROP,
          address: el.address,
          visible: true
        });

        marker.visibleKo = ko.observable(true);

        var contentString = '<div class="info-coordinate">' +
          '<h5>' + el.company_name + '</h5>' +
          '<em>' + el.address + '</em>&nbsp;<br><br>' +
          '<p> <i class="fa fa-2x fa-spinner fa-spin"></i>&nbsp;&nbsp;Fetching Info from FourSquare </p>' +
          '</div>';

        var infowindow = new google.maps.InfoWindow({
          content: contentString
        });

        marker.addListener('click', function () {
          marker.setAnimation(google.maps.Animation.BOUNCE);

          //close other markers when one marrker is clicked
          if (infoboxes.length) {
            infoboxes.forEach(function (el) {
              el.close();
            });
            infoboxes = [];
          }

          setTimeout(function () {
            marker.setAnimation(null);
          }, 500);

          infowindow.open(map, marker);
          infoboxes.push(infowindow);


          //set some delay on ajax to make it cooler by showing a spinner
          setTimeout(function () {
            var newcontentString;
            $.ajax({
                type: 'GET',
                dataType: "json",
                data: {
                    client_id: FS_ID,
                    client_secret: FS_SECRET,
                    query: el.company_name, // gets data from marker.title (array of object)
                    ll: "35.8427728,-78.8553436",
                    v: 20180701 // version equals date
                },
                url: 'https://api.foursquare.com/v2/venues/search',

              })
              .done(function (data) {
                if(data.response.venues[0]){
                  newcontentString = '<div class="info-coordinate">' +
                    '<h5>' + el.company_name + '</h5>' +
                    '<em>' + el.address + '</em>&nbsp;<br><br>' +
                    '<p> FourSquare Category : '+ data.response.venues[0].categories[0].shortName +' </p><br>' +
                    '<a href="https://foursquare.com/v/'+ data.response.venues[0].id +'" target="_blank"><img class="fs-attr" src="img/powered-by-foursquare-blue.png" alt="FourSquare"></a>' +
                    '</div>';
                  infowindow.setContent(newcontentString);
                } else {
                  newcontentString = '<div class="info-coordinate">' +
                    '<h5>' + el.company_name + '</h5>' +
                    '<em>' + el.address + '</em>&nbsp;<br><br>' +
                    '<p> FourSquare Category : None Found </p>' +
                    '</div>';
                  infowindow.setContent(newcontentString);
                }
              })
              .fail(function (error) {
                newcontentString = '<div class="info-coordinate">' +
                  '<h5>' + el.company_name + '</h5>' +
                  '<em>' + el.address + '</em>&nbsp;<br><br>' +
                  '<p> FourSquare API Error. Please try again. </p>' +
                  '</div>';
                infowindow.setContent(newcontentString);
              });
          }, 1000);




        });
        marker.setMap(map);
        markers.push(marker);
        appViewModel.myLocations.push(marker);

        google.maps.event.addListener(map, "click", function (event) {
          infowindow.close();
        });

      });
    })
    .fail(function (error) {
      alert("Error Fetching Markers. Please try reloading this page");
    });
}

// Handle Map Loading Error
function errorOnLoad() {
  alert("Error Loading the Map. Please try reloading this page");
}



// Define VIEW MODEL //
var AppViewModel = function () {
  var self = this;

  // define observables
  this.myLocations = ko.observableArray();
  this.filteredTextInput = ko.observable('');

  // define computed model
  this.searchFilter = ko.computed(function () {
    var filter = self.filteredTextInput()
      .toLowerCase();

    for (var i = 0; i < self.myLocations()
      .length; i++) {
      if (self.myLocations()[i].title.toLowerCase()
        .indexOf(filter) !== -1) {
        self.myLocations()[i].visibleKo(true);
        if (markers[i]) {
          markers[i].setVisible(true);
        }
      } else {
        self.myLocations()[i].visibleKo(false);
        if (markers[i]) {
          markers[i].setVisible(false);
        }
      }
    }
  });

  //define method(s)
  this.showLocation = function (marker) {
    google.maps.event.trigger(marker, 'click');
  };
};


//activate the KO magic bindings
appViewModel = new AppViewModel();
ko.applyBindings(appViewModel);
