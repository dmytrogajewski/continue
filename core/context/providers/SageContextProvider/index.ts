import {
    ContextItem,
    ContextProviderDescription,
    ContextProviderExtras,
  } from "../../../index.js";
  import { BaseContextProvider } from "../../index.js";
  import { SageClient } from "./SageClient.js";

  class SageContextProvider extends BaseContextProvider {
    static description: ContextProviderDescription = {
      title: "sage",
      displayTitle: "Sage Query results",
      description: "Get Sage MageQL query results",
      type: "normal",
    };
  
    getApi() {
      return new SageClient({
          ...this.options,
          apiToken: this.options.apiToken,
      });
    }
  
    async getContextItems(
      query: string,
      extras: ContextProviderExtras,
    ): Promise<ContextItem[]> {
      const issueId = query;
  
      const api = this.getApi();
      const logs = await api.logs(query)
      const parts = [
        `# Sage Query ${query} Logs`,
        logs.reduce((acc, log) => `${acc}\n${log}`, ""),
        "## Summary",
        logs.reduce((acc, log) => `${acc}\n${log.summary ?? "No summary"}`, ""),
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
  