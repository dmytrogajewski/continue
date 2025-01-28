import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  ContextSubmenuItem,
  LoadSubmenuItemsArgs,
} from "../../../index.js";
import { BaseContextProvider } from "../../index.js";
import { JiraClient } from "./JiraClient.js";

class JiraClientManager {
  private clients: Map<string, JiraClient>;

  constructor(jiraConfigs: Array<{
    domain: string;
    email: string;
    token: string;
    issueQuery?: string;
    apiVersion?: string;
    requestOptions?: any;
  }>) {
    this.clients = new Map();

    jiraConfigs.forEach((config) => {
      const client = new JiraClient({
        domain: config.domain,
        username: config.email,
        password: config.token,
        issueQuery: config.issueQuery,
        apiVersion: config.apiVersion || "2", // Default to API version 2
        requestOptions: config.requestOptions,
      });

      this.clients.set(config.domain, client);
    });
  }

  getClient(domain: string): JiraClient | undefined {
    return this.clients.get(domain);
  }

  getAllClients(): JiraClient[] {
    return Array.from(this.clients.values());
  }
}

class JiraIssuesContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "jira",
    displayTitle: "Jira Issues",
    description: "Reference Jira issues from multiple instances",
    type: "submenu",
  };

  private jiraClientManager: JiraClientManager;

  constructor(jiraConfigs: Array<{
    domain: string;
    email: string;
    token: string;
    issueQuery?: string;
    apiVersion?: string;
    requestOptions?: any;
  }>) {
    super(jiraConfigs);
    this.jiraClientManager = new JiraClientManager(jiraConfigs);
  }

  // here we do request one after another in order to limit the number of requests
  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    const parts = [];
    let content = "";

    for (const client of this.jiraClientManager.getAllClients().values()) {
      try {
        const issue = await client.issue(query, extras.fetch);

        if (issue) {
          parts.push(`# Jira Issue ${issue.key} from ${client.domain}: ${issue.summary}`);
          parts.push("## Description");
          parts.push(issue.description ?? "No description");

          if (issue.comments.length > 0) {
            parts.push("## Comments");

            issue.comments.forEach((comment) => {
              parts.push(`### ${comment.author.displayName} on ${comment.created}\n\n${comment.body}`);
            });
          }

          content += parts.join("\n\n") + "\n\n";

          break; // We exit after finding issue to avoid duplicates.`);
        }
    } catch (ex) {
        console.error(`Unable to get Jira issue from ${client.domain}: ${ex}`);
    }
  }

    if (!content.trim()) return [];

    return [
      {
        name: `Multiple Jira Issues for query "${query}"`,
        content,
        description: "Search results across multiple Jira instances",
      },
    ];
}

  // here we do promise.all for good user experience avoiding long loading times if one of the clients fails.
  async loadSubmenuItems(
    args: LoadSubmenuItemsArgs,
  ): Promise<ContextSubmenuItem[]> {
  const clientPromises = this.jiraClientManager.getAllClients().map(async (client) => {
    try {
        const issues = await client.listIssues(args.fetch);

        return issues.map((issue) => ({
              id: `${client.domain}-${issue.id}`,
              title: `${issue.key} from ${client.domain}: ${issue.summary}`,
              description: "",
        }));
    } catch (ex) {
      console.error(`Unable to get Jira tickets from ${client.domain}: ${ex}`);
      return [];
    }
  });

  const submenuItemsArrays = await Promise.all(clientPromises);

  return submenuItemsArrays.flat();
  }
}

export default JiraIssuesContextProvider;
