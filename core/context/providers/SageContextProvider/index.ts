import {
    ContextItem,
    ContextProviderDescription,
    ContextProviderExtras,
  } from "../../../index.js";
  import { BaseContextProvider } from "../../index.js";
  import { SageClient, LogEntry } from "./SageClient.js";

  class SageContextProvider extends BaseContextProvider {
    static description: ContextProviderDescription = {
      title: "sage",
      displayTitle: "SageQuery",
      description: "Get Sage MageQL query results",
      type: "query",
    };
  
    constructor(options: Array<{
      baseUrl: string;
      apiToken: string;
      resultsSize: number;
    }>) {
      super(options);
    }

    getApi() {
      return new SageClient({
          ...this.options,
          resultsSize: 50,
          apiToken: this.options.apiToken,
      });
    }
  
    async getContextItems(
      query: string,
      extras: ContextProviderExtras,
    ): Promise<ContextItem[]> {
      const api = this.getApi();
      const logs: LogEntry[] = await api.logs(query)
      const parts = [
        `# Sage Query ${query} Logs`,
        logs.reduce((acc, log) => `${JSON.stringify(log)}`, ""),
      ];
      const content = parts.join("\n\n");

      return [
        {
          name: `${query}`,
          content,
          description: `Logs for Sage Query ${query}`,
        },
      ];
    }
  }
  
  export default SageContextProvider;
  