declare module "@marknotton/env" {
  class Env {
    data: { [index: string]: string | number | boolean | null };
    fileContents: string;
    envFilePath: string;

    constructor(envPath?: string);

    set(
      variable: string,
      value: string | number | boolean | null
    ): void | { error: any };

    delete(variable: string): void | { error: any };

    toggleBoolean(variable: string, boolean: boolean): void;

    get(variable: string): string | undefined;

    has(variable: string): boolean;
  }

  export = Env;
}