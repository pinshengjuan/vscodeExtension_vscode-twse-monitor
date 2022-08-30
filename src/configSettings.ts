import * as vscode from "vscode";
import { Stock } from "./drawLayout";
import { twseApi, IndividualSecurities } from "./apis/twseApi";
import { StockFormat } from "./utils/stockFormat";

export class StockProvider implements vscode.TreeDataProvider<Stock> {
  public _onDidChangeTreeData: vscode.EventEmitter<Stock | undefined | void> =
    new vscode.EventEmitter<Stock | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<Stock | undefined | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: Stock): vscode.TreeItem {
    return element;
  }

  getChildren(): Promise<Array<Stock>> {
    return this.getWatchingList();
  }

  configuring(stocks: object): Promise<any> {
    return new Promise((resolve) => {
      const config = vscode.workspace.getConfiguration();
      const watchingList = Object.assign(
        {},
        config.get("twse-monitor.watchingList", {}),
        stocks
      );
      config
        .update("twse-monitor.watchingList", watchingList, true)
        .then(() => {
          resolve("update success on configuring");
        });
    });
  }

  async fetchConfig(stock: { [key: string]: Array<string> }) {
    const result = await twseApi(stock);
    console.log("fetch from twse api success");
    const insertStockObj: { [key: string]: number } = {};
    result.forEach((stockInfo) => {
      if (stockInfo) {
        /**
         * 最終settings.json內的格式為 "tse_2412.tw": 123
         * stockInfo.list.searchTicker = tse_2412.tw
         * stockInfo.list.now = 123
         */
        //
        insertStockObj[stockInfo.list.searchTicker] = stockInfo.list.now;
      }
    });
    await this.configuring(insertStockObj);
    return result;
  }

  async getWatchingList(): Promise<Array<Stock>> {
    const config = vscode.workspace
      .getConfiguration()
      .get("twse-monitor.watchingList", {});

    console.log("before fetch");
    const result: Array<Stock> = await this.fetchConfig(config);
    console.log("after fetch");
    return result;
  }

  async addToList() {
    const result = await vscode.window.showInputBox({
      value: "",
      prompt:
        '輸入股票代號並使用"半形空白"添加多筆, e.g., 2002 2412, (目前只支援上市/上櫃公司，興櫃尚未支援)',
      placeHolder: "Add Stock to List",
    });

    if (result !== undefined) {
      const codeArray = result.split(/[ ]/);
      const newStock: { [key: string]: Array<string> } = {};
      for (const stock of codeArray) {
        let tempStock = stock.trim();
        let tempStockTse = "";
        let tempStockOtc = "";
        if (stock !== "") {
          tempStockTse = "tse_" + tempStock + ".tw";
          tempStockOtc = "otc_" + tempStock + ".tw";
          newStock[tempStockTse] = [];
          newStock[tempStockOtc] = [];
        }
      }

      /**
       * 加入await避免還沒完成加入個股就fire
       */
      await this.fetchConfig(newStock);
      this._onDidChangeTreeData.fire();
    }
  }

  async removeFromList(stock: { list: IndividualSecurities }): Promise<any> {
    return new Promise((resolve) => {
      const { list } = stock;
      const config = vscode.workspace.getConfiguration();
      const tickets: StockFormat = Object.assign(
        {},
        config.get("twse-monitor.watchingList", {})
      );
      delete tickets[list.searchTicker];
      config.update("twse-monitor.watchingList", tickets, true).then(() => {
        resolve("update success on remove config");
        this._onDidChangeTreeData.fire();
      });
    });
  }
}
