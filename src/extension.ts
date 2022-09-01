import { ExtensionContext, commands, window, workspace } from "vscode";
import { StockProvider } from "./configSettings";

export function activate(context: ExtensionContext) {
  const nodeProvider = new StockProvider();

  /**
   * set refreshing rate by user defined
   */
  const config = workspace.getConfiguration("twse-monitor");
  const refreshingRate: number = config["refreshingRate"];
  setInterval(() => {
    nodeProvider._onDidChangeTreeData.fire();
  }, refreshingRate * 1000);

  window.registerTreeDataProvider("twse-monitor", nodeProvider);

  context.subscriptions.push(
    commands.registerCommand("twse-monitor.add", () => {
      nodeProvider.addToList();
    }),
    commands.registerCommand("twse-monitor.item.remove", (stock) => {
      nodeProvider.removeFromList(stock);
    })
  ); // subscriptions
}

export function deactivate() {}
