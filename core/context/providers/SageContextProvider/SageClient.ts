// @ts-ignore
import adf2md from "adf-to-md";

import { RequestOptions } from "../../../";

interface SageClientOptions {
  baseUrl?: string;
  apiToken: string;
  requestOptions?: RequestOptions;
  resultsSize: number;
}

interface LogEntry {
  msg: string;
  level: string;
  env: string;
  "@timestamp": string;
  system: string;
  extra: any;
  inst: string;
  [key: string]: string
}

interface QueryResult {
  summary: string;
}

interface QueryResults {
  hits: LogEntry[];
}

export class SageClient {
  private readonly options: Required<SageClientOptions>;

  constructor(options: SageClientOptions) {
    const { baseUrl, requestOptions, resultsSize, apiToken, ...rest } = options;
    
    this.options = {
      baseUrl: baseUrl || "https://sage.tcsbank.ru",
      apiToken: apiToken || "",
      requestOptions: {},
      resultsSize: resultsSize || 50,
      ...rest,
    };
  }

  async logs(
    query: string,
  ): Promise<Array<QueryResult>> {
    const endTime = new Date(); // now
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // -1h
    const request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.options.apiToken}`,
      },
      body: JSON.stringify({
        query,
        size: this.options.resultsSize,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      })
    }

    console.warn(request);

    const response = await fetch(`${this.options.baseUrl}/mage/api/search`, request);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }
    const result = await response.json();

    return result.map((logEntry: any) => ({
      level: logEntry.level,
      msg: logEntry.msg,
    }));
  }
}