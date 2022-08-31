export interface StockFormat {
  [key: string]: Array<string>;
}

export interface IndividualSecurities {
  upDownSymbol?: string; //紅綠燈
  name: string; //公司簡稱 e.g., 中華電
  ticker: string; //股票代號 e.g., 2412
  searchTicker: string; //用於在TWSE搜尋時
  now: number; //現價
  todayOpen: string; //開盤價
  lastClose: number; //昨日收盤價
  totalVolume: string; //總量
  high: string; //目前最高價
  low: string; //目前最低價
  highStop: number; //漲停價
  lowStop: number; //跌停價
  changeAmount?: number; //漲跌金額
  changeRate: string; //漲跌趴數
  fiveBuy: number[]; //五檔買價
  fiveBuyAmount: number[]; //五檔買量
  fiveSell: number[]; //五檔賣價
  fiveSellAmount: number[]; //五檔賣量
}
