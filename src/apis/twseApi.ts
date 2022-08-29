import * as vscode from "vscode";
import * as https from "https";
import { StockFormat } from "../utils/stockFormat";
import { Stock } from "../drawLayout";

const twseHttpRequest = async (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    https.get(url, (result) => {
      result.on("data", (data) => {
        let chunkJSON = JSON.parse(data);
        if (chunkJSON.rtcode === "0000") {
          resolve(chunkJSON);
        } else {
          console.log("return code: " + chunkJSON.rtcode);
          reject("httpRequest: Get data error");
        }
      });
    });
  });
};

export function twseApi(stockConfig: StockFormat): Promise<Array<Stock>> {
  const twseUrlPrefix =
    "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&lang=zh_tw&ex_ch=";
  const searchTickerUrl = twseUrlPrefix + Object.keys(stockConfig).join("|");
  console.log(Object.keys(stockConfig).join("|"));
  return new Promise(async (resolve) => {
    const twseRetData = await twseHttpRequest(searchTickerUrl);

    const resultArr: Array<Stock> = [];
    const upDownSymbolConfig: string[] = ["🔴", "🟡", "🟢"];
    for (
      let tickerNum = 0;
      tickerNum < twseRetData.msgArray.length;
      tickerNum++
    ) {
      let resultStock: IndividualSecurities;
      let jsonDataPrefix = twseRetData.msgArray[tickerNum];
      resultStock = {
        name: jsonDataPrefix.n,
        ticker: jsonDataPrefix.c,
        searchTicker: "tse_" + jsonDataPrefix.c + ".tw",
        now: +jsonDataPrefix.z,
        todayOpen: jsonDataPrefix.o,
        lastClose: +jsonDataPrefix.y, //The unary plus operator converts its operand to Number type, check https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators
        totalVolume: jsonDataPrefix.v,
        high: jsonDataPrefix.h,
        low: jsonDataPrefix.l,
        highStop: +jsonDataPrefix.u,
        lowStop: +jsonDataPrefix.w,
        changeRate: "",
        fiveBuy: [],
        fiveBuyAmount: [],
        fiveSell: [],
        fiveSellAmount: [],
      };
      if (resultStock !== undefined) {
        const {
          lastClose,
          searchTicker,
          fiveBuy,
          fiveBuyAmount,
          fiveSell,
          fiveSellAmount,
        } = resultStock;

        const config = vscode.workspace.getConfiguration("twse-monitor");
        let lastPrice = config[searchTicker];

        if (!lastPrice) {
          lastPrice = lastClose;
        }

        if (!resultStock.now) {
          resultStock.now = lastPrice;
        } //若盤中fetch出來為"-"表示fetch當下沒成交，所以keep上一次的值，上一次的值會被存在setting.json內

        // Here we calculate changeAmount
        resultStock.changeAmount = parseFloat(
          (resultStock.now - lastClose).toFixed(2)
        );

        // Here we calculate changeRate
        resultStock.changeRate =
          (resultStock.now - lastClose < 0 ? "-" : " ") +
          ((Math.abs(resultStock.now - lastClose) / lastClose) * 100)
            .toFixed(2)
            .toString() +
          "%";

        // Here we given a up/down symbol
        if (resultStock.changeAmount > 0) {
          //漲
          resultStock.upDownSymbol = upDownSymbolConfig[0];
        } else if (resultStock.changeAmount < 0) {
          //跌
          resultStock.upDownSymbol = upDownSymbolConfig[2];
        } else {
          //平盤
          resultStock.upDownSymbol = upDownSymbolConfig[1];
        }

        // Get five buy/sell
        for (let i = 0; i < jsonDataPrefix.b.split("_").length - 1; i++) {
          fiveBuy.push(+jsonDataPrefix.b.split("_")[i]);
          fiveBuyAmount.push(+jsonDataPrefix.g.split("_")[i]);
          fiveSell.push(+jsonDataPrefix.a.split("_")[i]);
          fiveSellAmount.push(+jsonDataPrefix.f.split("_")[i]);
        }
        resultArr.push(new Stock(resultStock));
      }
    }
    resolve(resultArr);
  });
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
