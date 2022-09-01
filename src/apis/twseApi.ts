import * as vscode from "vscode";
import * as https from "https";
import { StockFormat } from "../utils/stockFormat";
import { Stock } from "../drawLayout";
import { IndividualSecurities } from "../utils/stockFormat";

const twseHttpRequest = async (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (result) => {
      let data = "";
      result.on("data", (chunk) => {
        data = data + chunk.toString();
      });
      result.on("end", () => {
        const body = JSON.parse(data);
        // console.log(body);
        if (body.rtcode === "0000") {
          resolve(body);
        } else {
          console.log("return code: " + body.rtcode);
          reject("httpRequest: Get data error");
        }
      });
    });
    request.on("error", (error) => {
      console.log("!!!error!!! from https.get", error);
    });
  });
};

export function twseApi(stockConfig: StockFormat): Promise<Array<Stock>> {
  const twseUrlPrefix =
    "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&lang=zh_tw&ex_ch=";
  const searchTickerUrl = twseUrlPrefix + Object.keys(stockConfig).join("|");
  console.log(Object.keys(stockConfig).join("|"));
  return new Promise(async (resolve) => {
    console.log("before http request");
    const twseRetData = await twseHttpRequest(searchTickerUrl);
    console.log("after http request");

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
        searchTicker: jsonDataPrefix.ex + "_" + jsonDataPrefix.ch,
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
        userDefinedDisplay: "",
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

        const config = vscode.workspace.getConfiguration(
          "twse-monitor.watchingList"
        );
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

        //在這邊修改使用者想要顯示在list上漲跌的單位(元 / 百分比);
        const vscConfig = vscode.workspace.getConfiguration("twse-monitor");
        const userDefineConfig: string = vscConfig["displayChangeUnitIn"];
        if (userDefineConfig === "元") {
          resultStock.userDefinedDisplay = resultStock.changeAmount.toString();
        } else {
          resultStock.userDefinedDisplay = resultStock.changeRate;
        }

        resultArr.push(new Stock(resultStock));
      }
    }
    resolve(resultArr);
  });
}
