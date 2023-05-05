import * as R from "ramda";
import { catcher } from "./catcher";

type ConduitRequest = {
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: object;
};

type ConduitResponse = {
  data: object;
  headers: Headers;
};

type BaseConduitRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: object;
  headers?: Record<string, string>;
};

type ConduitConfig = ConduitRequest & {
  onRequest?: <Request extends ConduitRequest & BaseConduitRequest>(
    request: Request,
  ) => Request | Promise<Request>;
  onResponse?: <Response extends ConduitResponse>(
    response: Response,
  ) => Response | Promise<Response>;
};

export const Conduit = {
  create: (config: ConduitConfig) => {
    const request = async (options: BaseConduitRequest) => {
      const mergedConfig = R.mergeDeepRight(config, options);
      const requestConfig = await (config.onRequest
        ? config.onRequest(mergedConfig)
        : mergedConfig);

      const endpoint = new URL(requestConfig.url, requestConfig.baseURL);

      const params = requestConfig.params;

      if (params) {
        Object.keys(params).forEach((key) =>
          endpoint.searchParams.append(key, String(params[key])),
        );
      }

      const fetchOptions: RequestInit = {
        method: requestConfig.method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...requestConfig.headers,
        },
        body: JSON.stringify(requestConfig.body),
      };

      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        throw new Error(
          `(Conduit) [${response.status}] Fetch failed: ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type");

      if (!contentType) {
        throw new Error(
          `(Conduit) [${response.status}] Fetch failed: Missing content type`,
        );
      }

      if (!contentType.includes("application/json")) {
        throw new Error(
          `(Conduit) [${response.status}] Fetch failed: Invalid content type. Expected application/json, got ${contentType}`,
        );
      }

      const responseData = await catcher<unknown>(response.json());

      if (responseData instanceof Error) {
        throw responseData;
      }

      if (typeof responseData !== "object") {
        throw new Error(
          `(Conduit) [${
            response.status
          }] Fetch failed: Invalid response data. Expected object, got ${typeof responseData}`,
        );
      }

      if (responseData === null) {
        throw new Error(
          `(Conduit) [${response.status}] Fetch failed: Invalid response data. Expected object, got null`,
        );
      }

      const responseHeaders = response.headers;

      const result = {
        data: responseData,
        headers: responseHeaders,
      };

      if (config.onResponse) {
        return config.onResponse(result);
      }

      return result;
    };

    return {
      get: async (url: string, config?: ConduitRequest) => {
        return request({
          url,
          method: "GET",
          ...config,
        });
      },
      post: async (url: string, body?: object, config?: ConduitRequest) => {
        return request({
          url,
          method: "POST",
          body,
          ...config,
        });
      },
      put: async (url: string, body?: object, config?: ConduitRequest) => {
        return request({
          url,
          method: "PUT",
          body,
          ...config,
        });
      },
      patch: async (url: string, body?: object, config?: ConduitRequest) => {
        return request({
          url,
          method: "PATCH",
          body,
          ...config,
        });
      },
      delete: async (url: string, config?: ConduitRequest) => {
        return request({
          url,
          method: "DELETE",
          ...config,
        });
      },
    };
  },
};

export type ConduitInstance = ReturnType<typeof Conduit.create>;
