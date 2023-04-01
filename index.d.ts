declare module '@marknotton/env' {
  function getFile(envPath?: string): string | { error: Error };
  function getData(request?: string, envPath?: string): { [key: string]: string } | { error: Error } | string;
  function setVariable(variable: string, value?: unknown): { error: Error } | void;
  function getVariable(variable: string): string | undefined;
  function deleteVariable(variable: string): { error: Error } | void;
  function toggleBooleanVariable(variable: string, boolean: boolean): void;
}