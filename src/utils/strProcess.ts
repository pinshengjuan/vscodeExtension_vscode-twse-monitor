class StrProcess {
  public strFormatting(
    sourceString: string,
    totalLength: number,
    fullWidth = false
  ): string {
    const sourceStringLength: number = sourceString.length;
    let dummySpaces: string = "";

    for (let i = 0; i < totalLength - sourceStringLength; i++) {
      if (fullWidth) {
        dummySpaces += "　"; //全形空白
      } else {
        dummySpaces += " ";
      }
    }

    return sourceString + dummySpaces;
  }
}

export default new StrProcess();
