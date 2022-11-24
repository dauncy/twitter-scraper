import * as fs from "fs"
import * as csv from "fast-csv";
import * as path from "path";
import { stringify } from "csv-stringify";

const FILE_NAME = "../fixtures/twitter.csv";

export interface TwitterData {
  id: string;
  video_url: string;
  view_count?: string; 
  likes?: string;
  post?: string;
  retweets?: string;
}

class _CSVService {
  private csvData: any[] = []
  static instance: _CSVService;
  static getInstance = () :_CSVService => {
    if (!_CSVService.instance) {
      _CSVService.instance = new _CSVService();
    }
    return _CSVService.instance
  }

  private parseData = (json: any) : TwitterData => {
    return {
      id: json['Video ID'],
      video_url: json['Video URL'],
      view_count: json['Viewcount'],
      likes: "",
      retweets: "",
      post: ""
    }
  }



  public updateCSV = () => {
    const filePath = path.resolve(__dirname, '../fixtures/out/twitter.csv')
    stringify(this.csvData, {
      header: true
    }, (err, res) => {
      if (err) {
        throw(err);
      }
      fs.writeFile(filePath, res, (e) => {
        if (e) {
          throw(e)
        }
      })
    })
  }

  public readFile = () :Promise<undefined | TwitterData[]> => {
    const filePath = path.resolve(__dirname, '../fixtures/twitter.csv')
    return new Promise((resolve) => {
      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true }))
          .on('error', (error: any) => {
            throw(error);
          })
          .on('data', (row: any) => {
            this.csvData.push(this.parseData(row))
          })
          .on('end', () => {
            resolve(this.csvData)
          })
    })
  }
}

export const CSVService = _CSVService.getInstance();