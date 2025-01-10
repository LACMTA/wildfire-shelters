const axios = require('axios');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const OUTPUT_FILE = 'docs/shelters.json';

const TARGET_PAGES = [
    'https://www.fire.ca.gov/incidents/2025/1/7/palisades-fire'
];

let resultsJSON = [];

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'YourAppName/1.0' } // Add a User-Agent header as required by Nominatim
        });
        const data = response.data;

        if (data.length > 0) {
            const { lat, lon } = data[0];
            return { lat: parseFloat(lat), lng: parseFloat(lon) };
        } else {
            console.log('No results found for:', address);
            return null;
        }
    } catch (error) {
        console.error('Error during geocoding:', error);
        return null;
    }
}

async function getData(url) {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const evacuationSheltersH3 = Array.from(doc.querySelectorAll('h3')).find(
            (h3) => h3.textContent.trim() === "Evacuation Shelters"
        );
        console.log(evacuationSheltersH3.textContent);

        if (!evacuationSheltersH3) {
            console.log("No evacuation shelters section found.");
            return;
        }

        let sibling = evacuationSheltersH3.nextElementSibling;
        const sheltersData = [];

        while (sibling && sibling.tagName === 'P') {
            let shelter = {};
            let lineCount = 1;

            sibling.childNodes.forEach((node) => {
                if (node.tagName == 'BR') {
                    return;
                }

                let text = '';

                switch (lineCount) {
                    case 1:
                        text = node.textContent.trim();
                        shelter.name = text;
                        break;
                    case 2:
                        text = node.textContent.trim();
                        shelter.address = text;
                        break;
                    case 3:
                        text = node.textContent.trim();
                        splitcityStateZip = text.split(',');
                        shelter.city = splitcityStateZip[0].trim();
                        shelter.state = splitcityStateZip[1].trim().split(' ')[0];
                        shelter.zip = splitcityStateZip[1].trim().split(' ')[1];
                        break;
                    default:
                        break;
                }

                lineCount++;
            });

            let addressString = `${shelter.address}, ${shelter.city}, ${shelter.state} ${shelter.zip}`;

            const coords = await geocodeAddress(addressString);
            
            if (coords) {
                shelter.lat = coords.lat;
                shelter.lng = coords.lng;

                console.log(`Geocoded ${shelter.name}: ${coords.lat}, ${coords.lng}`);
            }

            sheltersData.push(shelter);

            sibling = sibling.nextElementSibling; // Move to the next sibling
        }
        return sheltersData;
    } catch (error) {
        console.error('Error:', error);
    }
}

function writeDataToFile(data) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFile(OUTPUT_FILE, jsonData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Data written to file successfully.');
        }
    });
}

async function processSheltersData() {
    try {
        // Use Promise.all to wait for all `getData` calls to complete
        const allData = await Promise.all(TARGET_PAGES.map((pageUrl) => getData(pageUrl)));

        // Flatten the results into a single array
        resultsJSON = allData.flat();

        // Write to the file after all data is processed
        writeDataToFile(resultsJSON);

    } catch (error) {
        console.error('Error processing shelter data:', error);
    }
}

processSheltersData();