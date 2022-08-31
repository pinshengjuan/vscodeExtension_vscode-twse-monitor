import { ExtensionContext, commands, window } from "vscode";
import { StockProvider } from "./configSettings";

export function activate(context: ExtensionContext) {
  const nodeProvider = new StockProvider();

  /**
   * set refreshing rate 2 seconds
   */
  setInterval(() => {
    nodeProvider._onDidChangeTreeData.fire();
  }, 2 * 1000);

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
