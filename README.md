# wildfire-shelters

This repository contains a script in `main.js` that parses text from the CalFire website and outputs data to the `docs/shelters.json` file.

Currently, the code accounts for the 2 formats used on the [Palisades Fire](https://www.fire.ca.gov/incidents/2025/1/7/palisades-fire) and [Hughes Fire](https://www.fire.ca.gov/incidents/2025/1/22/hughes-fire) pages:

- Palisades Fire - multiline within `<p>` tags
- Hughes Fire - single line as part within `<ul><li>` tags

Page URLs to parse are kept in an array.  Identifying formats is currently done by recognizing the `<p>` vs `<ul>` tags.

The addresses are then geocoded using Nominatim, the OpenStreetMap free geocoding service.

The [Eaton Fire](https://www.fire.ca.gov/incidents/2025/1/7/eaton-fire) page was not included because the shelters included were already listed on the Palisades Fire page.  Ideally, the code would also be able to de-duplicate shelter locations between pages.

The script uses a GitHub Action workflow to run every hour to keep the `shelters.json` file up to date.