import * as R from "ramda";
import { buildFullPath } from "./axios";
import { catcher } from "./catcher";

export type ConduitRequest<RequestBody extends object = object> = {
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: RequestBody;
};

export type ConduitResponse<ResponseBody extends object = object> = {
  data: ResponseBody;
  headers: Headers;
};

export type BaseConduitRequest<RequestBody extends object = object> = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: RequestBody;
  headers?: Record<string, string>;
};

export type ConduitConfig<GlobalResponseBody extends object = object> = ConduitRequest & {
  onRequest?: <RequestBody extends object = object, Request extends ConduitRequest<RequestBody> & BaseConduitRequest<RequestBody> = ConduitRequest<RequestBody> & BaseConduitRequest<RequestBody>>(
    request: Request,
  ) => Request | Promise<Request>;
  onResponse?: <ResponseBody extends object = object, Response extends ConduitResponse<ResponseBody> = ConduitResponse<ResponseBody>>(
    response: Response,
  ) => Response | Promise<Response>;
};

export const Conduit = {
  create: <GlobalResponseBody extends object = object>({
    onRequest = (request) => request,
    onResponse = (response) => response,
    ...restOfConfig
  }: ConduitConfig<GlobalResponseBody>) => {

    const mergeConfig = R.mergeDeepRight(restOfConfig);

    const request = async <ResponseBody extends object = object, RequestBody extends object = object>(options: BaseConduitRequest<RequestBody>): Promise<ConduitResponse<GlobalResponseBody & ResponseBody>> => {
      const mergedConfig = mergeConfig(options);
      const requestConfig = await onRequest(mergedConfig);

      const endpoint = new URL(
        buildFullPath(
          requestConfig.baseURL ?? window.location.origin,
          requestConfig.url
        )
      );

      const { params } = requestConfig;

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
        console.error(`(Conduit) [${response.status}] Fetch failed: ${await response.text()}`)
        throw new Error(
          `(Conduit) [${response.status}] [${endpoint}] Fetch failed: ${response.statusText}`,
        );
      }

      const contentType = response.headers.get("content-type");

      if (!contentType) {
        throw new Error(
          `(Conduit) [${response.status}] [${endpoint}] Fetch failed: Missing content type`,
        );
      }

      if (!contentType.includes("application/json")) {
        throw new Error(
          `(Conduit) [${response.status}] [${endpoint}] Fetch failed: Invalid content type. Expected application/json, got ${contentType}`,
        );
      }

      const responseData = await catcher<unknown>(response.json());

      if (responseData instanceof Error) {
        throw responseData;
      }

      if (typeof responseData !== "object") {
        throw new Error(
          `(Conduit) [${response.status}] [${endpoint}] Fetch failed: Invalid response data. Expected object, got ${typeof responseData}`,
        );
      }

      if (responseData === null) {
        throw new Error(
          `(Conduit) [${response.status}] [${endpoint}] Fetch failed: Invalid response data. Expected object, got null`,
        );
      }

      const responseHeaders = response.headers;

      const result = {
        data: responseData,
        headers: responseHeaders,
      } as ConduitResponse<GlobalResponseBody & ResponseBody>;

      return await onResponse(result);
    };

    return {
      get: async <ResponseBody extends object = object>(url: string, config?: ConduitRequest) => {
        return request<ResponseBody>({
          url,
          method: "GET",
          ...config,
        });
      },
      post: async <ResponseBody extends object = object, RequestBody extends object = object>(url: string, body?: RequestBody, config?: ConduitRequest<RequestBody>) => {
        return request<ResponseBody, RequestBody>({
          url,
          method: "POST",
          body,
          ...config,
        });
      },
      put: async <ResponseBody extends object = object, RequestBody extends object = object>(url: string, body?: RequestBody, config?: ConduitRequest<RequestBody>) => {
        return request<ResponseBody, RequestBody>({
          url,
          method: "PUT",
          body,
          ...config,
        });
      },
      patch: async <ResponseBody extends object = object, RequestBody extends object = object>(url: string, body?: RequestBody, config?: ConduitRequest<RequestBody>) => {
        return request<ResponseBody, RequestBody>({
          url,
          method: "PATCH",
          body,
          ...config,
        });
      },
      delete: async <ResponseBody extends object = object>(url: string, config?: ConduitRequest) => {
        return request<ResponseBody>({
          url,
          method: "DELETE",
          ...config,
        });
      },
    };
  },
};

export type ConduitInstance = ReturnType<typeof Conduit.create>;
