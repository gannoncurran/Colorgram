#Colorgram

How are you feeling right now? Express it in color.

Colorgram is the brainchild of Detroit based artist Aleks Pollner, and Seattle photographer Charlie Schuck.

Colorgram is a thick-client “serverless” Javascript app.
The one-page JS client communicates directly with AWS DynamoDB for data persistence.

- Hand-rolled, responsive HTML/CSS
- Color picker features infinite loop scrolling on desktop clients
- Locate Me! feature pulls lat/lng from browser when available, and queries Google's reverse geo-code service to provide location details. Parses results to favor coarse neighborhood level, falls back to city or larger entities when necessary.
- Google map is custom styled and dynamically pinned with most recent 100 colorgrams. Circle radii are determined on the fly, based on a combination of viewport size and colorgram timestamp.
