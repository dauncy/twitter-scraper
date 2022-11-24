import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';
import { TwitterData } from "./CSV";

class _Scraper {
  private _browser: null | Browser = null;
  private _page: null | Page = null;
  private csvRowID: string = "";
  static instance: _Scraper

  static getInstance = (): _Scraper => {
    if (!_Scraper.instance) {
      _Scraper.instance = new _Scraper();
    }
    return _Scraper.instance;
  }

  public init = async() => {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
      headless:false, 
      defaultViewport:null,
      args: ["--window-size=1920,1080", "--window-position=1921,0", '--enable-features=ExperimentalJavaScript']
    });
    const page = await browser.newPage();

    const session = await page.target().createCDPSession();
    await session.send("Page.enable");
    await session.send("Page.setWebLifecycleState", { state: "active" });
    this._browser = browser;
    this._page = page
  }

  public dispose = async () => {
    if (!this._browser) {
      return;
    }

    await this._browser.close();
  }

  public setCSVRowID = ({id} : {id: string}) => {
    this.csvRowID = id;
  }

  public parseData = async ({url} : {url: string}) : Promise<Partial<TwitterData>> => {
    const scrapedData: Partial<TwitterData> = {
      view_count: "",
      likes: "",
      post: "",
      retweets: "",
    }
    await this.goToUrl({url})
    
    // video views
    try {
      const views = await this.findViewCount();
      const viewCount = views.split('view')[0];
      const formattedViews = this.parseNumberFromText({text: viewCount})
      scrapedData.view_count = formattedViews
    } catch (e) {
      console.log("unable to parse view count: " + this.csvRowID)
    }

    // tweet likes
    try {
      const likes = await this.findLikes();
      scrapedData.likes = likes
    } catch (e) {
      console.log("unable to parse likes: " + this.csvRowID)
    }

    // retweets
    try {
      const retweets = await this.findRetweets();
      scrapedData.retweets = retweets
    } catch (e) {
      console.log("unable to parse retweets: " + this.csvRowID)
    }

    // post content
    try {
      const post = await this.findPostContent();
      scrapedData.post = post
    } catch (e) {
      console.log("unable to parse post content: " + this.csvRowID)
    }

    console.log(
      "twitter id: " + this.csvRowID,
       " --- total views: " + scrapedData.view_count, 
       " --- total likes: " + scrapedData.likes,
       " --- total retweets: ", scrapedData.retweets )
    
    return scrapedData
  }

  public parseNumberFromText = ({text} : {text: string}) : string=> {
    const formatted = text.replace(',', '')
    let multiplier = 1
    if (text.toLowerCase().includes('k')) {
      multiplier = 1000
    }

    if (text.toLowerCase().includes('m')) {
      multiplier = 1000000
    }

    const float = parseFloat(formatted);
    const num = (float * multiplier).toFixed(0)
    return num
  }

  private goToUrl = async ({url} : {url: string}) => {
    if (!this._page) {
      return;
    }

    await this._page.goto(url, {waitUntil: 'networkidle0', timeout: 5000})
    try {
      await this.handleSensitiveContent()
    } catch (e) {
      console.log("no sensitive content")
    }
  }

  private handleSensitiveContent = async () => {
  
    if (!this._page) {
      return;
    }

    const xp = '//*[@role="button"]//*[text()="View"]'
    const [viewButton] = await this._page.$x(xp)
    if (!viewButton) {
      return
    }
    const sensitiveViewButton = await this._page.evaluate((button) => button.textContent, viewButton)
    if (sensitiveViewButton) {
      await (viewButton as ElementHandle<Element>).click();
      return
    }
    return;
  }

  private findViewCount= async () : Promise<string> => {
    if (!this._page) {
      return ""
    }
    
    await this._page.waitForSelector('video', {})

    const texts = await this._page.evaluate(async () => {
      const regex = /view(s)?/g
      let textMatches: string[] = [];
      let videos = document.querySelectorAll('video')

      const playPromise = (v: HTMLVideoElement) => new Promise((resolve, reject) => {
        if (v.readyState  > 2 ) {
          v.pause()
          resolve(true)
        }
        v.addEventListener("play", () => {
          setTimeout(() => {
            v.pause()
            resolve(true)
          }, 250)
        })
      })

      // TODO handle videos that donot autoplay
      for (const video of Array.from(videos)) {
        await playPromise(video)
        let elements = document.querySelectorAll('.css-901oao.css-16my406.r-poiln3.r-bcqeeo.r-qvutc0')
        for (const element of Array.from(elements)) {
          const text = element.textContent?.toLowerCase()
          if (text && text.match(regex)) {
            textMatches.push(element.textContent as string);
          }
        }
      }
        return textMatches
      })

    if (texts && texts.length) {
      return texts[0]
    }

    return ""
  }

  private findRetweets = async () :Promise<string> => {
    if (!this._page) {
      return ""
    }
    // TODO scrape retweets
    return ""
  }

  private findPostContent = async () : Promise<string> => {
    if (!this._page) {
      return ""
    }
    // TODO scrape post content
    return ""
  }

  private findLikes = async () :Promise<string>=> {
    if (!this._page) {
      return ""
    }
    // TODO scrape likes
    return ""
  }
}

export const Scraper = _Scraper.getInstance();

