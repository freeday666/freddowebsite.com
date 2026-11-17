// Google Maps-route van Amsterdam naar Utrecht.
// Vervang in index.html DE_API_KEY door je eigen Maps JavaScript API-key.

const pickup = { lat: 52.3676, lng: 4.9041 };
const delivery = { lat: 52.0907, lng: 5.1214 };

window.initMap = function () {
  const status = document.querySelector("#map-status");

  if (!window.google?.maps) {
    status.textContent = "Google Maps kon niet laden.";
    return;
  }

  const map = new google.maps.Map(document.querySelector("#map"), {
    center: pickup,
    zoom: 9,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  });

  const directions = new google.maps.DirectionsService();
  const renderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: "#f07822",
      strokeWeight: 6
    }
  });

  directions.route(
    {
      origin: pickup,
      destination: delivery,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (result, statusCode) => {
      if (statusCode === "OK") {
        renderer.setDirections(result);
        status.textContent = "Route: Amsterdam → Utrecht";
      } else {
        status.textContent = `Route niet beschikbaar: ${statusCode}`;
      }
    }
  );
};

window.gm_authFailure = function () {
  document.querySelector("#map-status").textContent =
    "Maps-key ongeldig of niet toegestaan voor deze website.";
};
