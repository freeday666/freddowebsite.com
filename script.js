// Haalt een echte rijroute op en geeft de Google Maps-routepunten door aan Three.js.
const pickup = { lat: 52.3676, lng: 4.9041 };   // Amsterdam
const delivery = { lat: 52.0907, lng: 5.1214 }; // Utrecht

window.initMap = function () {
  const status = document.querySelector("#map-status");

  if (!window.google?.maps) {
    status.textContent = "Google Maps kon niet laden. Controleer je API-key.";
    return;
  }

  const map = new google.maps.Map(document.querySelector("#map"), {
    center: pickup,
    zoom: 9,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    polylineOptions: { strokeColor: "#f07822", strokeWeight: 6 }
  });

  directionsService.route({
    origin: pickup,
    destination: delivery,
    travelMode: google.maps.TravelMode.DRIVING
  }, (result, code) => {
    if (code !== "OK") {
      status.textContent = `Route niet beschikbaar: ${code}`;
      return;
    }

    directionsRenderer.setDirections(result);

    const route = result.routes[0];
    const points = route.overview_path.map(p => ({
      lat: p.lat(),
      lng: p.lng()
    }));

    status.textContent = `Echte route geladen: ${route.legs[0].distance.text}`;

    // De 3D-game bouwt een weg van exact deze routepunten.
    window.dispatchEvent(new CustomEvent("truck-route-ready", {
      detail: {
        points,
        distanceMeters: route.legs[0].distance.value
      }
    }));
  });
};

window.gm_authFailure = function () {
  document.querySelector("#map-status").textContent =
    "Google Maps-key geweigerd. Controleer de key en API-instellingen.";
};
