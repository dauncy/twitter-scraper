import { Scraper } from "./Pupeteer";
import { CSVService, TwitterData } from "./CSV"

const main = async () => {
  // set up new pupeteer
  await Scraper.init();

  // get csv data
  let data: TwitterData[] = [] as TwitterData[];
  try {
    const maybeData = await CSVService.readFile();
    if (maybeData) {
      data = maybeData
    }
  } catch (e) {
    console.error('error reading csv file, exiting with: ', e)
  }

  // todo batch queries for performance
  for (const row of data) {
    Scraper.setCSVRowID({id: row.id});
    const url = row.video_url; 
    try {
      const updated = await Scraper.parseData({url});
      row.view_count = updated.view_count;
      row.post = updated.post;
      row.likes = updated.likes;
      row.retweets = updated.retweets;
    } catch (e) {
      console.log("error parsing data: ", row.id)
      continue;
    }
  }
  await Scraper.dispose();
  CSVService.updateCSV()
}

main();