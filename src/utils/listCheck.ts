import * as vscode from "vscode";

class ListCheck {
  public isEmptyList(): boolean {
    const config = vscode.workspace
      .getConfiguration()
      .get("twse-monitor.watchingList", {});
    if (Object.keys(config)[0]) {
      return false;
    }
    return true;
  }
  public isBecomeEmptyList(): boolean {
    const config = vscode.workspace
      .getConfiguration()
      .get("twse-monitor.watchingList", {});
    if (Object.keys(config)[1]) {
      return false;
    }
    return true;
  }
}

export default new ListCheck();
