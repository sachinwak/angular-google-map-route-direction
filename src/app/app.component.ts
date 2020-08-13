import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core'
import { MapInfoWindow, MapMarker, GoogleMap } from '@angular/google-maps'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit , AfterViewInit{
  @ViewChild(GoogleMap, { static: false }) mapObj: GoogleMap
  @ViewChild(MapInfoWindow, { static: false }) infoWindow: MapInfoWindow
  @ViewChild("markerPoint", { static: false }) markerPoint: ElementRef;
  
  @ViewChild("rightPanel", { static: false }) rightPanel: ElementRef;

  zoom = 14
  center: google.maps.LatLngLiteral
  options: google.maps.MapOptions = {
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    mapTypeControl: true,
  }
  infoContent = '';
  markers = [];
  directionPoint = { start:null, waypts:[], end:null };
  route:any;

  // Direction Service and Renderer
  directionsService;
  directionsRenderer;

  openMarker = {title:"no marker", index: null};

  ngOnInit() {
    navigator.geolocation.getCurrentPosition(position => {
      this.center = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        /* lat: 19.0655,
        lng: 72.8898, */
      }
    });
  }
  
  ngAfterViewInit() {
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers:true ,
        draggable: true,
        panel: this.rightPanel.nativeElement
    });
  }  

  onDragMarker(event, marker){
    this.markers[marker.index].position = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    
    this.rearrageMarker();
  }

  onMapClick(event: google.maps.MouseEvent) {
    console.log(event);
    if(this.markers.length <= 3){
      var newMarker =  {
        position: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
        title: "Location " + (this.markers.length + 1),
        clickable:true,
        index:this.markers.length,
        options:{
          draggable: true,
        }
      };
      this.markers.push(newMarker);

      this.rearrageMarker();
    }
    //console.log(event);
  }

  createDirectionPoints(){
    this.directionPoint = { start:null, waypts:[], end:null };
    for(let i = 0;i <= this.markers.length - 1;i++){
      if(i == 0){
        this.directionPoint.start = {lat: this.markers[i].position.lat, lng: this.markers[i].position.lng};
      }else if(i == (this.markers.length - 1)){
        this.directionPoint.end = {lat: this.markers[i].position.lat, lng: this.markers[i].position.lng};
      }else{
        let location = {location: {lat: this.markers[i].position.lat, lng: this.markers[i].position.lng}};
        this.directionPoint.waypts.push(location);
      }
    }
  }

  // Get Direction
  drawDirection(){
    this.directionsRenderer.setMap(this.mapObj.googleMap); // Existing map object displays directions

    // Create route from existing points used for markers
    this.route = {
        origin: this.directionPoint.start,
        destination: this.directionPoint.end,
        waypoints: this.directionPoint.waypts,
        optimizeWaypoints: true,
        travelMode: 'DRIVING'
    }

    this.directionsService.route(this.route,(response, status) => { // anonymous function to capture directions
        if (status !== 'OK') {
          window.alert('Directions request failed due to ' + status);
          return;
        } else {
          //console.log(directionsRenderer);
          this.directionsRenderer.setDirections(response); // Add route to the map
          var directionsData = response.routes[0].legs[0]; // Get data about the mapped route
          if (!directionsData) {
            window.alert('Directions request failed');
            return;
          }
          else {
            //document.getElementById('msg').innerHTML += " Driving distance is " + directionsData.distance.text + " (" + directionsData.duration.text + ").";
            console.log(" Driving distance is " + directionsData.distance.text + " (" + directionsData.duration.text + ").");
          }
        }
    });
  }
  
  openInfo(marker: MapMarker, index) {
    this.markerPoint.nativeElement.value = index + 1;
    this.openMarker = this.markers[index];
    this.infoWindow.open(marker);
  }

  changeOrderOfMarkers(markerSelectValue){
    if(markerSelectValue > this.markers.length){
      alert("You can not set order higher than total number of markers");
      this.markerPoint.nativeElement.value = this.openMarker.index + 1;
    }else{
      let oldMarkerIndex = this.openMarker.index;
      console.log("previous", oldMarkerIndex);

      // rearrange
      this.markers.map((marker, index)=>{
        if((markerSelectValue - 1) == marker.index){ // other marker
          marker.index = oldMarkerIndex;
        }
        if(this.openMarker.index == index){
          this.openMarker.index =  markerSelectValue - 1;
        }
        return marker;
      });
      console.log("previous1", oldMarkerIndex);
      
      this.rearrageMarker();
    }
    
  }

  rearrageMarker(){
    this.markers.sort((a, b)=>{
      return a.index - b.index
    });

    if(this.markers.length > 1){
      // draw route
      this.createDirectionPoints();
      this.drawDirection();
    }

    console.log(this.markers);
  }


}
