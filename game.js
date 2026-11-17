(async () => {
  const apiKey = window.GOOGLE_MAPS_API_KEY;
  const mapId = window.GOOGLE_MAPS_MAP_ID;

  if (!apiKey || apiKey === "JOUW_API_SLEUTEL" ||
      !mapId || mapId === "JOUW_MAP_ID") {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<p style="position:fixed;top:100px;left:14px;z-index:5;background:white;padding:12px">Vul je Google Maps API-sleutel en Map ID in index.html in.</p>'
    );
    return;
  }

  // Laad Google Maps JavaScript API.
  const script = document.createElement("script");
  script.src =
    `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=beta&libraries=maps3d`;
  script.async = true;

  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const { Map3DElement, Marker3DElement } =
    await google.maps.importLibrary("maps3d");

  // Startlocatie: Oranjestad, Aruba.
  const start = { lat: 12.5092, lng: -70.0086 };
  let truckLat = start.lat;
  let truckLng = start.lng;
  let heading = 0; // 0 = noord

  const map = new Map3DElement({
    center: { ...start, altitude: 0 },
    range: 90,
    tilt: 65,
    heading,
    mapId
  });

  document.body.appendChild(map);

  // Truckmarker op de kaart; de camera blijft erachter.
  const truckMarker = new Marker3DElement({
    position: { ...start, altitude: 0 },
    label: "ORANJESTAD RP"
  });
  map.appendChild(truckMarker);

  const pressed = {};
  window.addEventListener("keydown", (e) => {
    pressed[e.key.toLowerCase()] = true;
    if (e.key.startsWith("Arrow")) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    pressed[e.key.toLowerCase()] = false;
  });

  const speedText = document.getElementById("speed");
  let speed = 0;
  let previousTime = performance.now();

  function animate(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    const forward = pressed.w || pressed.arrowup;
    const backward = pressed.s || pressed.arrowdown;
    const left = pressed.a || pressed.arrowleft;
    const right = pressed.d || pressed.arrowright;

    if (forward) speed = Math.min(speed + 8 * dt, 25);
    else if (backward) speed = Math.max(speed - 8 * dt, -10);
    else speed *= Math.pow(0.94, dt * 60);

    if (Math.abs(speed) > 0.2) {
      const turn = (right ? 1 : 0) - (left ? 1 : 0);
      heading = (heading + turn * 65 * dt * Math.sign(speed) + 360) % 360;

      // Muunna nopeus ja suunta pieneksi lat/lng-siirtymäksi.
      const distance = speed * dt;
      const radians = THREE_DEG_TO_RAD(heading);
      const metersPerLat = 111320;
      const metersPerLng = 111320 * Math.cos(truckLat * Math.PI / 180);

      truckLat += Math.cos(radians) * distance / metersPerLat;
      truckLng += Math.sin(radians) * distance / metersPerLng;
    }

    const position = { lat: truckLat, lng: truckLng, altitude: 0 };

    truckMarker.position = position;

    // Camera staat achter de truck en kijkt schuin omlaag.
    map.center = position;
    map.heading = heading;
    map.tilt = 65;
    map.range = 90;

    speedText.textContent = Math.round(Math.abs(speed) * 3.6);
    requestAnimationFrame(animate);
  }

  function THREE_DEG_TO_RAD(degrees) {
    return degrees * Math.PI / 180;
  }

  requestAnimationFrame(animate);
})().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML(
    "beforeend",
    '<p style="position:fixed;top:100px;left:14px;z-index:5;background:white;padding:12px">Google Maps kon niet laden. Controleer je API-sleutel, Map ID en Maps JavaScript API-instellingen.</p>'
  );
});
