We are building a website for marketing all events across the city of Kingston, Ontario. The website will be called Kingston Happenings. It will be for all types of happenings, small and large. It will display concerts, food and drink deals, and trivia nights, and all other similar happenings. Here are some of the features of the web app:

1. Homepage – the homepage will display events that are happening on the current day. Make UI clean, nice, and modern.

2. A calendar – the calendar displays the current month and allows you to click a specific day to see all of the events. I don't exactly know what the UI will look like, so maybe look into some similar type of calendar components.

These are just 2 of the pages we thought of for the web app. There should be more pages, but we dont know what else to add. Think of similar types of webapps and draft some other pages, maybe a news page or something – whatever you think is useful.

Filters should be easily applicable to narrow down events. For example, a user should be able to filter for concerts. Events should have tags so that the filters are useful (e.g. concerts, food deals, trivia nights).

The final version of the webapp will allow the ability to make accounts, so that a restaurant can post their events. We want to start with only the UI, so don't code any backend functionality yet, but ensure that the UI is designed with this in mind so it will be easy to code up and connect the backend later on.

At the start of the website's launch, there will be almost no events posted. As a stretch goal, we would like to run a cron job every so often (consider a time period that might make sense). The cron job will scrape the web for events in Kingston, such as restaurant deals, concerts, etc. Build a mockup of a Python function that will scrape the web to find these types of events. Don't use this Python for anything – make this a proof of concept, keep it separate from the web-app.