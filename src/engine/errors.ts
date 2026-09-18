export class FormulaError extends Error {
  constructor(
    message: string,
    readonly position: number,
    readonly formula?: string,
  ) {
    super(message);
    this.name = "FormulaError";
  }
  format(): string {
    if (this.formula === undefined) {
      return `${this.message} (position ${this.position})`;
    }
    return `${this.message}\n  ${this.formula}\n  ${" ".repeat(this.position)}^`;
  }
}

export class DocumentError extends Error {
  constructor(
    message: string,
    readonly fields: readonly string[] = [],
  ) {
    super(message);
    this.name = "DocumentError";
  }
}
