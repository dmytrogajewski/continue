// @ts-ignore
import adf2md from "adf-to-md";

import { RequestOptions } from "../../../";

interface SageClientOptions {
  baseUrl?: string;
  apiToken: string;
  requestOptions?: RequestOptions;
}

interface LogEntry {
  id: string;
  level: number;
  message: string;
}

interface QueryResult {
  summary: string;
}

interface QueryResults {
  issues: LogEntry[];
}

export class SageClient {
  private readonly options: Required<SageClientOptions>;
  private baseUrl: string = "https://sage.tcsbank.ru";
  private apiToken: string = "";

  constructor(options: SageClientOptions) {
    const { baseUrl, requestOptions, ...rest } = options;
    
    this.options = {
      baseUrl: baseUrl || this.baseUrl,
      requestOptions: {},
      ...rest,
    };
  }

  async logs(
    query: string,
  ): Promise<Array<QueryResult>> {
    const response = await fetch(`${this.baseUrl}/search?fields=id,level,message&query=${ query }`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiToken}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }
    const result = await response.json();

    return result.map((logEntry: any) => ({
      id: logEntry.id,
      level: logEntry.level,
      message: logEntry.message,
    }));
  }
}