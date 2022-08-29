import * as vscode from "vscode";
import { IndividualSecurities } from "./apis/twseApi";
import StrProcess from "./utils/strProcess";

export class Stock extends vscode.TreeItem {
  list: IndividualSecurities;

  constructor(info: IndividualSecurities) {
    super(
      // use template literals
      `${info.upDownSymbol} ${StrProcess.strFormatting(
        info.name,
        9,
        true //full width
      )} ${StrProcess.strFormatting(info.changeRate, 10)} ${info.now}`
    );
    this.list = info;

    const mdDetails = new vscode.MarkdownString();
    mdDetails.appendMarkdown(`
${StrProcess.strFormatting("公司", 6, true)}      ${info.name}\n
${StrProcess.strFormatting("代號", 6, true)}      ${info.ticker}\n
${StrProcess.strFormatting("漲停價", 6, true)}     ${info.highStop}\n
${StrProcess.strFormatting("跌停價", 6, true)}     ${info.lowStop}\n
${StrProcess.strFormatting("累積成交量", 6, true)}  ${info.totalVolume}\n
-----------------------------------------------------------------
${StrProcess.strFormatting("幅度", 6, true)}       ${info.changeRate}\n
${StrProcess.strFormatting("漲跌", 6, true)}       ${info.changeAmount}\n
${StrProcess.strFormatting("開盤", 6, true)}       ${info.todayOpen}\n
${StrProcess.strFormatting("昨收", 6, true)}       ${info.lastClose}\n
-----------------------------------------------------------------
${StrProcess.strFormatting("最高", 6, true)}       ${info.high}\n
${StrProcess.strFormatting("最低", 6, true)}       ${info.low}\n
-----------------------------------------------------------------
`);
    mdDetails.appendCodeblock(
      `
 買量　  |　  買價　 ||    賣價　 |　賣量`,
      "javascript"
    );

    for (let i = 0; i < info.fiveBuyAmount.length; i++) {
      mdDetails.appendCodeblock(
        ` ${StrProcess.strFormatting(
          info.fiveBuyAmount[i].toString(),
          6
        )} | ${StrProcess.strFormatting(
          info.fiveBuy[i].toString(),
          8
        )} || ${StrProcess.strFormatting(
          info.fiveSell[i].toString(),
          8
        )} |  ${StrProcess.strFormatting(
          info.fiveSellAmount[i].toString(),
          6
        )}`,
        "javascript"
      );
    }
    this.tooltip = mdDetails;
  }
}
