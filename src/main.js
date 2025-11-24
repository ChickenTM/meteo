import './style.css'
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');
var map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);




const resultList = await pb.collection('dbMeteo').getList();
  const items = resultList.items;

const getTemperature = async(lat, lon) =>{
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const response = await fetch(url);
  const meteoData = await response.json();
  const meteoDataValue = meteoData.current_weather.temperature;
  console.log(meteoDataValue);
  return meteoDataValue;
}
const getLuogo = async(lat, lon) =>{
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const response = await fetch(url);  
  const luogoData = await response.json();
  const luogoDataValue = luogoData.address.city || luogoData.address.town || luogoData.address.village || luogoData.address.hamlet || "Unknown location";
  console.log(luogoDataValue);
  return luogoDataValue;
}
 
function getColore(temp) {
  if (temp <= 0) return 'blue';
  else if (temp > 0 && temp <= 15) return 'cyan';
  else if (temp > 15 && temp <= 25) return 'green';
  else if (temp > 25 && temp <= 35) return 'orange';
  else if (temp > 35) return 'red';
  else return 'gray';
}
const caricaDati = async () => {
  
  
  for await (const item of items) {
    const lat = item.geopoint.lat;
    const lon = item.geopoint.lon;
    const luogo = await getLuogo(lat,lon);
    const temp = await getTemperature(lat,lon);
    let colore = getColore(temp);
    L.circle([lat, lon], {
      color: colore,
      fillColor: colore,
      fillOpacity: 0.5,
      radius: 10000
    })
      .addTo(map)
      .bindPopup(`Lat: ${lat},<br> Lon: ${lon}<br>Temp: ${temp}°C,<br>Luogo: ${luogo}`);
  };
 
}
const onMapClick = async(e) => {
    items.push({geopoint: {lat: e.latlng.lat, lon: e.latlng.lng}});
    await pb.collection('dbMeteo').create({
      geopoint: {lat: e.latlng.lat, lon: e.latlng.lng}
    });
    caricaDati();
    }

const aggiungiInfo = async() => {
  const infoDiv = document.getElementById('info');
  infoDiv.innerHTML = '<h3>Legenda Temperature  </h3>' +                    
                      '<p><span style="color: blue;">&#9679;</span> ≤ 0°C</p>' +
                      '<p><span style="color: cyan;">&#9679;</span> 1°C - 15°C</p>' +
                      '<p><span style="color: green;">&#9679;</span> 16°C - 25°C</p>' +
                      '<p><span style="color: orange;">&#9679;</span> 26°C - 35°C</p>' +
                      '<p><span style="color: red;">&#9679;</span> > 35°C</p>';
}
aggiungiInfo(); 

//numero di punti aggiunti
//temp media
//temp max
//temp min
const aggiuntiTabInfo = async() => {
  const tabInfoDiv = document.getElementById('tabInfo');
  const numPunti = items.length;
  const tempValues = [];
  for await (const item of items) {
    const lat = item.geopoint.lat;
    const lon = item.geopoint.lon;
    const temp = await getTemperature(lat,lon);
    tempValues.push(temp);
  }
  const tempMedia = (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(2);
  const tempMax = Math.max(...tempValues);
  const tempMin = Math.min(...tempValues);
  
  tabInfoDiv.innerHTML = `<h3>Statistiche Punti Aggiunti</h3>
                          <p>Numero di punti aggiunti: ${numPunti}</p>
                          <p>Temperatura Media: ${tempMedia}°C</p>
                          <p>Temperatura Massima: ${tempMax}°C</p>
                          <p>Temperatura Minima: ${tempMin}°C</p>`;
}
aggiuntiTabInfo();


caricaDati();
map.on('click', onMapClick);